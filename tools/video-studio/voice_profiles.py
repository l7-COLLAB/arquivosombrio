"""Private local voice profiles. Never added to project exports."""
from array import array
import hashlib
import json
from pathlib import Path
import re
import shutil
import tempfile
import uuid
import wave

ROOT = Path(__file__).resolve().parent
VOICES = ROOT / 'voices'
DEFAULTS = VOICES / 'defaults.json'


def read_defaults():
    try:
        value = json.loads(DEFAULTS.read_text(encoding='utf-8'))
        return value if isinstance(value, dict) else {}
    except (OSError, ValueError):
        return {}


def save_defaults(provider, profile_id='', edge_voice='pt-BR-FranciscaNeural'):
    if provider not in ('edge', 'chatterbox'):
        raise ValueError('Modelo de voz inválido.')
    if provider == 'chatterbox':
        get_profile(profile_id)
    VOICES.mkdir(parents=True, exist_ok=True)
    temp = DEFAULTS.with_suffix('.tmp')
    temp.write_text(json.dumps({'provider': provider, 'profile_id': profile_id,
                               'edge_voice': edge_voice}, ensure_ascii=False), encoding='utf-8')
    temp.replace(DEFAULTS)


def get_profile(profile_id):
    if not re.fullmatch(r'[a-f0-9]{32}', str(profile_id)):
        raise ValueError('Selecione uma gravação de voz salva.')
    folder = VOICES / profile_id
    try:
        data = json.loads((folder / 'profile.json').read_text(encoding='utf-8'))
        ref = folder / 'reference.wav'
        if not ref.is_file():
            raise ValueError('A gravação desta voz não foi encontrada.')
        return {'id': profile_id, 'name': str(data['name']), 'reference': str(ref.resolve()),
                'sha256': hashlib.sha256(ref.read_bytes()).hexdigest(), 'seconds': data['seconds']}
    except (OSError, KeyError, ValueError) as exc:
        raise ValueError('Perfil de voz indisponível. Salve sua gravação novamente.') from exc


def list_profiles():
    profiles = []
    for p in sorted(VOICES.glob('*/profile.json')):
        try:
            profiles.append(get_profile(p.parent.name))
        except ValueError:
            continue
    return profiles


def save_profile(name, audio_bytes, suffix):
    # Decode and validate before committing a profile, so a failed upload leaves no entry.
    from engine import ffmpeg, run
    if not name.strip() or len(name.strip()) > 80:
        raise ValueError('Dê um nome à voz, com até 80 caracteres.')
    if suffix.lower() not in ('.wav', '.mp3', '.m4a', '.flac', '.ogg', '.webm'):
        raise ValueError('Formato de gravação não suportado.')
    if not audio_bytes or len(audio_bytes) > 30_000_000:
        raise ValueError('Importe uma gravação de até 30 MB.')
    with tempfile.TemporaryDirectory() as temp:
        source = Path(temp) / ('sample' + suffix.lower())
        target = Path(temp) / 'reference.wav'
        source.write_bytes(audio_bytes)
        # Decode no more than 31 seconds: bounded memory and no hidden truncation.
        run([ffmpeg(), '-y', '-v', 'error', '-i', source, '-t', '31', '-vn',
             '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', target])
        with wave.open(str(target), 'rb') as wav:
            seconds = wav.getnframes() / wav.getframerate()
            pcm = array('h', wav.readframes(wav.getnframes()))
        if not 8 <= seconds <= 30:
            raise ValueError('Grave entre 8 e 30 segundos. Prefira 10 a 15 segundos, sem silêncio no início.')
        rms = (sum(x*x for x in pcm) / max(1, len(pcm))) ** .5 / 32768
        clipping = sum(abs(x) >= 32700 for x in pcm) / max(1, len(pcm))
        if rms < .003:
            raise ValueError('A gravação está silenciosa ou muito baixa. Aproxime o microfone e grave novamente.')
        if clipping > .02:
            raise ValueError('A gravação está saturada. Reduza o volume do microfone e grave novamente.')
        profile_id = uuid.uuid4().hex
        dest = VOICES / profile_id
        dest.mkdir(parents=True)
        shutil.copyfile(target, dest / 'reference.wav')
        (dest / 'profile.json').write_text(json.dumps({'name': name.strip(), 'seconds': seconds},
            ensure_ascii=False), encoding='utf-8')
    return get_profile(profile_id)
