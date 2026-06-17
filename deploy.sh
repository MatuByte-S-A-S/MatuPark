#!/usr/bin/env bash
# Atajo: ./deploy.sh → deploy/deploy.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
exec bash "$ROOT/deploy/deploy.sh" "$@"
