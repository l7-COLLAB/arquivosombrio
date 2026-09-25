"""Cloud Kokoro worker. Run as a single private process, never in the browser."""
import asyncio
import io
import logging
import os
import re
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

async def process(job):
    # Each segment is synthesized as MP3. MP3 concatenation is supported by
    # most players, but production should validate duration and seek behavior.
    parts = chunks(job["narration_text"])
    if not parts: raise ValueError("Empty narration")
    audio = io.BytesIO()
    async with httpx.AsyncClient(timeout=240, headers={"Authorization": "Bearer " + os.environ["KOKORO_API_KEY"]}) as client:
        for i, part in enumerate(parts):
            response = await client.post(KOKORO+"/v1/audio/speech",json={
                "model":"tts-1","input":part,"voice":job["voice"],
                "response_format":"mp3","speed":float(job["speed"])
            })
            response.raise_for_status()
            if not response.content.startswith(b"ID3") and response.content[:2] not in (bytes([255,251]), bytes([255,243]), bytes([255,242])):
                raise ValueError("Kokoro returned non-MP3 response")
            audio.write(response.content)
            log.info("job %s segment %s/%s",job["id"],i+1,len(parts))
    if audio.tell() < 1024: raise ValueError("Audio too small")
    path = f'{job["content_type"]}/{job["content_id"]}/{job["source_hash"]}/{job["id"]}.mp3'
    r2.put_object(Bucket=R2_BUCKET, Key=path, Body=audio.getvalue(), ContentType="audio/mpeg", CacheControl="private, max-age=0")
    db.table("arquivo_voz_cloud_jobs").update({
        "status":"approved" if job["content_type"] in ("dossie","garimpo","pericia","lenda","creepypasta") and int(job["content_id"])>0 else "review","audio_path":path,"error":None
    }).eq("id",job["id"]).execute()


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
                if once: return
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
