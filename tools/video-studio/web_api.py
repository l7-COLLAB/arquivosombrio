"""Authenticated web adapter for the desktop renderer. Run one process per data volume."""
import base64
from concurrent.futures import ThreadPoolExecutor
import json
import os
from pathlib import Path
import re
import threading
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import requests
from engine import render, prepare_audio
from media import save_image_bytes, search_photos, download_photo
from planner import validate_plan, interpret
from voice_profiles import list_profiles, save_profile

ROOT = Path(__file__).resolve().parent
DATA = Path(os.environ.get('STUDIO_DATA_DIR', str(ROOT / 'web_data'))).resolve()
SUPABASE_URL = os.environ.get('SUPABASE_URL', '').rstrip('/')
SUPABASE_KEY = os.environ.get('SUPABASE_PUBLISHABLE_KEY', '')
ORIGIN = os.environ.get('STUDIO_ORIGIN', 'https://arquivosombrio.net.br')
POOL = ThreadPoolExecutor(max_workers=1)
LOCK = threading.Lock()
MAX_BODY = 100 * 1024 * 1024


def blob(value, limit):
    if not isinstance(value, str) or ',' not in value or ';base64,' not in value[:100]:
        raise ValueError('Arquivo inválido.')
    raw = base64.b64decode(value.split(',', 1)[1], validate=True)
    if not raw or len(raw) > limit:
        raise ValueError('Arquivo vazio ou grande demais.')
    return raw


def write_json(path, value):
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
    temp.replace(path)


def read_job(owner, job_id):
    if not re.fullmatch(r'[a-f0-9]{32}', job_id):
        raise ValueError('Trabalho inválido.')
    folder = DATA / owner / job_id
    return folder, json.loads((folder / 'status.json').read_text(encoding='utf-8'))


def execute(folder, plan, options):
    def status(state, message, **extra):
        write_json(folder / 'status.json', {'id': folder.name, 'state': state, 'message': message, **extra})
    try:
        status('processing', 'Preparando narração…')
        progress = lambda message: status('processing', message)
        if options.pop('audio_only', False):
            audio, lengths, _ = prepare_audio(plan, folder, options['voice'], options['imported'], options['srt'], progress)
            result = {'audio': audio, 'srt': str(folder / 'legendas.srt'), 'seconds': sum(lengths)}
        else:
            result = render(plan, folder, progress=progress, **options)
        files = {key: Path(value).name for key, value in result.items() if key in ('video', 'audio', 'srt')}
        if (folder / 'fontes.json').exists():
            files['sources'] = 'fontes.json'
        status('completed', 'Geração concluída. Revise antes de publicar.', files=files,
               seconds=result['seconds'], warning=result.get('warning', ''))
    except Exception as exc:
        # Provider/library exceptions can contain credentials or private paths.
        status('failed', 'Não foi possível concluir (' + type(exc).__name__ + '). Confira imagens, áudio, instalação da voz e espaço disponível. Seu projeto foi preservado no navegador.')


