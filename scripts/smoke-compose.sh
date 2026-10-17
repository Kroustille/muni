#!/usr/bin/env bash
# Basic production Compose smoke (full T107 adds magic-link → SMTP checks).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"

if [[ -z "${MUNI_IMAGE:-}" ]]; then
  echo "Building local image for smoke test…"
  export MUNI_IMAGE="muni:smoke-local"
  docker build -t "$MUNI_IMAGE" .
fi

docker compose -f "$COMPOSE_FILE" up -d --wait

echo "Waiting for /api/health…"
for _ in $(seq 1 60); do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    echo "OK: $HEALTH_URL"
    exit 0
  fi
  sleep 2
done

echo "Health check failed: $HEALTH_URL"
docker compose -f "$COMPOSE_FILE" logs --no-color
exit 1
