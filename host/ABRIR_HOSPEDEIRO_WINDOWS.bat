@echo off
setlocal
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" goto dependencies
where py >nul 2>nul
if not errorlevel 1 (
 py -3 -m venv .venv
) else (
 python -m venv .venv
)
if errorlevel 1 goto python_error
:dependencies
.venv\Scripts\python.exe -c "import edge_tts; assert edge_tts.__version__ == '7.3.1'" >nul 2>nul
if not errorlevel 1 goto run
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto dependency_error
:run
.venv\Scripts\python.exe hospedeiro.py %*
pause
exit /b
:python_error
echo Nao foi possivel preparar o Python. Instale Python 3.11 ou superior em python.org e tente novamente.
pause
exit /b 1
:dependency_error
echo Nao foi possivel instalar o motor de voz. Confira a internet e abra novamente.
pause
exit /b 1
