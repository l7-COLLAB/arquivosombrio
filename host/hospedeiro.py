"""Auxiliar do Estúdio: conexão de saída HTTPS e fila exclusiva de narração."""
from __future__ import annotations
import asyncio
import ctypes
import getpass
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request

ENDPOINT = 'https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/studio-connector'
VOICE = 'pt-BR-AntonioNeural'
RATES = {'dossie':'-5%', 'pericia':'-3%', 'lenda':'-8%', 'dramatica':'-7%', 'jornalistica':'+0%', 'normal':'+0%'}
ROOT = Path(os.environ.get('LOCALAPPDATA', str(Path.home()))) / 'ArquivoSombrioHospedeiro'

class ApiError(Exception):
    def __init__(self, message, status=0):
        super().__init__(message)
        self.status = status

def request(action=None, token=None, payload=None, audio=None, job=None, lease=None):
    headers = {'Content-Type':'application/json'}
    if token:
        headers['x-host-token'] = token
    if audio is not None:
        headers.update({'Content-Type':'audio/mpeg', 'x-job-id':job, 'x-job-lease':lease})
        data = audio
    else:
        data = json.dumps({'action':action, **(payload or {})}).encode('utf-8')
    req = urllib.request.Request(ENDPOINT, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            return json.loads(response.read(200000))
    except urllib.error.HTTPError as error:
        try:
            message = json.loads(error.read(2000)).get('error', 'Conexão recusada')
        except Exception:
            message = 'Conexão recusada'
        raise ApiError(message, error.code) from None

def protect(data: bytes, decrypt=False) -> bytes:
    if os.name != 'nt':
        return data
    from ctypes import wintypes
    class Blob(ctypes.Structure):
        _fields_ = [('cbData', wintypes.DWORD), ('pbData', ctypes.POINTER(ctypes.c_byte))]
    buf = ctypes.create_string_buffer(data)
    source = Blob(len(data), ctypes.cast(buf, ctypes.POINTER(ctypes.c_byte)))
    output = Blob()
    crypt = ctypes.windll.crypt32
    crypt.CryptProtectData.argtypes = [ctypes.POINTER(Blob), wintypes.LPCWSTR, ctypes.POINTER(Blob), ctypes.c_void_p, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(Blob)]
    crypt.CryptProtectData.restype = wintypes.BOOL
    crypt.CryptUnprotectData.argtypes = [ctypes.POINTER(Blob), ctypes.c_void_p, ctypes.POINTER(Blob), ctypes.c_void_p, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(Blob)]
    crypt.CryptUnprotectData.restype = wintypes.BOOL
    ctypes.windll.kernel32.LocalFree.argtypes = [ctypes.c_void_p]
    ctypes.windll.kernel32.LocalFree.restype = ctypes.c_void_p
    if decrypt:
        ok = crypt.CryptUnprotectData(ctypes.byref(source), None, None, None, None, 1, ctypes.byref(output))
    else:
        ok = crypt.CryptProtectData(ctypes.byref(source), 'Arquivo Sombrio', None, None, None, 1, ctypes.byref(output))
    if not ok:
        raise OSError('Não foi possível proteger a conexão no Windows.')
    try:
        return ctypes.string_at(output.pbData, output.cbData)
    finally:
        ctypes.windll.kernel32.LocalFree(output.pbData)

def save_connection(value):
    ROOT.mkdir(parents=True, exist_ok=True)
    path = ROOT / 'conexao.dat'
    path.write_bytes(protect(json.dumps(value).encode()))
    if os.name != 'nt':
        path.chmod(0o600)

def load_connection():
    path = ROOT / 'conexao.dat'
    if not path.exists():
        return None
    value = json.loads(protect(path.read_bytes(), decrypt=True))
    if not re.fullmatch('[a-f0-9]{48}', value.get('token','')):
        raise ValueError('Conexão local inválida.')
    return value

def validate_job(job):
    if not isinstance(job, dict) or not isinstance(job.get('payload'), dict):
        raise ValueError('Trabalho inválido')
    for key in ('id','lease'):
        if not re.fullmatch('[a-f0-9-]{36}', str(job.get(key,''))):
            raise ValueError('Identificador inválido')
    payload = job['payload']
    if not isinstance(payload.get('text'), str) or not payload['text'].strip() or len(payload['text'])>15000:
        raise ValueError('Roteiro inválido')
    if payload.get('voice') != VOICE or payload.get('style') not in RATES:
        raise ValueError('Configuração de narração inválida')
    return payload

async def narrate(payload, path):
    import edge_tts
    communicator = edge_tts.Communicate(payload['text'], VOICE, rate=RATES[payload['style']], pitch='+0Hz', boundary='SentenceBoundary')
    maker = edge_tts.SubMaker()
    size = 0
    with path.open('wb') as audio:
        async for chunk in communicator.stream():
            if chunk['type'] == 'audio':
                size += len(chunk['data'])
                if size > 20*1024*1024:
                    raise ValueError('Narração excedeu 20 MB')
                audio.write(chunk['data'])
            elif chunk['type'] == 'SentenceBoundary':
                maker.feed(chunk)
    if size < 128:
        raise ValueError('O serviço não retornou áudio')
    return maker.get_srt()

def run_job(job, token):
    payload = validate_job(job)
    stop = threading.Event()
    def heartbeat():
        while not stop.wait(25):
            try:
                request('heartbeat',token,{'job':job['id'],'lease':job['lease']})
            except Exception:
                pass
    thread = threading.Thread(target=heartbeat,daemon=True)
    thread.start()
    try:
        with tempfile.TemporaryDirectory(prefix='arquivo-sombrio-voz-') as folder:
            path = Path(folder)/'narracao.mp3'
            subtitles = asyncio.run(narrate(payload,path))
            request(token=token,audio=path.read_bytes(),job=job['id'],lease=job['lease'])
            request('finish',token,{'job':job['id'],'lease':job['lease'],'srt':subtitles})
    finally:
        stop.set()
        thread.join(timeout=1)

def main():
    print('ARQUIVO SOMBRIO | HOSPEDEIRO DE NARRAÇÃO')
    print('Mantenha esta janela aberta. Para sair, pressione Ctrl+C.')
    try:
        connection = load_connection()
    except Exception:
        print('A conexão salva não pôde ser aberta. Faça um novo pareamento na V2.')
        connection = None
    if '--parear' in sys.argv:
        connection = None
    if connection is None:
        print('Na V2: Estúdio de vídeo > Hospedeiros > Conectar computador.')
        code = getpass.getpass('Cole o código temporário e pressione Enter (o código fica oculto): ').strip()
        if not re.fullmatch('[a-f0-9]{48}',code):
            raise ValueError('Código inválido. Gere outro na V2.')
        connection = request('pair',payload={'code':code})
        save_connection(connection)
    print('Conectado: '+connection['host']['name'])
    print('Pronto para receber narrações solicitadas na V2, inclusive pelo iPhone.')
    failures = 0
    while True:
        try:
            response = request('poll',connection['token'])
            failures = 0
            job = response.get('job')
            if job:
                print('Gerando narração com Antônio...')
                try:
                    run_job(job,connection['token'])
                    print('Áudio e legendas enviados. Na V2, clique em Usar no projeto.')
                except Exception as error:
                    print('Não foi possível gerar. Confira a internet e tente novamente pela V2.')
                    try:
                        request('fail',connection['token'],{'job':job['id'],'lease':job['lease']})
                    except Exception:
                        pass
            time.sleep(30)
        except ApiError as error:
            if error.status in (401,403):
                print('A conexão foi revogada. Use RECONECTAR_WINDOWS.bat para parear novamente.')
                return
            failures += 1
            print('Conexão indisponível. Nova tentativa automática em 30 segundos.')
            time.sleep(30)
        except (OSError,ValueError):
            failures += 1
            print('Sem conexão com o Estúdio. Nova tentativa em 30 segundos.')
            time.sleep(30)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\nHospedeiro encerrado.')
    except Exception as error:
        print('Não foi possível iniciar: '+str(error))
        raise SystemExit(1)
