#!/usr/bin/env bash
# Certificado Let's Encrypt para matupark.matubyte.com
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

sudo mkdir -p /var/www/certbot
sudo cp "$ROOT/deploy/nginx/matupark.matubyte.com.http.conf" /etc/nginx/sites-available/matupark.matubyte.com
sudo ln -sf /etc/nginx/sites-available/matupark.matubyte.com /etc/nginx/sites-enabled/matupark.matubyte.com
sudo nginx -t && sudo systemctl reload nginx

sudo certbot certonly --webroot -w /var/www/certbot \
  -d matupark.matubyte.com \
  --agree-tos -m admin@matubyte.com --non-interactive || true

sudo cp "$ROOT/deploy/nginx/matupark.matubyte.com.conf" /etc/nginx/sites-available/matupark.matubyte.com
sudo nginx -t && sudo systemctl reload nginx

echo "✓ SSL matupark.matubyte.com (si certbot terminó OK)"
