"""Cloud Kokoro worker. Run as a single private process, never in the browser."""
import asyncio
import io
import hashlib
import json
import math
import subprocess
import tempfile
from pathlib import Path
from mutagen.mp3 import MP3, HeaderNotFoundError
import logging
import os
import re
import time
from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI
from supabase import create_client
import boto3

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("arquivo-voz")
URL = os.environ["SUPABASE_URL"]
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
KOKORO = os.getenv("KOKORO_URL", "http://kokoro:8880").rstrip("/")
POLL = max(10, int(os.getenv("POLL_SECONDS", "30")))
db = create_client(URL, KEY)
r2 = boto3.client("s3", endpoint_url=os.environ["R2_ENDPOINT"], aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"], aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"], region_name="auto")
R2_BUCKET = os.environ["R2_BUCKET"]
running = True

def chunks(text: str, limit=900):
    """Preserve punctuation and UTF-8; never strip Portuguese diacritics."""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    out, current = [], ""
    for sentence in sentences:
        if len(sentence) > limit:
            if current: out.append(current); current = ""
            out.extend(sentence[i:i+limit] for i in range(0,len(sentence),limit))
        elif len(current)+len(sentence)+1 > limit:
            if current: out.append(current)
            current = sentence
        else:
            current = (current+" "+sentence).strip()
    if current: out.append(current)
    return out


def validated_segment(raw: bytes, label: str) -> float:
    """Reject empty, truncated, or implausibly short Kokoro segments."""
    if len(raw) < 1024:
        raise ValueError(f"{label}: MP3 segment is too small")
    try:
        info = MP3(io.BytesIO(raw)).info
        duration = float(info.length)
        bitrate = int(info.bitrate)
    except (HeaderNotFoundError, ValueError, TypeError, AttributeError) as exc:
        raise ValueError(f"{label}: malformed MP3 segment") from exc
    if not math.isfinite(duration) or duration < 0.25 or bitrate <= 0:
        raise ValueError(f"{label}: invalid MP3 duration or bitrate")
    return duration


def finalize_verified_mp3(segments: list[bytes], expected_duration: float) -> tuple[bytes, float]:
    """Decode and re-encode segments as one seekable MP3; probe the entire output."""
    with tempfile.TemporaryDirectory(prefix="arquivo-voz-") as folder:
        root = Path(folder)
        manifest = root / "segments.txt"
        manifest.write_text(
            "".join(f"file '{(root / f'segment-{i:04d}.mp3').as_posix()}'\\n"
                    for i in range(len(segments))), encoding="utf-8"
        )
        for i, payload in enumerate(segments):
            (root / f"segment-{i:04d}.mp3").write_bytes(payload)
        target = root / "verified.mp3"
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
             "-f", "concat", "-safe", "0", "-i", str(manifest),
             "-vn", "-c:a", "libmp3lame", "-q:a", "3", str(target)],
            check=True, capture_output=True, text=True, timeout=900
        )
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "a:0",
             "-show_entries", "stream=codec_name:format=duration",
             "-of", "json", str(target)],
            check=True, capture_output=True, text=True, timeout=90
        )
        info = json.loads(probe.stdout)
        streams = info.get("streams") or []
        duration = float((info.get("format") or {}).get("duration") or 0)
        if not streams or streams[0].get("codec_name") != "mp3":
            raise ValueError("Final recording does not have an MP3 audio stream")
        if not math.isfinite(duration) or duration < 0.25:
            raise ValueError("Final MP3 duration is invalid")
        # Detect major truncation or unexpected concatenation/encoding failures.
        if duration < expected_duration * 0.90 or duration > expected_duration * 1.10 + 2:
            raise ValueError(
                f"Final MP3 duration mismatch: expected {expected_duration:.1f}s; "
                f"got {duration:.1f}s"
            )
        payload = target.read_bytes()
        validated_segment(payload, "final recording")
        if len(payload) < 1024:
            raise ValueError("Final recording is unexpectedly small")
        return payload, duration

async def process(job):
    parts = chunks(job["narration_text"])
    if not parts:
        raise ValueError("Empty narration")
    segments = []
    expected_duration = 0.0
    async with httpx.AsyncClient(timeout=240, headers={"Authorization": "Bearer " + os.environ["KOKORO_API_KEY"]}) as client:
        for i, part in enumerate(parts):
            response = await client.post(KOKORO + "/v1/audio/speech", json={
                "model": "tts-1", "input": part, "voice": job["voice"],
                "response_format": "mp3", "speed": float(job["speed"])
            })
            response.raise_for_status()
            segment_duration = validated_segment(response.content, f"segment {i+1}")
            expected_duration += segment_duration
            segments.append(response.content)
            log.info("job %s validated segment %s/%s (%.2fs)", job["id"], i+1, len(parts), segment_duration)

    audio, duration = finalize_verified_mp3(segments, expected_duration)
    digest = hashlib.sha256(audio).hexdigest()
    path = f'{job["content_type"]}/{job["content_id"]}/{job["source_hash"]}/{job["id"]}.mp3'
    r2.put_object(
        Bucket=R2_BUCKET, Key=path, Body=audio, ContentType="audio/mpeg",
        CacheControl="private, max-age=0",
        Metadata={"sha256": digest, "duration-seconds": f"{duration:.3f}"}
    )
    # Never publish an object unless R2 confirms the uploaded size and digest.
    object_info = r2.head_object(Bucket=R2_BUCKET, Key=path)
    remote_size = int(object_info.get("ContentLength", 0))
    remote_digest = (object_info.get("Metadata") or {}).get("sha256")
    if remote_size != len(audio) or remote_digest != digest:
        raise ValueError("R2 upload verification failed: size or digest mismatch")
    result = db.table("arquivo_voz_cloud_jobs").update({
        "status": "approved" if job["content_type"] in ("dossie", "garimpo", "pericia", "lenda", "creepypasta") and int(job["content_id"]) > 0 else "review",
        "audio_path": path, "error": None
    }).eq("id", job["id"]).execute()
    if not result.data:
        raise RuntimeError("Audio verified but job database update failed")
    log.info("job %s verified and stored: %s bytes, %.2fs, sha256=%s", job["id"], len(audio), duration, digest)