def submit(owner, payload):
    plan = validate_plan(payload['plan'])
    voice = str(payload.get('voice', 'pt-BR-AntonioNeural'))
    voices = {'pt-BR-AntonioNeural', 'pt-BR-FranciscaNeural'}
    voices.update('chatterbox:' + p['id'] for p in list_profiles())
    if voice not in voices:
        raise ValueError('Escolha uma voz disponível.')
    with LOCK:
        owner_dir = DATA / owner
        owner_dir.mkdir(parents=True, exist_ok=True)
        pending = [p for p in owner_dir.glob('*/status.json') if json.loads(p.read_text())['state'] in ('queued', 'processing')]
        if len(pending) >= 2:
            raise ValueError('Aguarde os trabalhos em andamento antes de enviar outro.')
        folder = owner_dir / uuid.uuid4().hex
        folder.mkdir()
        try:
            for i, scene in enumerate(plan['scenes']):
                # Never accept filesystem paths from the client.
                source = scene['asset']
                scene['asset'] = ''
                if source:
                    scene['asset'] = save_image_bytes(blob(source, 25 * 1024 * 1024), folder / f'image-{i}.jpg')
                elif not payload.get('audio_only'):
                    raise ValueError(f'Importe uma imagem para a cena {i+1}.')
            imports = {}
            for kind in ('narration', 'subtitles', 'music'):
                item = payload.get(kind)
                if not item:
                    imports[kind] = None
                    continue
                suffix = Path(str(item.get('name', ''))).suffix.lower()
                allowed = ('.srt',) if kind == 'subtitles' else ('.wav', '.mp3', '.m4a', '.mp4', '.flac', '.ogg', '.aac')
                if suffix not in allowed:
                    raise ValueError('Formato de áudio ou legenda inválido.')
                dest = folder / (kind + suffix)
                dest.write_bytes(blob(item['src'], 2_000_000 if kind == 'subtitles' else 40_000_000))
                imports[kind] = str(dest)
            transition = float(payload.get('transition', .35))
            volume = float(payload.get('music_volume', .1))
            if not 0 <= transition <= 2 or not 0 <= volume <= 1:
                raise ValueError('Transição ou volume inválido.')
            options = dict(voice=voice, imported=imports['narration'], srt=imports['subtitles'],
                           music=imports['music'], music_volume=volume, transition=transition,
                           preview=bool(payload.get('preview', True)), audio_only=bool(payload.get('audio_only', False)))
            write_json(folder / 'status.json', {'id': folder.name, 'state': 'queued', 'message': 'Na fila de geração.'})
            POOL.submit(execute, folder, plan, options)
            return {'id': folder.name}
        except Exception:
            import shutil
            shutil.rmtree(folder)
            raise


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # No tokens, user identifiers or private filenames in access logs.

    def headers_for(self, code, mime='application/json', size=None):
        self.send_response(code)
        self.send_header('Content-Type', mime)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Access-Control-Allow-Origin', ORIGIN)
        self.send_header('Vary', 'Origin')
        if size is not None:
            self.send_header('Content-Length', str(size))
        self.end_headers()

    def send_json(self, code, value):
        data = json.dumps(value, ensure_ascii=False).encode()
        self.headers_for(code, size=len(data))
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', ORIGIN)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        self.send_header('Access-Control-Max-Age', '600')
        self.end_headers()

    def user(self):
        token = self.headers.get('Authorization', '')
        if not token.startswith('Bearer ') or len(token) > 16000:
            raise PermissionError()
        response = requests.get(SUPABASE_URL + '/auth/v1/user', timeout=(5, 15),
                                headers={'apikey': SUPABASE_KEY, 'Authorization': token})
        if response.status_code != 200:
            raise PermissionError()
        user = response.json()
        if user.get('app_metadata', {}).get('role') != 'admin' or not re.fullmatch(r'[a-f0-9-]{36}', user.get('id', '')):
            raise PermissionError()
        return user['id']

    def dispatch(self):
        try:
            owner = self.user()
            path = self.path.split('?', 1)[0].rstrip('/')
            if self.command == 'GET':
                if path.endswith('/health'):
                    return self.send_json(200, {'ok': True, 'voices': [{'id': 'chatterbox:' + p['id'], 'name': p['name']} for p in list_profiles()]})
                match = re.search(r'/jobs/([a-f0-9]{32})(?:/files/(video|audio|srt|sources))?$', path)
                if match:
                    folder, job = read_job(owner, match[1])
                    if not match[2]:
                        return self.send_json(200, job)
                    name = job.get('files', {}).get(match[2])
                    if job['state'] != 'completed' or not name:
                        raise FileNotFoundError()
                    file = folder / name
                    mime = {'video': 'video/mp4', 'audio': 'audio/wav', 'srt': 'application/x-subrip', 'sources': 'application/json'}[match[2]]
                    self.headers_for(200, mime, file.stat().st_size)
                    with file.open('rb') as stream:
                        import shutil
                        shutil.copyfileobj(stream, self.wfile)
                    return
            if self.command == 'POST':
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= MAX_BODY:
                    return self.send_json(413, {'error': 'O envio deve ter até 100 MB. Reduza as imagens ou o áudio.'})
                payload = json.loads(self.rfile.read(length))
                if path.endswith('/plan'):
                    base = os.environ.get('STUDIO_PLANNER_URL', '')
                    model = os.environ.get('STUDIO_PLANNER_MODEL', '')
                    key = os.environ.get('STUDIO_PLANNER_KEY', '')
                    if not base or not model:
                        raise ValueError('Planejamento automático não configurado.')
                    return self.send_json(200, interpret(str(payload.get('brief', '')), base, key, model))
                if path.endswith('/photos'):
                    provider = str(payload.get('provider', 'Pexels'))
                    if provider not in ('Pexels', 'Pixabay'):
                        raise ValueError('Banco inválido.')
                    key = os.environ.get('STUDIO_PEXELS_KEY' if provider == 'Pexels' else 'STUDIO_PIXABAY_KEY', '')
                    items = search_photos(provider, key, str(payload.get('query', ''))[:250])
                    import tempfile
                    photos = []
                    with tempfile.TemporaryDirectory() as temp:
                        for item in items[:4]:
                            file = Path(download_photo(item, temp))
                            photos.append({'asset': 'data:image/jpeg;base64,' + base64.b64encode(file.read_bytes()).decode(),
                                           'source': item['source'], 'credit': item['credit']})
                    return self.send_json(200, {'photos': photos})
                if path.endswith('/jobs'):
                    return self.send_json(202, submit(owner, payload))
                if path.endswith('/voices'):
                    profile = save_profile(str(payload.get('name', '')), blob(payload.get('src'), 30_000_000), ('.m4a' if Path(str(payload.get('filename', ''))).suffix.lower() == '.mp4' else Path(str(payload.get('filename', ''))).suffix))
                    return self.send_json(201, {'id': 'chatterbox:' + profile['id'], 'name': profile['name']})
            self.send_json(404, {'error': 'Recurso não encontrado.'})
        except PermissionError:
            self.send_json(403, {'error': 'Entre com uma conta administrativa válida.'})
        except FileNotFoundError:
            self.send_json(404, {'error': 'Trabalho ou arquivo não encontrado.'})
        except (ValueError, KeyError, TypeError):
            self.send_json(400, {'error': 'Dados inválidos. Confira cenas, arquivos e configurações.'})
        except Exception:
            self.send_json(503, {'error': 'Serviço indisponível. Tente novamente.'})

    do_GET = dispatch
    do_POST = dispatch


if __name__ == '__main__':
    if not SUPABASE_URL.startswith('https://') or not SUPABASE_KEY:
        raise SystemExit('Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no ambiente do servidor.')
    DATA.mkdir(parents=True, exist_ok=True)
    # Interrupted jobs are never advertised as still running after a restart.
    for path in DATA.glob('*/*/status.json'):
        job = json.loads(path.read_text())
        if job['state'] in ('queued', 'processing'):
            job.update(state='failed', message='O servidor reiniciou. Reenvie o projeto salvo no navegador.')
            write_json(path, job)
    ThreadingHTTPServer(('127.0.0.1', int(os.environ.get('STUDIO_PORT', '8510'))), Handler).serve_forever()
