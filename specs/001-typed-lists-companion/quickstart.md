# Quickstart: Validation Guide

Validation scenarios for Muni v1. Setup details are filled in during implementation.

## Prerequisites
- Node.js 22, npm, Docker with Docker Compose.
- `.env.local` copied from `.env.example` (database URL, `APP_URL`, SMTP settings pointing at Mailpit, test database URL).
- Google OAuth credentials only for the Google sign-in check; magic links are read in Mailpit (http://localhost:8025).

## Run
```bash
npm install
docker compose up -d        # PostgreSQL and Mailpit
npm run migrate:up          # compiles and applies db/migrations (Kysely Migrator)
npm run db:codegen          # regenerates src/adapters/postgres/db-types.ts after a schema change
npm run dev                 # http://localhost:3000
```

## Automated checks
```bash
npm run test:coverage         # Vitest with the 80% gate on logic folders: domain, use cases, adapters, PostgreSQL isolation, merge vectors, sync, search, architecture
npm run lint:tracking         # no analytics or tracking dependencies
npm run test:e2e              # Playwright: auth, offline, two-device sync, install
```

## Deployment smoke check (Docker Compose, not final)
```bash
docker compose -f docker-compose.prod.yml up --build -d   # app, PostgreSQL, migration job
curl -f http://localhost:3000/api/health
```

## Manual scenarios (map to spec)
1. Sign in with a magic link (read it in Mailpit) on two browser profiles. (US1, SC-001; Google sign-in is checked manually here)
2. Add one item of each type via quick add; count taps (max 3 plus title). (US2, SC-002)
3. Go offline, add/edit/check off/delete/search; reload while offline; app still loads. (FR-014, SC-008)
4. Edit the same field on both devices offline, reconnect; both show the latest value within 10 s. (SC-003, SC-004)
5. Edit on one device and delete on the other; latest action wins. (Edge cases)
6. Delete an item and use Undo. (FR-010)
7. Search with accents and different case ("elephant" finds "Éléphant"); a term present only in "recommended by" or notes finds nothing. (FR-012)
8. Install from a mobile browser, launch standalone; toggle system dark mode. (SC-007, FR-023)
9. With two accounts, confirm neither sees the other's data. (SC-005)
