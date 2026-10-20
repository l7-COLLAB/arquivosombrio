@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
 echo Primeiro abra ABRIR_MONEY_ORIGINAL_WINDOWS.bat e conclua a instalacao.
 pause
 exit /b 1
)
.venv\Scripts\python.exe iniciar_original.py --iphone
pause
