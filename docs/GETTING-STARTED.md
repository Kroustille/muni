# Getting started

Run Muni locally for development and manual validation.

## Clone

```bash
git clone https://github.com/Kroustille/muni
cd muni
```

## Prerequisites

- **Node.js 22+** ([engines](../package.json) in `package.json`)
- **[Corepack](https://nodejs.org/api/corepack.html)** enabled (`corepack enable`) — Yarn is pinned via `packageManager`
- **Docker** with Docker Compose — PostgreSQL 16 and [Mailpit](https://github.com/axllent/mailpit) for local SMTP

## Setup

```bash
corepack enable
yarn install
cp .env.example .env.local
```

Configure `.env.local` from [`.env.example`](../.env.example):

| Variable | Local default | Purpose |
|----------|---------------|---------|
| `DATABASE_URL` | `postgres://muni:muni@localhost:5432/muni` | App database |
| `TEST_DATABASE_URL` | `postgres://muni:muni@localhost:5432/muni_test` | Vitest integration tests |
| `APP_URL` | `http://localhost:3000` | Magic-link URLs |
| `SMTP_HOST` / `SMTP_PORT` | `localhost` / `1025` | Mailpit SMTP |
| `SMTP_FROM` | `Muni <no-reply@muni.local>` | From address |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | empty | Optional; only for Google sign-in checks |

Start backing services and run the dev server (migrations apply automatically via `predev`):

```bash
yarn db:up          # or: docker compose up -d
yarn dev            # http://localhost:3000 — runs migrate:up first
```

To apply migrations without starting the app: `yarn migrate:up`.

After a schema change: `yarn db:codegen` (regenerates `src/adapters/postgres/db-types.ts`).

## Sign in (Mailpit)

1. Open http://localhost:3000 and request an email magic link.
2. Open Mailpit at http://localhost:8025 and open the message.
3. Follow the link to complete sign-in.

Google sign-in requires valid `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`.

## Automated checks

### Test tiers

| Tier | Command | Prerequisites |
|------|---------|----------------|
| **Unit** | `yarn vitest run tests/unit` | Node + `yarn install` only |
| **Integration** | `yarn vitest run tests/integration` | Docker: Postgres (`yarn db:up`) and Mailpit for SMTP/auth route tests; set `TEST_DATABASE_URL` in `.env.local` (see [Setup](#setup)) |
| **E2E** | `yarn test:e2e` | Docker stack up; Playwright browsers (`npx playwright install` on first run); app reachable at `APP_URL` (default `http://localhost:3000`) — start with `yarn dev` or CI equivalent |
| **CI parity** | `yarn verify:ci` | Same steps as GitHub Actions `verify` job — run before pushing to `main` (`yarn db:up` first) |

`yarn test` runs **all** Vitest suites (unit + integration). CI-style quick gate on a clean VM: `yarn typecheck` then `yarn vitest run tests/unit`.

```bash
yarn typecheck
yarn test
yarn test:coverage
yarn test:e2e
```

### E2E smoke matrix (library richness)

Playwright specs under `tests/e2e/` — one list smoke per type plus “library richness” paths where the feature exists:

| Area | Spec | What it covers |
|------|------|----------------|
| Lists (all types) | `lists.spec.ts` | Quick-add, filters, recipe edit, movie delete/undo |
| Books — pause + lend | `books-pause-lending.spec.ts` | Pause, pages read, loan/return |
| Books — catalog | `books-catalog-title-search.spec.ts` | Mocked Open Library flow |
| Movies — pause + vu | `movies-status-pause.spec.ts` | Pause, watched date |
| Movies — franchise/tags | `movies-tags-franchise.spec.ts` | Library metadata |
| Movies — épisodes | `movies-episodes.spec.ts` | Mocked Wikidata série → mark **S1E1** vu |
| Movies — streaming stub | `movies-discovery-filters.spec.ts` (detail empty state) | Filters; streaming panel honest empty |
| Music | `music-no-playback.spec.ts` | No in-app playback boundary |
| Sync / auth / PWA | `sync.spec.ts`, `auth.spec.ts`, `home-pwa.spec.ts` | Core platform |

Episode progress logic is also covered in unit tests (`movie-episode-progress.test.ts`). Annual reading/watch goals remain **local-only** in v1 — see `specs/002-books-library/research.md` and `specs/003-films-tv-library/research.md`.

## Manual validation

- **[Muni v1 — validation guide](../specs/001-typed-lists-companion/quickstart.md)** — core smoke scenarios (auth, offline, sync, search, PWA).
- **[Books library (002)](../specs/002-books-library/quickstart.md)** — Open Library lookup, mobile scan, desktop boundaries (after 002 is implemented).
- **[Films & TV library (003)](../specs/003-films-tv-library/quickstart.md)** — title search and dedupe (after 002 and 003 are implemented).
- **[Music artists & tracks (004)](../specs/004-music-artists-tracks/quickstart.md)** — manual quick-add and catalog search on list pages (after prior features per spec order).

## New features (Spec Kit)

Use the [Spec Kit workflow](../.github/CONTRIBUTING.md): constitution → spec → plan → tasks → implement under [`specs/`](../specs/).

---

**Maintainers:** after implement agents finish, run `./scripts/set-github-repo-metadata.sh` from the repo root (requires `gh` auth with admin on the repository). See [GITHUB-REPO-SETTINGS.md](./GITHUB-REPO-SETTINGS.md).
