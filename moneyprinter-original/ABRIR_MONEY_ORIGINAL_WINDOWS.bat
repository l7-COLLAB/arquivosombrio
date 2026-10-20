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
.venv\Scripts\python.exe -c "import sys,importlib.metadata; assert sys.version_info[:2] in [(3,n) for n in range(11,100)]; assert importlib.metadata.version('mpt') == '1.3.8'" >nul 2>nul
if not errorlevel 1 goto run
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto install_error
:run
.venv\Scripts\python.exe iniciar_original.py
pause
exit /b
:python_error
echo Instale Python 3.11 ou superior em python.org e tente novamente.
pause
exit /b 1
:install_error
echo A instalacao oficial nao terminou. Confira a internet, o Python e abra novamente.
pause
exit /b 1
