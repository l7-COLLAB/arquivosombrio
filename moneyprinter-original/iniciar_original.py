"""Inicia o pacote oficial mpt sem alterar sua interface ou seus módulos."""
from __future__ import annotations
import importlib.metadata
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys

VERSION='1.3.8'
PORT=8501
ROOT=Path(__file__).resolve().parent

def environment():
    env=os.environ.copy()
    env['MPT_HOME']=str(ROOT/'dados')
    env['STREAMLIT_THEME_BASE']='dark'
    env['STREAMLIT_THEME_BACKGROUND_COLOR']='#111113'
    env['STREAMLIT_THEME_SECONDARY_BACKGROUND_COLOR']='#1b1b1d'
    env['STREAMLIT_THEME_TEXT_COLOR']='#e6e2dc'
    env['STREAMLIT_THEME_PRIMARY_COLOR']='#a13d3d'
    return env

def tail_executable():
    found=shutil.which('tailscale')
    if found:return found
    candidate=Path(os.environ.get('ProgramFiles','C:/Program Files'))/'Tailscale/tailscale.exe'
    if candidate.exists():return str(candidate)
    raise RuntimeError('Instale o Tailscale no PC e no iPhone e entre com a mesma conta. Depois, abra novamente este arquivo.')

def private_access():
    exe=tail_executable()
    result=subprocess.run([exe,'status','--json'],capture_output=True,text=True,check=True)
    data=json.loads(result.stdout)
    if data.get('BackendState')!='Running':raise RuntimeError('Conecte o Tailscale antes de continuar.')
    dns=data.get('Self',{}).get('DNSName','').rstrip('.')
    if not dns or not dns.endswith('.ts.net'):raise RuntimeError('O Tailscale ainda não forneceu o endereço privado do PC.')
    print('\nENDEREÇO PARA SALVAR NA V2: https://'+dns+':8443/')
    print('Mantenha esta janela e a janela do MoneyPrinterTurbo abertas.')
    print('Se o Tailscale pedir ativação do HTTPS, siga a orientação que ele mostrar.')
    print('Este acesso funciona somente dentro da sua rede privada Tailscale.')
    return subprocess.call([exe,'serve','--https=8443','http://127.0.0.1:'+str(PORT)])

def main():
    if sys.version_info<(3,11):raise RuntimeError('Use Python 3.11 ou superior.')
    if '--iphone' in sys.argv:return private_access()
    if importlib.metadata.version('mpt')!=VERSION:raise RuntimeError('Versão diferente da esperada. Abra ABRIR_MONEY_ORIGINAL_WINDOWS.bat.')
    with socket.socket() as probe:
        try:probe.bind(('127.0.0.1',PORT))
        except OSError:raise RuntimeError('A porta 8501 está ocupada. Feche o MoneyPrinterTurbo anterior ou outro programa nessa porta e tente novamente.')
    (ROOT/'dados').mkdir(exist_ok=True)
    print('MoneyPrinterTurbo original '+VERSION)
    print('PC: http://127.0.0.1:8501')
    print('A primeira instalação pode demorar. Mantenha esta janela aberta durante o uso.')
    from app.launcher import main as original
    os.environ.update(environment())
    return original(['webui','--host','127.0.0.1','--port',str(PORT)])

if __name__=='__main__':
    try:raise SystemExit(main())
    except KeyboardInterrupt:pass
    except Exception as error:print('Não foi possível iniciar: '+str(error));raise SystemExit(1)