async def process_novel(job):
    """Narrate a published chapter; do not publish until reviewed and aligned."""
    chapter = db.table("novel_capitulos").select("id,novel_id,conteudo,status_publicacao").eq("id",job["capitulo_id"]).single().execute().data
    novel = db.table("novels").select("status_publicacao").eq("id",chapter["novel_id"]).single().execute().data
    if chapter["status_publicacao"] != "publicado" or novel["status_publicacao"] != "publicado":
        raise ValueError("Chapter or novel is no longer published")
    import hashlib
    source = chapter["conteudo"] or ""
    if hashlib.md5(source.encode("utf-8")).hexdigest() != job["texto_hash"]:
        raise ValueError("Chapter text changed; queue a fresh narration")
    # Preserve chapter paragraph boundaries for genuine, audio-derived alignment.
    from mutagen.mp3 import MP3
    paragraphs = [p.strip() for p in re.split(r"\\n\\s*\\n", source) if p.strip()]
    segments = [(index, part) for index, paragraph in enumerate(paragraphs) for part in chunks(paragraph)]
    if not segments:
        raise ValueError("Empty chapter")
    audio = io.BytesIO()
    alignment = []
    elapsed = 0.0
    async with httpx.AsyncClient(timeout=240, headers={"Authorization": "Bearer " + os.environ["KOKORO_API_KEY"]}) as client:
        for index, (paragraph_index, part) in enumerate(segments):
            response = await client.post(KOKORO + "/v1/audio/speech", json={
                "model": "tts-1", "input": part, "voice": job["voz"],
                "response_format": "mp3", "speed": float(job["velocidade"])
            })
            response.raise_for_status()
            if not response.content.startswith(b"ID3") and response.content[:2] not in (bytes([255,251]), bytes([255,243]), bytes([255,242])):
                raise ValueError("Kokoro returned non-MP3 response")
            duration = float(MP3(io.BytesIO(response.content)).info.length)
            if duration <= 0:
                raise ValueError("MP3 duration invalid")
            if alignment and alignment[-1]["paragraph"] == paragraph_index:
                alignment[-1]["end"] = round(elapsed + duration, 3)
            else:
                alignment.append({"paragraph": paragraph_index, "start": round(elapsed, 3),
                                  "end": round(elapsed + duration, 3)})
            audio.write(response.content)
            elapsed += duration
            log.info("novel audio %s segment %s/%s", job["id"], index+1, len(segments))
    if audio.tell() < 1024:
        raise ValueError("Audio too small")
    path = f'novel/{job["capitulo_id"]}/{job["texto_hash"]}/{job["id"]}.mp3'
    r2.put_object(Bucket=R2_BUCKET, Key=path, Body=audio.getvalue(),
                  ContentType="audio/mpeg", CacheControl="private, max-age=0")
    # User authorized publishing after technical checks; failures remain private.
    # Alignment is based on measured segment durations, not estimated word timing.
    db.table("novel_capitulo_audios").update({
        "status": "approved", "caminho_audio": path, "erro": None,
        "alinhamento": alignment, "duracao_segundos": round(elapsed, 3)
    }).eq("id", job["id"]).execute()

async def loop():
    once = os.getenv("RUN_ONCE", "false").lower() == "true"
    # Scheduled runners can drain more than one Kokoro job without running indefinitely.
    max_jobs = max(1, min(3, int(os.getenv("MAX_JOBS_PER_RUN", "2")))) if once else 0
    deadline = time.monotonic() + max(60, int(os.getenv("MAX_RUN_SECONDS", "5400"))) if once else None
    processed = 0
    while running:
        try:
            db.rpc("enqueue_published_dossier_audio").execute()
            db.rpc("enqueue_remaining_archive_kokoro").execute()
            result = db.rpc("claim_arquivo_voz_cloud_job").execute()
            jobs = result.data or []
            if jobs:
                job = jobs[0]
                try: await process(job)
                except Exception as e:
                    log.exception("job failed")
                    db.table("arquivo_voz_cloud_jobs").update({
                        "status":"failed","error":str(e)[:400]
                    }).eq("id",job["id"]).execute()
                processed += 1
                if once and (processed >= max_jobs or time.monotonic() >= deadline): return
            else:
                # Novel generation is paused by editorial decision.
                # Do not enqueue or claim novel chapter jobs.
                if once: return
                await asyncio.sleep(POLL)
        except Exception:
            log.exception("worker loop error")
            if once: return
            await asyncio.sleep(POLL)

@asynccontextmanager
async def lifespan(app):
    task=asyncio.create_task(loop())
    yield
    global running
    running=False
    task.cancel()

app=FastAPI(lifespan=lifespan)
@app.get("/health")
def health():
    return {"ok":True,"worker":"arquivo-voz-cloud"}
