"""Isolated local synthesis and ASR. Reference audio never goes to a remote API."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import wave


def event(**data):
    print('STUDIO_VOICE:' + json.dumps(data, ensure_ascii=False), flush=True)


def split_text(text, limit=200):
    words = text.split()
    if any(len(w) > limit for w in words):
        raise ValueError('Há uma palavra longa demais no roteiro. Confira o texto da cena.')
    chunks, current = [], ''
    for word in words:
        if current and len(current) + len(word) + 1 > limit:
            chunks.append(current); current = ''
        current = (current + ' ' + word).strip()
        if len(current) >= 80 and re.search(r'[.!?]$', current):
            chunks.append(current); current = ''
    if current:
        chunks.append(current)
    if not chunks:
        raise ValueError('A cena não tem texto para narrar.')
    return chunks


def stamp(value):
    ms = max(0, round(value*1000)); hours, ms = divmod(ms, 3600000)
    minutes, ms = divmod(ms, 60000); seconds, ms = divmod(ms, 1000)
    return f'{hours:02}:{minutes:02}:{seconds:02},{ms:03}'


def make_cues(segments, duration):
    cues, words = [], []
    for segment in segments:
        for word in segment.words or []:
            token = word.word.strip()
            if not token:
                continue
            if words and (len(' '.join(x[2] for x in words)) + len(token) + 1 > 58 or len(words) >= 9):
                cues.append((words[0][0], words[-1][1], ' '.join(x[2] for x in words)))
                words = []
            start, end = max(0., float(word.start)), min(duration, float(word.end))
            if end > start:
                words.append((start, end, token))
    if words:
        cues.append((words[0][0], words[-1][1], ' '.join(x[2] for x in words)))
    if not cues:
        raise ValueError('A transcrição não identificou fala. Ouça o áudio e tente novamente.')
    return cues


def synthesize_scene(model, recognizer, scene, reference, torch, np):
    output = Path(scene['wav']); output.parent.mkdir(parents=True, exist_ok=True)
    # Keep successful synthesis if ASR fails, so retry does not repeat the expensive step.
    if not output.exists():
        pieces = []
        chunks = split_text(scene['text'])
        for i, text in enumerate(chunks):
            event(progress=f'Gerando trecho {i+1}/{len(chunks)} da cena…')
            seed = int(hashlib.sha256((reference+text).encode()).hexdigest()[:8], 16)
            torch.manual_seed(seed)
            if torch.cuda.is_available():
                torch.cuda.manual_seed_all(seed)
            wav = model.generate(text, language_id='pt', audio_prompt_path=reference,
                                 exaggeration=.35, cfg_weight=.5, temperature=.7)
            pcm = wav.detach().cpu().numpy().reshape(-1)
            if not np.isfinite(pcm).all() or len(pcm) < model.sr * .2:
                raise ValueError('O modelo devolveu um áudio inválido. Revise a gravação de referência.')
            pieces.append(pcm)
            if i < len(chunks)-1:
                pieces.append(np.zeros(round(model.sr*.12), dtype=np.float32))
        pcm = np.concatenate(pieces)
        partial = output.with_suffix('.partial.wav')
        with wave.open(str(partial), 'wb') as f:
            f.setnchannels(1); f.setsampwidth(2); f.setframerate(model.sr)
            f.writeframes((np.clip(pcm,-1,1)*32767).astype('<i2').tobytes())
        partial.replace(output)
    with wave.open(str(output), 'rb') as f:
        duration = f.getnframes()/f.getframerate()
    event(progress='Sincronizando legendas com o áudio gerado…')
    segments, _ = recognizer.transcribe(str(output), language='pt', word_timestamps=True,
                                       vad_filter=True, beam_size=5)
    cues = make_cues(segments, duration)
    srt = Path(scene['srt']); partial = srt.with_suffix('.partial.srt')
    partial.write_text('\n\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{t}'
                                  for i,(a,b,t) in enumerate(cues,1))+'\n', encoding='utf-8')
    partial.replace(srt)


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--job', required=True)
    args = parser.parse_args()
    job = json.loads(Path(args.job).read_text(encoding='utf-8'))
    import torch
    import numpy as np
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    from faster_whisper import WhisperModel
    # CPU is portable; an existing compatible CUDA installation is detected automatically.
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    event(progress=f'Carregando Chatterbox Multilingual ({device}). Primeiro uso baixa os modelos…')
    model = ChatterboxMultilingualTTS.from_pretrained(device=device)
    event(progress='Carregando transcrição local. Primeiro uso baixa o modelo de legendas…')
    recognizer = WhisperModel('base', device='cpu', compute_type='int8')
    for i, scene in enumerate(job['scenes']):
        event(progress=f'Minha voz: cena {i+1}/{len(job["scenes"])}…')
        synthesize_scene(model, recognizer, scene, job['reference'], torch, np)
    event(progress='Narração e legendas locais concluídas.')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        # Do not forward library tracebacks containing local sample paths or credentials.
        if isinstance(exc, ValueError):
            message = str(exc)
        elif isinstance(exc, ImportError):
            message = 'Dependência de voz ausente ou incompatível. Execute INSTALAR_MINHA_VOZ.bat novamente.'
        else:
            message = ('Falha na voz local ('+type(exc).__name__+'). Confira internet no primeiro uso, '
                       'espaço em disco e memória disponível. Execute INSTALAR_MINHA_VOZ.bat se necessário.')
        event(error=message)
        raise SystemExit(1)
