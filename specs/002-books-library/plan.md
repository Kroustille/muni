# Implementation Plan: Books — library, catalog, and insights

**Branch**: `002-books-library` (work continues on `main`) | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-books-library/spec.md`

**Build order (X1)**: Phase **A** is **shipped** on `main`. Implement **Phases B → C → D** (this plan) before feature **003** (movies). Feature **004** (music) follows **003**.

**Task band**: Phase A used **T201–T2xx**. Phases B–D implementation tasks start at **T280+** (see `tasks.md` after `/speckit-tasks`).

## Summary

**Phase A (done)**: Mobile ISBN scan (continuous), server-proxied Open Library lookup with cache, title search, preview-and-confirm, silent ISBN dedupe/merge/restore. Book item + sync extended with catalog fields.

**Phase B — Library**: Enrich each **book item** with tags, series, `paused` + `pagesRead`, single active loan fields, Open Library **work id** for edition grouping, private notes (existing `notes`), and **book quotes** as synced child entities.

**Phase C — Discovery**: Optional **mood** and **pace** on books; list filters on mood, pace, and tags; **private** recommendations v1 (rule-based over the user’s library only).

**Phase D — Insights**: Annual **reading goal** (books finished per calendar year), **streak** and **activity heatmap** from **activity days** (no session timer), stats breakdowns, and optional year-in-review — mostly **derived** from items + goals + quote timestamps, with optional caching later if needed.

Architecture stays **hexagonal**, **offline-first**, **French UI**, **per-field LWW** sync on items and on quote rows. Match patterns in `src/domain/item.ts`, `src/application/server/sync-service.ts`, and numbered migrations under `db/migrations/`.

## Technical Context

**Language/Version**: TypeScript 5.x, Node 22, Next.js 15 (existing stack)

**Primary Dependencies**: Existing Muni hexagonal stack; Phase A barcode WASM + Open Library adapter (shipped)

**Storage**:
- **Items** (`items` / IndexedDB): new nullable book columns for B/C fields; extend book `status` check for `paused`
- **Book quotes**: new `book_quotes` table + IndexedDB store; **separate sync channel** mirroring item LWW (see data-model.md)
- **Reading goals**: new `reading_goals` table (one row per user per calendar year) + local mirror
- **Insights**: no required v1 table — derive activity days from item `fieldsUpdatedAt` + status/`pagesRead` semantics; optional `activity_day_cache` deferred

**Testing**: Vitest (domain, use cases, quote sync, activity derivation); Playwright for one B scenario (tags + paused) and one D scenario (goal + heatmap) per quickstart.md; isolation tests for quote APIs

**Target Platform**: Mobile PWA primary; desktop full parity except Phase A scan/ISBN lookup boundary (unchanged)

**Constraints**: X2 server proxy for catalog only; library/insights work offline; no analytics; no AI/ML for recommendations v1; integer 1–5 stars only; French i18n for all new strings

**Scale/Scope**: One user, thousands of books, hundreds of quotes per book max

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-first | Pass | Tags, pause, loans, quotes, goals, filters, and insights read/write local store; sync background |
| II. Capture speed | Pass | New fields optional on add; quick-add still title-only |
| III. Typed lists | Pass | Book-only fields; quotes scoped to `type=book` parent |
| IV. Simplicity | Pass | LWW only; recommendations = deterministic rules; activity derived not logged separately v1 |
| V. Privacy | Pass | Goals, streaks, recs private; no third-party insight services |
| VI. Portable backend | Pass | Postgres migrations; ports for quote repo + goal repo |
| VII. Hexagonal | Pass | `BookQuoteRepository`, `ReadingGoalRepository`, `ReadingActivity` (pure derive), `BookRecommender` port |

**Post-design re-check (B–D)**: Pass. Child-entity sync adds surface area but matches existing item sync patterns; justified in Complexity Tracking.

## Phased implementation outline

### Phase A — Catalog (shipped)

Delivered on `main`: scan, title search, lookup routes, catalog fields, dedupe/merge, mobile/desktop boundaries. See existing `tasks.md` T201–T238.

### Phase B — Library (T280+)

1. **Domain & migration** (`0008_book_library_fields.ts` or next index): `workId`, `tags`, `seriesName`, `seriesPosition`, `pagesRead`, `loanedTo`, `loanedAt`; extend `STATUSES.book` + DB check with `paused`.
2. **Catalog pipeline**: extend `BookCatalogHit` + Open Library adapter to expose `workId` from edition `works[0].key`; persist on upsert-from-catalog.
3. **Work grouping UI**: list/detail clusters by `workId` (fallback: ungrouped single edition); optional “Lier à une autre édition” sets shared `workId` (manual UUID when no OL id).
4. **Tags & series**: editors on book detail; filter chips on books list (title search unchanged per FR-013).
5. **Paused & pages read**: status picker includes **En pause**; conditional `pagesRead` when paused or reading.
6. **Lending**: borrower + optional date; clear = null both fields (no history).
7. **Quotes**: `book_quotes` entity, CRUD use cases, IndexedDB + Postgres repos, **`POST/GET /api/sync/quotes`** (or extend sync payload — see contracts); soft delete per quote.
8. **i18n** for all B strings.

**Checkpoint**: US5–US8 acceptance paths in spec; quickstart B smoke.

### Phase C — Discovery (T320+ band in tasks, after B stable)

1. **Mood & pace** optional fields on book (`mood`, `pace` — controlled vocab, see research.md).
2. **Filters**: combine with existing list query (tags AND mood/pace).
3. **Private recommendations v1**: `BookRecommender` port — score unread/to_read books by tag overlap, genre overlap, mood match with last N read books; surface small list on books tab (no network).

**Checkpoint**: US9–US10; filter + at least one rec scenario in quickstart (optional).

### Phase D — Insights (T360+ band in tasks, after C or parallel if no hard dep)

1. **Reading goals**: CRUD goal for current year; progress = count of books transitioned to `read` in that year (per activity rules).
2. **Activity days**: pure function `deriveActivityDays(items, timezone)` — day counts if any book had qualifying change that calendar day (status among book statuses, `pagesRead` change, or `read`).
3. **Streak**: longest/current streak over activity days (optional display; no notifications v1).
4. **Heatmap**: GitHub-style calendar from activity days.
5. **Stats & year-in-review**: aggregates (by month, tag, genre, author, pages) + simple recap screen.

**Checkpoint**: US11–US12; quickstart D smoke.

## Open Decisions

| ID | Decision | Status |
|----|----------|--------|
| OD-002-1 | Open Library sole provider (B1) | **Settled** (Phase A) |
| OD-002-2 | WASM scanner iOS; native Android when present (B2) | **Settled** (Phase A) |
| OD-002-3 | Manual row merge without ISBN | **Settled** in research.md (Phase A) |
| OD-002-4 | One row per edition; group by `workId` (OL or manual) | **Settled** (clarify 2026-10-16) |
| OD-002-5 | `paused` + `pagesRead`; no DNF status | **Settled** |
| OD-002-6 | Quotes as synced child entities | **Settled** |
| OD-002-7 | Single active loan fields; no loan history v1 | **Settled** |
| OD-002-8 | Activity days from status / pagesRead / read (no timer) | **Settled** |
| OD-002-9 | Activity calendar **timezone** (user local vs UTC) | **Open** — recommend **Europe/Paris** default with `Intl` local midnight; confirm with Valentin |
| OD-002-10 | Mood/pace **controlled vocabulary** (exact French labels) | **Open** — propose lists in research.md §8; Valentin to trim |
| OD-002-11 | Manual **work link** UX (pick sibling edition vs type work id) | **Open** — recommend “pick another edition in library” |
| OD-002-12 | Quote sync: **separate `/api/sync/quotes`** vs bundled push | **Settled** — separate channel (smaller payloads, same LWW rules) |
| OD-002-13 | Recommendations v1 **scoring weights** | **Open** — defaults in research.md §9; tune in hillclimb later |

## Project Structure

### Documentation (this feature)

```text
specs/002-books-library/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── book-catalog-api.md      # Phase A lookup (+ catalogWorkId in Phase B)
│   ├── ui-book-scan.md          # Phase A scan/preview
│   ├── book-quotes-sync.md      # Phase B quotes child sync
│   ├── book-library-ui.md       # Phase B library UX
│   ├── book-discovery-ui.md     # Phase C
│   └── book-insights-ui.md      # Phase D
└── tasks.md                     # Phase A T201–T247; Phases B–D T280–T342
```

### Source changes (incremental)

**Phase A (existing)**:

```text
src/application/ports/book-catalog-lookup.ts
src/adapters/open-library/book-catalog-lookup.ts
src/app/api/books/lookup/route.ts
src/components/books/*
db/migrations/0003_book_catalog_fields.ts
db/migrations/0004_catalog_cache.ts
```

**Phases B–D (planned)**:

```text
src/domain/item.ts                          # book fields + paused status
src/domain/book-quote.ts                    # quote entity + validation
src/domain/reading-activity.ts              # derive activity days, streaks
src/application/ports/book-quote-repository.ts
src/application/ports/reading-goal-repository.ts
src/application/ports/book-recommender.ts
src/application/book-quotes/*
src/application/reading-goals/*
src/application/insights/*
src/adapters/postgres/book-quote-repository.ts
src/adapters/indexeddb/book-quote-repository.ts
src/app/api/sync/quotes/route.ts
src/components/books/book-detail-*.tsx      # tags, series, loan, quotes, work group
src/components/books/books-filters.tsx
src/components/insights/*
db/migrations/0008_book_library_fields.ts
db/migrations/0009_book_quotes.ts
db/migrations/0010_reading_goals.ts
```

## Complexity Tracking

| Addition | Why needed |
|----------|------------|
| `book_quotes` + quote sync | FR-B06 child entities with independent LWW; avoids bloating `items` JSON |
| Separate sync route for quotes | Keeps item push size stable; same merge semantics |
| Derived activity (no event log v1) | FR-D02 without session timer; recompute from `fieldsUpdatedAt` — acceptable at scale target |

No constitution violations.
