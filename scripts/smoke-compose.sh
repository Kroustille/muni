#!/usr/bin/env bash
# Production Compose smoke: build (optional), migrate job, /api/health, magic-link → SMTP (Mailpit).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILES=(-f docker-compose.prod.yml -f docker-compose.smoke.yml)
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"
MAGIC_LINK_URL="${MAGIC_LINK_URL:-http://localhost:3000/api/auth/magic-link}"
MAILPIT_API="${MAILPIT_API:-http://localhost:8025}"
SMOKE_EMAIL="${SMOKE_EMAIL:-smoke@muni.local}"
ENV_FILE="${ENV_FILE:-$ROOT/.env.smoke}"
KEEP_STACK="${KEEP_STACK:-0}"

cleanup() {
  if [[ "$KEEP_STACK" == "1" ]]; then
    return
  fi
  docker compose "${COMPOSE_FILES[@]}" --env-file "$ENV_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

if [[ -z "${MUNI_IMAGE:-}" ]]; then
  echo "Building local image for smoke test…"
  export MUNI_IMAGE="muni:smoke-local"
  docker build -t "$MUNI_IMAGE" .
fi

cat >"$ENV_FILE" <<EOF
MUNI_IMAGE=${MUNI_IMAGE}
APP_PORT=3000
POSTGRES_USER=muni
POSTGRES_PASSWORD=smoke-test-password
POSTGRES_DB=muni
DATABASE_URL=postgres://muni:smoke-test-password@postgres:5432/muni
APP_URL=http://localhost:3000
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=Muni <no-reply@muni.local>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EOF

echo "Starting production stack (with Mailpit)…"
docker compose "${COMPOSE_FILES[@]}" --env-file "$ENV_FILE" up -d --wait

echo "Waiting for migrate job to complete…"
for _ in $(seq 1 90); do
  migrate_state="$(docker compose "${COMPOSE_FILES[@]}" --env-file "$ENV_FILE" ps migrate --format json 2>/dev/null | head -1 || true)"
  if echo "$migrate_state" | grep -q '"State":"exited"'; then
    if echo "$migrate_state" | grep -q '"ExitCode":0'; then
      break
    fi
    echo "Migrate job failed:"
    docker compose "${COMPOSE_FILES[@]}" --env-file "$ENV_FILE" logs migrate
    exit 1
  fi
  sleep 2
done

echo "Checking $HEALTH_URL…"
for _ in $(seq 1 60); do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    echo "OK: $HEALTH_URL"
    break
  fi
  sleep 2
done
curl -fsS "$HEALTH_URL" | grep -q '"status":"ok"' || {
  echo "Unexpected health response"
  curl -fsS "$HEALTH_URL" || true
  exit 1
}

echo "Clearing Mailpit inbox…"
curl -fsS -X DELETE "$MAILPIT_API/api/v1/messages" >/dev/null || true

echo "Requesting magic link for $SMOKE_EMAIL…"
curl -fsS -X POST "$MAGIC_LINK_URL" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SMOKE_EMAIL\"}" >/dev/null

echo "Waiting for SMTP delivery in Mailpit…"
for _ in $(seq 1 30); do
  count="$(curl -fsS "$MAILPIT_API/api/v1/messages" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);process.stdout.write(String((j.messages||[]).length));})")"
  if [[ "$count" -ge 1 ]]; then
    echo "OK: magic-link email received ($count message(s))"
    exit 0
  fi
  sleep 2
done

echo "No magic-link email in Mailpit after timeout"
docker compose "${COMPOSE_FILES[@]}" --env-file "$ENV_FILE" logs --no-color app mailpit
exit 1
