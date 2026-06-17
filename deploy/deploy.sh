#!/usr/bin/env bash
# Despliegue MatuPark en ~/apps/MatuPark (matupark.matubyte.com)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ MatuPark deploy en $ROOT"

if [[ ! -f .env ]]; then
  echo "ERROR: Crea .env (copia .env.production.example)"
  exit 1
fi

export npm_config_fetch_retries=5
export npm_config_fetch_retry_mintimeout=20000
export npm_config_fetch_retry_maxtimeout=120000

run_retry() {
  local label="$1"
  shift
  local max=4
  local n=1
  while [[ $n -le $max ]]; do
    echo "→ $label (intento $n/$max)"
    if "$@"; then
      return 0
    fi
    if [[ $n -eq $max ]]; then
      echo "ERROR: $label falló tras $max intentos"
      return 1
    fi
    echo "   Reintentando en 8s..."
    sleep 8
    n=$((n + 1))
  done
}

if [[ -d node_modules ]] && npm ls vue &>/dev/null; then
  echo "→ node_modules OK"
else
  run_retry "npm ci" npm ci || run_retry "npm ci --ignore-scripts" npm ci --ignore-scripts
fi

echo "→ build (VITE_* desde .env)"
npx vite build

if pm2 describe matupark-billing &>/dev/null; then
  pm2 restart matupark-billing --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

echo ""
echo "══════════════════════════════════════════"
echo "  MatuPark desplegado"
echo "  App:     https://matupark.matubyte.com"
echo "  Billing: https://matupark.matubyte.com/api/billing"
echo "  Pagos:   https://pay.matubyte.com (app matupark)"
echo ""
echo "  Planes:"
echo "    plan-mensual   → \$27.000 / mes"
echo "    plan-semestral → \$145.800 / 6 meses"
echo "    plan-anual     → \$259.200 / 12 meses"
echo "══════════════════════════════════════════"
echo ""
echo "  PM2: matupark-billing (puerto 3010)"
echo "  Recarga nginx: sudo bash deploy/install-nginx.sh"
