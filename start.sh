#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== MarketHub — Starting all services ==="
echo ""

# Start infrastructure if not running
if ! docker-compose -f "$ROOT_DIR/api/docker-compose.yml" ps --status running 2>/dev/null | grep -q mongodb; then
  echo "[1/3] Starting infrastructure..."
  docker-compose -f "$ROOT_DIR/api/docker-compose.yml" up -d mongodb postgres-order postgres-payment rabbitmq redis keycloak-db keycloak loki grafana
  echo "Waiting for services to be healthy..."
  sleep 5
else
  echo "[1/3] Infrastructure already running"
fi

echo "[2/3] Installing dependencies..."
(cd "$ROOT_DIR/api" && npm install --silent 2>/dev/null)
(cd "$ROOT_DIR/web" && npm install --silent 2>/dev/null)

echo "[3/3] Starting all services..."
npx --prefix "$ROOT_DIR/api" concurrently \
  -n gw,prod,ord,pay,notif,web \
  -c blue,green,yellow,magenta,cyan,white \
  "cd $ROOT_DIR/api && nest start --watch gateway" \
  "cd $ROOT_DIR/api && nest start --watch product-catalog" \
  "cd $ROOT_DIR/api && nest start --watch order" \
  "cd $ROOT_DIR/api && nest start --watch payment" \
  "cd $ROOT_DIR/api && nest start --watch notification" \
  "cd $ROOT_DIR/web && npm run dev"
