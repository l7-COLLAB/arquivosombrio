@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" exit /b 1
".venv\Scripts\python.exe" -m pip install "faster-whisper>=1.1,<2"
if errorlevel 1 (
  echo Falha ao instalar transcricao. Pode usar audio com SRT sem Whisper.
) else (
  echo Transcricao instalada. O modelo sera baixado no primeiro uso.
)
pause
