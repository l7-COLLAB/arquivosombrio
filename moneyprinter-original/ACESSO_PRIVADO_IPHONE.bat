@echo off
setlocal
cd /d "%~dp0"
set "AS_MPT_RUNTIME=%USERPROFILE%\.as-mpt"
if not exist "%AS_MPT_RUNTIME%\Scripts\python.exe" (
 echo Primeiro abra ABRIR_MONEY_ORIGINAL_WINDOWS.bat e conclua a instalacao.
 pause
 exit /b 1
)
"%AS_MPT_RUNTIME%\Scripts\python.exe" iniciar_original.py --iphone
pause
