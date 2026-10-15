# Implementation Plan: Movie catalog search

**Branch**: `003-movie-imdb-search` | **Date**: 2026-10-15 | **Spec**: [spec.md](spec.md)

**Build order (X1)**: Start **only after feature 002** is implemented end-to-end. Feature **004** (music) follows **this feature (003)**.

## Summary

Server-proxied Wikidata SPARQL/entity search for films and TV series with French labels, map to `imdbId` when available, disambiguation list UI, preview with full edit, silent dedupe/merge/restore by `imdbId`. Extend movie item model. Reuse `catalog_cache` pattern from 002 with provider `wikidata`.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 15 (existing)

**Primary Dependencies**: Wikidata Query Service (keyless HTTP); optional reuse of `catalog_cache` table from 002 migration

**Storage**: New movie columns on `items`; cache keys `search:{hash}` and `entity:{qid}`

**Testing**: Unit tests for SPARQL result mapping; integration tests with recorded fixtures; e2e search flow

**Constraints**: M1 keyless; X2–X4; no covers; FR-first labels

## Constitution Check

| Principle | Status |
|-----------|--------|
| I Offline-first | Pass — manual add offline |
| II Capture | Pass — title-only required |
| III Typed lists | Pass — movie-only fields |
| IV Simplicity | Pass — one provider |
| V Privacy | Pass — auth + user-scoped items |
| VI Portable | Pass — Wikidata behind port |
| VII Hexagonal | Pass — `MovieCatalogSearch` port |

## Project Structure

```text
specs/003-movie-imdb-search/
├── plan.md, research.md, data-model.md, quickstart.md
├── contracts/movie-catalog-api.md, contracts/ui-movie-search.md
└── tasks.md
```

```text
src/application/ports/movie-catalog-search.ts
src/application/movies/search-movies.ts
src/application/movies/upsert-from-catalog.ts
src/adapters/wikidata/movie-catalog-search.ts
src/app/api/movies/search/route.ts
src/app/api/movies/entity/route.ts
src/components/movies/catalog-search.tsx
db/migrations/0004_movie_catalog_fields.ts
```

## Complexity Tracking

Empty.
