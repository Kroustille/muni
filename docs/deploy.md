# Production deployment (Docker Compose on a VPS)

This guide assumes a **single VPS** running **Docker Compose** in production. The application image is **built in GitHub Actions** and published to **GHCR**; the server **pulls only** — no `docker build` on the VPS.

Image: **`ghcr.io/kroustille/muni`** (tags `:latest` and `:<git-sha>` on every push to `main`).

## Overview

| Component | Role |
|-----------|------|
| `postgres` | PostgreSQL 16 with a persistent volume |
| `migrate` | One-shot job: `node dist/db/migrate.js up` (same app image) |
| `app` | Next.js standalone server on port 3000 |

Health check: `GET /api/health` → `{"status":"ok"}`.

## 1. VPS preparation

- Install Docker Engine and the Compose plugin.
- Open **only** HTTP/HTTPS (80/443) in UFW (or your firewall). **Do not** expose PostgreSQL (5432) to the public internet; `docker-compose.prod.yml` keeps Postgres on the internal Compose network.
- Place TLS in front of the app with **Caddy** or **nginx** reverse proxy → `http://127.0.0.1:3000` (or the host port you map in `.env`).

Example Caddy snippet (operator-owned):

```caddy
muni.example.com {
  reverse_proxy localhost:3000
}
```

SMTP is **not** provided by this stack; configure a real provider (or a relay) via environment variables below.

## 2. Log in to GHCR on the VPS

Packages are private by default unless you change repository visibility.

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Use a classic PAT or fine-grained token with `read:packages`. For org images, grant the token access to the `Kroustille/muni` package.

## 3. Environment file

On the VPS, create a directory (e.g. `~/muni`) with:

- `docker-compose.prod.yml` (from the repo)
- `.env` (secrets — never commit)

Template:

```bash
# Image tag from CI (required for pull-only deploys)
MUNI_IMAGE=ghcr.io/kroustille/muni:latest
# Or pin: MUNI_IMAGE=ghcr.io/kroustille/muni:<full-git-sha>

# Host port published for the reverse proxy (Postgres is NOT published)
APP_PORT=3000

# PostgreSQL (Compose service name: postgres)
POSTGRES_USER=muni
POSTGRES_PASSWORD=change-me-long-random
POSTGRES_DB=muni
DATABASE_URL=postgres://muni:change-me-long-random@postgres:5432/muni

# Public URL of the app (magic links, OAuth redirects)
APP_URL=https://muni.example.com

# SMTP (production provider — not Mailpit)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=Muni <no-reply@muni.example.com>

# Optional Google sign-in
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

`DATABASE_URL` must use host **`postgres`** (the Compose service name), not `localhost`.

## 4. Pull and start

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

On each release:

```bash
# Update MUNI_IMAGE in .env if you pin by SHA, then:
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

The `migrate` service runs before `app` starts (`depends_on: service_completed_successfully`). Re-running `up` after a schema change applies new migrations safely.

Verify:

```bash
curl -fsS http://localhost:3000/api/health
```

## 5. Backups and restore

**Backup** (from the VPS, while Postgres is running):

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "muni-$(date +%Y%m%d).dump"
```

Copy dumps off the server (encrypted storage, retention policy).

**Restore** (example — stops app traffic first):

```bash
docker compose -f docker-compose.prod.yml stop app
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < muni-YYYYMMDD.dump
docker compose -f docker-compose.prod.yml up -d app
```

Test restore on a staging instance before relying on it in production.

## 6. CI vs VPS responsibilities

| Where | What |
|-------|------|
| GitHub Actions (`ci.yml`) | `verify`: typecheck, lint, build, migrations against CI Postgres, unit/integration tests. `docker` (after `verify`): build the production image on every run; push `ghcr.io/kroustille/muni` (`:latest` and `:<git-sha>`) only on push to `main` (PRs build only, no push) |
| VPS | `docker compose pull`, `.env`, TLS proxy, SMTP, backups, firewall |

End-to-end Playwright tests and the 80% coverage gate are defined in spec task T111; run them in CI when that workflow is extended, or locally before releases.

## 7. Local smoke (optional)

With Docker available:

```bash
chmod +x scripts/smoke-compose.sh
MUNI_IMAGE=ghcr.io/kroustille/muni:latest ./scripts/smoke-compose.sh
```

Builds a local image if `MUNI_IMAGE` is unset.
