# Muni

**Muni** is an offline-first life companion PWA — a mobile-first second brain for typed lists that sync across phone and desktop. The name comes from **Muninn**, Odin's raven of memory.

Capture books, films, recipes, and shopping in a few taps; browse and update them offline; changes sync when you're back online. The UI is **French** (i18n message catalog); this README is in English.

## Getting started

- [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md) — run locally
- [specs/001-typed-lists-companion/quickstart.md](specs/001-typed-lists-companion/quickstart.md) — smoke scenarios
- [Spec Kit workflow](.github/CONTRIBUTING.md) — new features

## Features

**Core (v1)** — four typed lists with quick-add, search, ratings, and per-field sync:

| List | Highlights |
|------|------------|
| **Shopping** | Check off items, fast capture |
| **Books** | Reading status, 1–5 star rating when finished |
| **Movies** | Watch status, personal rating |
| **Recipes** | Ingredients, steps, notes |

**Catalog extensions** (spec-driven; see [`specs/`](specs/)):

- **Books** — library, catalog, and insights ([`002-books-library`](specs/002-books-library/spec.md))
- **Films & TV** — library, catalog, and insights (Wikidata / IMDb id), planned ([`003-films-tv-library`](specs/003-films-tv-library/spec.md))
- **Music** — artists and tracks lists with optional MusicBrainz search + Spotify/SoundCloud links, planned ([`004-music-artists-tracks`](specs/004-music-artists-tracks/spec.md))

Sign-in: Google or email magic link (SMTP). First use needs a network connection; after that the app works fully offline and an expired session never blocks local data.

## Stack

Single **Next.js 15** app (App Router): React UI + API route handlers in one deployable.

- **Architecture** — domain-driven design, **hexagonal** (ports & adapters): pure `domain`, `application` use cases, adapters for IndexedDB, PostgreSQL (Kysely), SMTP, OIDC, and browser APIs
- **Client** — IndexedDB is the UI source of truth; background sync to self-hosted PostgreSQL; **Serwist** PWA
- **Server** — Node route handlers, sessions in PostgreSQL, no third-party BaaS or analytics

Details: [`specs/001-typed-lists-companion/plan.md`](specs/001-typed-lists-companion/plan.md) and [`.specify/memory/constitution.md`](.specify/memory/constitution.md).

## Local development

Clone, prerequisites, `.env.local`, Docker, migrations, and Mailpit sign-in: **[docs/GETTING-STARTED.md](docs/GETTING-STARTED.md)**.

**Checks:** `yarn typecheck`, `yarn test`, `yarn test:coverage`, `yarn test:e2e`. Manual scenarios: [v1 quickstart](specs/001-typed-lists-companion/quickstart.md); catalog features add [002](specs/002-books-library/quickstart.md), [003](specs/003-films-tv-library/quickstart.md), [004](specs/004-music-artists-tracks/quickstart.md) when relevant.

## Specifications

Features are specified under [`specs/`](specs/) using [GitHub Spec Kit](https://github.com/github/spec-kit) (constitution, spec, plan, tasks). Start with [`specs/001-typed-lists-companion/spec.md`](specs/001-typed-lists-companion/spec.md).

## Commits

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) — e.g. `feat: add quick add bar`, `docs: update readme`. See the constitution for project conventions.
