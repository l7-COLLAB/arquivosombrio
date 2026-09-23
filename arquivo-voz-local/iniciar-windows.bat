@echo off
setlocal
cd /d %~dp0

where docker >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ARQUIVO VOZ] Docker nao foi encontrado.
  echo Instale e abra o Docker Desktop antes de continuar.
  pause
  exit /b 1
)

echo.
echo [ARQUIVO VOZ] Iniciando Kokoro e bridge local...
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo Nao foi possivel iniciar os containers.
  echo Verifique se o Docker Desktop esta aberto.
  pause
  exit /b 1
)

echo.
echo [ARQUIVO VOZ] Aguardando o servidor ficar pronto...
powershell -NoProfile -Command "$ok=$false; for($i=0;$i -lt 60;$i++){ try { $r=Invoke-RestMethod -Uri 'http://127.0.0.1:8890/health' -TimeoutSec 3; if($r.ok){$ok=$true;break} } catch {}; Start-Sleep -Seconds 2 }; if($ok){ exit 0 } else { exit 1 }"

if errorlevel 1 (
  echo.
  echo O servidor ainda nao respondeu.
  echo Veja os logs com: docker compose logs -f
  pause
  exit /b 1
)

echo.
echo [ARQUIVO VOZ] ONLINE
echo Abra a V2 e entre em Arquivo Voz ^> Testar conexao.
echo.
pause
