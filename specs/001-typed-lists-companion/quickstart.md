# Quickstart: Validation Guide

Validation scenarios for Muni v1. For day-to-day development setup, see [Getting started](../../docs/GETTING-STARTED.md). For VPS deployment, see [deploy.md](../../docs/deploy.md).

## Prerequisites

- Node.js 22+, [Corepack](https://nodejs.org/api/corepack.html) enabled (`corepack enable`), Docker with Docker Compose.
- Copy [`.env.example`](../../.env.example) to `.env.local` (database URL, `APP_URL`, SMTP pointing at Mailpit, `TEST_DATABASE_URL`). The migration CLI reads `.env` and `.env.local` from the project root (same as Next.js); shell `export` still overrides.
- Google OAuth credentials only for the Google sign-in check; magic links are read in Mailpit (http://localhost:8025).

## Run (validated)

```bash
corepack enable
yarn install
docker compose up -d        # PostgreSQL and Mailpit
yarn run migrate:up         # or rely on `yarn dev` (predev runs migrate:up)
yarn dev                    # http://localhost:3000
```

After a schema change:

```bash
yarn run db:codegen         # regenerates src/adapters/postgres/db-types.ts
```

## Automated checks (validated)

```bash
yarn typecheck
yarn lint
yarn run lint:tracking      # FR-024: no analytics or tracking dependencies
yarn run test:coverage      # Vitest 80% gate on logic folders
yarn run test:e2e           # Playwright (build + start via playwright.config.ts)
```

CI runs the same gates in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (`verify` job).

## Deployment smoke check (Docker Compose, not final)

Builds a local image, starts production Compose with Mailpit, waits for migrations, checks health and magic-link delivery:

```bash
yarn run smoke:compose
# equivalent: bash scripts/smoke-compose.sh
```

Manual health probe after a VPS deploy:

```bash
docker compose -f docker-compose.prod.yml up -d
curl -f http://localhost:3000/api/health
```

## Manual scenarios (map to spec)

1. Sign in with a magic link (read it in Mailpit) on two browser profiles. (US1, SC-001; Google sign-in is checked manually here)
2. Add one item of each type via quick add; count taps (max 3 plus title). (US2, SC-002)
3. Go offline, add/edit/check off/delete/search; reload while offline; app still loads. (FR-014, SC-008 repeat-visit load on a phone — target under 2 s on second open)
4. Edit the same field on both devices offline, reconnect; both show the latest value within 10 s. (SC-003, SC-004)
5. Edit on one device and delete on the other; latest action wins. (Edge cases)
6. Delete an item and use Undo. (FR-010)
7. Search with accents and different case ("elephant" finds "Éléphant"); a term present only in "recommended by" or notes finds nothing. (FR-012)
8. Install from a mobile browser, launch standalone; toggle system dark mode. (SC-007, FR-023)
9. With two accounts, confirm neither sees the other's data. (SC-005)
