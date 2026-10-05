#!/usr/bin/env bash
# Compila el museo y lo publica en ninive.
#
# Uso:
#   npm run deploy              # build + publicación
#   npm run deploy -- --dry-run # muestra qué se copiaría sin tocar el servidor
#   SKIP_BUILD=1 npm run deploy # publica el dist/ existente
#
# Variables configurables:
#   DEPLOY_HOST (por defecto pedro@192.168.1.200)
#   DEPLOY_PATH (por defecto /var/www/html/py-labs/museo/)
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-pedro@192.168.1.200}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/html/py-labs/museo/}"

cd "$(dirname "$0")/.."

RSYNC_EXTRA=()
if [[ "${1:-}" == "--dry-run" ]]; then
  RSYNC_EXTRA+=(--dry-run)
fi

if [[ -n "$(git status --porcelain -- src public index.html styles.css)" ]]; then
  echo "Aviso: hay cambios sin commitear en src/, public/, index.html o styles.css." >&2
fi

if [[ -z "${SKIP_BUILD:-}" ]]; then
  echo "==> Compilando"
  npm run build
fi

if [[ ! -f dist/index.html ]]; then
  echo "Error: dist/index.html no existe; ¿falló el build?" >&2
  exit 1
fi

echo "==> Publicando en ${DEPLOY_HOST}:${DEPLOY_PATH}"
# --delete elimina del servidor los assets con hash antiguos que ya no están en dist/.
rsync -avz --delete "${RSYNC_EXTRA[@]+"${RSYNC_EXTRA[@]}"}" \
  dist/ "${DEPLOY_HOST}:${DEPLOY_PATH}"

echo "==> Hecho ($(git rev-parse --short HEAD))"
