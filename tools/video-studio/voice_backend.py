"""Bridge to an isolated Chatterbox environment; no heavy imports in the UI."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import queue
import time

ROOT = Path(__file__).resolve().parent
ENGINE_VERSION = 'chatterbox-0.1.7-mtl-whisper-base-v1'


def voice_python():
    return ROOT / '.venv_voice' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')


def voice_available():
    return voice_python().is_file()


def run_worker(job, progress):
    python = voice_python()
    if not python.is_file():
        raise ValueError('Execute INSTALAR_MINHA_VOZ.bat uma vez e reinicie o Studio.')
    with tempfile.TemporaryDirectory(prefix='studio-voice-') as temp:
        jobfile = Path(temp) / 'job.json'
        jobfile.write_text(json.dumps(job, ensure_ascii=False), encoding='utf-8')
        env = dict(os.environ, PYTHONUTF8='1', HF_HUB_DISABLE_TELEMETRY='1', DO_NOT_TRACK='1')
        # Never send the caller's API credentials to the voice process.
        for key in list(env):
            if any(token in key.upper() for token in ('API_KEY', 'ACCESS_TOKEN', 'HF_TOKEN')):
                env.pop(key, None)
        proc = subprocess.Popen([str(python), '-u', str(ROOT / 'voice_worker.py'), '--job', str(jobfile)],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8',
            errors='replace', env=env, cwd=str(ROOT))
        messages = queue.Queue()
        def reader():
            for line in proc.stdout:
                if line.startswith('STUDIO_VOICE:'):
                    messages.put(line[len('STUDIO_VOICE:'):])
            messages.put(None)
        thread = threading.Thread(target=reader, daemon=True)
        thread.start()
        last_heartbeat = time.monotonic()
        error = None
        try:
            while True:
                try:
                    line = messages.get(timeout=1)
                except queue.Empty:
                    if time.monotonic() - last_heartbeat > 25:
                        progress('Processando voz local… O primeiro uso também baixa os modelos. Não feche a janela.')
                        last_heartbeat = time.monotonic()
                    continue
                if line is None:
                    break
                try:
                    message = json.loads(line)
                except ValueError:
                    continue
                if message.get('error'):
                    error = str(message['error'])
                elif message.get('progress'):
                    progress(str(message['progress']))
            code = proc.wait()
        finally:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill(); proc.wait()
            proc.stdout.close()
        if code or error:
            raise ValueError(error or 'A voz local foi interrompida. Confira memória disponível e a instalação de voz.')


def prepare_cloned_audio(plan, folder, profile_id, progress):
    from engine import duration, ffmpeg, read_srt, run, write_srt
    from voice_profiles import get_profile
    profile = get_profile(profile_id)
    folder = Path(folder).resolve(); folder.mkdir(parents=True, exist_ok=True)
    jobs, paths = [], []
    for scene in plan['scenes']:
        identity = hashlib.sha256((ENGINE_VERSION + profile['sha256'] + '\n' + scene['text']).encode()).hexdigest()[:20]
        wav = folder / ('voice-' + identity + '.wav')
        srt = wav.with_suffix('.srt')
        paths.append((wav, srt))
        if not (wav.is_file() and srt.is_file()):
            jobs.append({'text': scene['text'], 'wav': str(wav), 'srt': str(srt)})
    if jobs:
        run_worker({'reference': profile['reference'], 'scenes': jobs}, progress)
    lengths, cues = [], []
    offset = 0.
    for wav, srt in paths:
        length = duration(wav)
        scene_cues = read_srt(srt)
        if max(end for _, end, _ in scene_cues) > length + .5:
            raise ValueError('Legenda da voz local inválida. Remova o cache voice- desta cena e gere novamente.')
        lengths.append(length)
        cues.extend((a+offset, min(b,length)+offset, text) for a,b,text in scene_cues)
        offset += length
    # Generated hex filenames only; use a dedicated list to preserve the Edge cache.
    (folder/'voice-list.txt').write_text('\n'.join(f"file '{p.name}'" for p,_ in paths), encoding='utf-8')
    audio = folder/'narracao.wav'
    run([ffmpeg(), '-y', '-v', 'error', '-f', 'concat', '-safe', '1', '-i', 'voice-list.txt',
         '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', audio.name], cwd=folder)
    write_srt(cues, folder/'legendas.srt')
    return str(audio), lengths, cues
