#!/usr/bin/env bash
# Instala exclusivamente o ZIP original aprovado do Studio Leve 1.3.2.
# Não publica nenhuma porta na Internet.
set -euo pipefail

readonly SHA256_ESPERADO="0d085a162aa6b772a91e10770aae0c394b9479f5cc844b37d6fbaf6323e8ddb5"
readonly APPDIR="/opt/arquivo-sombrio-studio"
readonly APPUSER="arquivostudio"

if [[ "$#" -ne 1 || ! -f "$1" ]]; then
  echo "Uso: bash install.sh /caminho/Estudio_Arquivo_Sombrio_1_3_2_Leve.zip" >&2
  exit 2
fi
BUNDLE="$(realpath "$1")"
HASH="$(sha256sum "$BUNDLE" | cut -d' ' -f1)"
if [[ "$HASH" != "$SHA256_ESPERADO" ]]; then
  echo "ERRO: ZIP diferente do Studio Leve 1.3.2 aprovado. Instalação interrompida." >&2
  exit 1
fi

if [[ -e "$APPDIR/studio_app.py" ]]; then
  echo "Instalação existente encontrada; não sobrescreveremos projetos nem credenciais." >&2
  exit 1
fi

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "Este instalador foi criado para Linux/Ubuntu." >&2
  exit 1
fi

sudo apt-get update
sudo apt-get install -y python3.12 python3.12-venv ffmpeg fonts-dejavu-core unzip
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
unzip -tqq "$BUNDLE"
unzip -q "$BUNDLE" -d "$TMP"
SRC="$TMP/Arquivo_Sombrio_Estudio"
for f in studio_app.py requirements-studio.txt studio/auth.py studio/engine.py; do
  test -f "$SRC/$f" || { echo "Falta arquivo original: $f" >&2; exit 1; }
done

if ! id "$APPUSER" >/dev/null 2>&1; then
  sudo useradd --system --home-dir "$APPDIR" --shell /usr/sbin/nologin "$APPUSER"
fi
sudo install -d -m 0750 -o "$APPUSER" -g "$APPUSER" "$APPDIR"
sudo cp -a "$SRC"/. "$APPDIR/"
sudo install -d -m 0700 -o "$APPUSER" -g "$APPUSER" "$APPDIR/storage" "$APPDIR/storage/studio_v1"
sudo chown -R "$APPUSER:$APPUSER" "$APPDIR"
sudo -u "$APPUSER" python3.12 -m venv "$APPDIR/.venv"
sudo -u "$APPUSER" "$APPDIR/.venv/bin/python" -m pip install --disable-pip-version-check -r "$APPDIR/requirements-studio.txt"
sudo install -m 0644 "$(dirname "$0")/studio-leve.service" /etc/systemd/system/studio-leve.service
sudo systemctl daemon-reload
sudo systemctl enable --now studio-leve.service
echo "Serviço instalado, disponível somente em 127.0.0.1:8502 no servidor."
echo "Crie a senha inicial por túnel SSH antes de configurar qualquer domínio público."
sudo systemctl --no-pager --full status studio-leve.service || true
