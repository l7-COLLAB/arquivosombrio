@echo off
setlocal
cd /d "%~dp0"
set "AS_MPT_RUNTIME=%USERPROFILE%\.as-mpt"
echo Preparando o MoneyPrinterTurbo em uma pasta curta do seu usuario...
if exist "%AS_MPT_RUNTIME%\Scripts\python.exe" goto dependencies
where py >nul 2>nul
if not errorlevel 1 (
 py -3 -m venv "%AS_MPT_RUNTIME%"
) else (
 python -m venv "%AS_MPT_RUNTIME%"
)
if errorlevel 1 goto python_error
:dependencies
"%AS_MPT_RUNTIME%\Scripts\python.exe" -c "import sys,importlib.metadata; assert sys.version_info[:2] in [(3,n) for n in range(11,100)]; assert importlib.metadata.version('mpt') == '1.3.8'; import litellm,google.genai,faster_whisper,streamlit_tour; from app.launcher import main" >nul 2>nul
if not errorlevel 1 goto run
"%AS_MPT_RUNTIME%\Scripts\python.exe" -m pip install --prefer-binary -r requirements.txt
if errorlevel 1 goto install_error
:run
"%AS_MPT_RUNTIME%\Scripts\python.exe" iniciar_original.py
pause
exit /b
:python_error
echo Instale Python 3.11 ou superior em python.org e tente novamente.
pause
exit /b 1
:install_error
echo A instalacao nao terminou. A janela acima mostra a causa.
echo O iniciador usa uma pasta curta para evitar o limite de caminhos do Windows.
pause
exit /b 1
