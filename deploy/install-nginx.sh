#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONF_NAME="matupark.matubyte.com"

if [[ -f /etc/letsencrypt/live/matupark.matubyte.com/fullchain.pem ]]; then
  SRC="$ROOT/deploy/nginx/matupark.matubyte.com.conf"
else
  echo "Certificado SSL aún no existe — usando HTTP temporal"
  SRC="$ROOT/deploy/nginx/matupark.matubyte.com.http.conf"
fi

sudo mkdir -p /var/www/certbot
sudo cp "$SRC" "/etc/nginx/sites-available/$CONF_NAME"
sudo ln -sf "/etc/nginx/sites-available/$CONF_NAME" "/etc/nginx/sites-enabled/$CONF_NAME"
sudo nginx -t
sudo systemctl reload nginx
echo "✓ Nginx: $CONF_NAME"
