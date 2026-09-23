#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "[ARQUIVO VOZ] Docker não foi encontrado."
  echo "Instale e abra o Docker Desktop/Engine antes de continuar."
  exit 1
fi

echo "[ARQUIVO VOZ] Iniciando Kokoro e bridge local..."
docker compose up -d --build

echo "[ARQUIVO VOZ] Aguardando o servidor ficar pronto..."
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8890/health >/dev/null 2>&1; then
    echo "[ARQUIVO VOZ] ONLINE"
    echo "Abra a V2 e entre em Arquivo Voz > Testar conexão."
    exit 0
  fi
  sleep 2
done

echo "O servidor ainda não respondeu."
echo "Veja os logs com: docker compose logs -f"
exit 1
