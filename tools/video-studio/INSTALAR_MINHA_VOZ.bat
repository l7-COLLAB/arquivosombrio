@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Instalando o modulo opcional Minha voz. O Studio deve estar fechado.
echo O download pode ocupar varios GB e demorar. Nao feche esta janela.
py -3.11 --version >nul 2>&1
if not errorlevel 1 (
  py -3.11 -m venv .venv_voice
) else (
  if not exist ".venv\Scripts\python.exe" goto python_ausente
  ".venv\Scripts\python.exe" -c "import sys; assert (3,11) <= sys.version_info[:2] <= (3,12)" >nul 2>&1
  if errorlevel 1 goto python_ausente
  ".venv\Scripts\python.exe" -m venv .venv_voice
)
if errorlevel 1 goto erro
".venv_voice\Scripts\python.exe" -m pip install --upgrade pip setuptools wheel
if errorlevel 1 goto erro
rem CPU wheels work without an NVIDIA GPU and avoid CUDA driver requirements.
".venv_voice\Scripts\python.exe" -m pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
if errorlevel 1 goto erro
".venv_voice\Scripts\python.exe" -m pip install -r requirements-voice.txt
if errorlevel 1 goto erro
".venv_voice\Scripts\python.exe" -m pip check
if errorlevel 1 goto erro
".venv_voice\Scripts\python.exe" -c "from chatterbox.mtl_tts import ChatterboxMultilingualTTS; from faster_whisper import WhisperModel; import inspect; assert 'language_id' in inspect.signature(ChatterboxMultilingualTTS.generate).parameters; print('Modulo de voz instalado. Modelos serao baixados no primeiro teste.')"
if errorlevel 1 goto erro
echo Concluido. Abra INICIAR.bat e a aba 4 - Minha voz.
pause
exit /b 0
:python_ausente
echo Este modulo requer Python 3.11 ou 3.12. Instale Python 3.11 de 64 bits e execute novamente.
echo A instalacao atual do Studio nao foi alterada.
pause
exit /b 1
:erro
echo A instalacao de Minha voz falhou. Envie a mensagem exibida acima para diagnostico.
echo O Studio e as vozes anteriores continuam disponiveis.
pause
exit /b 1
