@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Execute primeiro INSTALAR.bat.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" -m streamlit run studio.py --server.address 127.0.0.1 --server.port 8505 --browser.gatherUsageStats false
pause
