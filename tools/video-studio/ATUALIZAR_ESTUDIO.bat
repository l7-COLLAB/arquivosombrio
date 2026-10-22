@echo off
chcp 65001 >nul
cd /d "%~dp0"
py -3.11 --version >nul 2>&1
if not errorlevel 1 (
  py -3.11 atualizar_estudio.py
) else (
  python atualizar_estudio.py
)
pause
