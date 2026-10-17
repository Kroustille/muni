#!/usr/bin/env bash
# Mirrors `.github/workflows/ci.yml` locally (sequential; CI runs checks, unit, and sharded e2e in parallel).
set -euo pipefail

cd "$(dirname "$0")/.."

: "${DATABASE_URL:=postgres://muni:muni@localhost:5432/muni}"
: "${TEST_DATABASE_URL:=postgres://muni:muni@localhost:5432/muni_test}"
: "${APP_URL:=http://localhost:3000}"
: "${SMTP_HOST:=localhost}"
: "${SMTP_PORT:=1025}"
: "${SMTP_FROM:=Muni <ci@example.com>}"
export DATABASE_URL TEST_DATABASE_URL APP_URL SMTP_HOST SMTP_PORT SMTP_FROM CI=true

corepack enable
yarn install --frozen-lockfile

if command -v psql >/dev/null 2>&1; then
  PGPASSWORD=muni psql -h localhost -U muni -d muni -c "CREATE DATABASE muni_test;" 2>/dev/null || true
fi

yarn typecheck
yarn lint
yarn run lint:tracking
yarn build
yarn migrate:up
yarn run db:codegen:check
yarn run test:coverage
npx playwright install --with-deps chromium
yarn run test:e2e

echo "verify-ci: all steps passed"
