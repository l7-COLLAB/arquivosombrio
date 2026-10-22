@echo off
chcp 65001 >nul
cd /d "%~dp0"
py -3.11 --version >nul 2>&1
if errorlevel 1 (
  python -c "import sys; assert sys.version_info >= (3,11)" >nul 2>&1
  if errorlevel 1 (
    echo Instale Python 3.11 ou superior e marque Add Python to PATH.
    echo https://www.python.org/downloads/windows/
    pause
    exit /b 1
  )
  python -m venv .venv
) else (
  py -3.11 -m venv .venv
)
if errorlevel 1 goto erro
".venv\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 goto erro
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto erro
".venv\Scripts\python.exe" -c "from engine import ffmpeg,run; print(run([ffmpeg(),'-version']).splitlines()[0])"
if errorlevel 1 goto erro
echo Instalacao concluida. Abra INICIAR.bat.
pause
exit /b 0
:erro
echo A instalacao falhou. Copie a mensagem acima para diagnostico.
pause
exit /b 1
