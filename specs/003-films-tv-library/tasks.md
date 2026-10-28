# Tasks: Movie catalog search (003)

**Input**: `/specs/003-films-tv-library/`

**Prerequisites**: Feature **002** fully implemented (`specs/002-books-library/tasks.md` complete, X1). Design docs: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md.

**Build order (X1)**: Complete this file before starting **004** (`specs/004-music-artists-tracks/tasks.md`).

**Task IDs**: **T301–T3xx** (feature 003 band).

---

## Phase 1: Setup

- [x] T301 [P] Add i18n keys for movie catalog search, preview, media kinds in `src/i18n/fr.json`

---

## Phase 2: Foundational

- [x] T302 Extend domain movie fields (`imdbId`, `synopsis`, `releaseYear`, `catalogRating`, `mediaKind`) in `src/domain/item.ts` with tests in `tests/unit/domain-item-movie-catalog.test.ts`
- [x] T303 Migration `db/migrations/0005_movie_catalog_fields.ts` and regenerate `db-types.ts`
- [x] T304 Define `MovieCatalogSearch` port in `src/application/ports/movie-catalog-search.ts`
- [x] T305 [P] Unit tests for Wikidata mapper with fixture JSON in `tests/unit/wikidata-movie-mapper.test.ts`
- [x] T306 Implement Wikidata adapter in `src/adapters/wikidata/movie-catalog-search.ts` with `catalog_cache` (depends on T304, T305)

---

## Phase 3: User Story 1 — Search and add (P1)

- [x] T307 [US1] Unit tests `searchMovies` use case in `tests/unit/search-movies.test.ts`
- [x] T308 [US1] Implement `src/application/movies/search-movies.ts`
- [x] T309 [US1] Route tests `GET /api/movies/search` and `GET /api/movies/entity` in `tests/integration/movies-catalog-routes.test.ts`
- [x] T310 [US1] Implement `src/app/api/movies/search/route.ts` and `src/app/api/movies/entity/route.ts`
- [x] T311 [US1] Build `CatalogSearch` + preview components in `src/components/movies/` per contracts/ui-movie-search.md
- [x] T312 [US1] Wire into movies list and quick-add (N4) in list page and quick-add flow
- [x] T313 [US1] Extend IndexedDB and Postgres repositories for movie catalog fields

---

## Phase 4: User Story 2 — Dedupe, merge, restore (P1)

- [x] T314 [US2] Unit tests `upsertMovieFromCatalog` (imdbId dedupe, restore, manual merge) in `tests/unit/upsert-movie-from-catalog.test.ts`
- [x] T315 [US2] Implement `src/application/movies/upsert-from-catalog.ts`
- [x] T316 [US2] Connect preview save to upsert use case

---

## Phase 5: User Story 3 — Catalog rating display (P2)

- [x] T317 [US3] Show read-only catalog rating on movie detail; keep personal `rating` gated by `watched` status

---

## Phase 6: User Story 4 — Offline / failure (P2)

- [x] T318 [US4] Disable search when offline with message; manual title-only add still works
- [x] T319 [US4] E2e `tests/e2e/movies-catalog-search.spec.ts` with mocked API

---

## Phase 7: Polish

- [x] T320 Local quality gate (no GitHub CI): `yarn typecheck`, `yarn test` / vitest; e2e when Docker stack available; update quickstart.md if needed

**Cross-feature**: Do not start 004 until T320 complete.

---

## Phase 8: Foundational — Phases B–D (library, discovery, insights)

**Purpose**: Contracts, data model, migrations, domain, ports, watch-activity rules before US5–US12.

**Prerequisite**: Phase A complete (**T320** done).

- [x] T343 Extend `specs/003-films-tv-library/data-model.md` with Phase B–D fields per spec FR-B*–FR-D*
- [x] T344 [P] Author `contracts/movie-library-ui.md` (tags, franchise, statuses, episodes, watch date)
- [x] T345 [P] Author `contracts/movie-quotes-sync.md`
- [x] T346 [P] Author `contracts/movie-discovery-ui.md`
- [x] T347 [P] Author `contracts/movie-insights-ui.md`
- [x] T348 Unit tests for extended movie item validation (statuses, tags, franchise, episodeProgress) in `tests/unit/domain-item-movie-library.test.ts`
- [x] T349 Extend movie zod schema in `src/domain/item.ts` per data-model.md (depends on T348)
- [x] T350 Migration `db/migrations/0011_movie_library_fields.ts` (tags, franchise, watchedAt, episodeProgress, mood, pace, streamingProviders)
- [x] T351 Migration `db/migrations/0012_movie_quotes.ts` per movie-quotes-sync.md
- [x] T352 [P] Migration `db/migrations/0013_user_watch_settings.ts` for annual watch goal
- [x] T353 Regenerate `src/adapters/postgres/db-types.ts` after T350–T352
- [x] T354 [P] `MovieQuote` domain + tests in `src/domain/movie-quote.ts`, `tests/unit/domain-movie-quote.test.ts`
- [x] T355 `MovieQuoteRepository` port in `src/application/ports/movie-quote-repository.ts`
- [x] T356 Unit tests for watch activity rules in `tests/unit/watch-activity.test.ts`
- [x] T357 Implement `deriveWatchActivityDays` in `src/application/movies/watch-activity.ts` (depends on T356)
- [x] T358 Extend catalog upsert/detail for cast persistence if missing from Phase A
- [x] T359 [P] i18n keys for library, discovery, insights, episodes, franchise in `src/i18n/fr.json`

---

## Phase 9: User Story 5 — Tags and franchise (P1)

- [x] T360 [US5] Unit tests `filterMoviesByTagOrFranchise` in `tests/unit/movie-library-filters.test.ts`
- [x] T361 [US5] Implement filters in `src/application/movies/movie-library-filters.ts`
- [x] T362 [US5] Repository mapping for library columns in IndexedDB + Postgres
- [x] T363 [US5] Tag + franchise UI on movie detail per movie-library-ui.md
- [x] T364 [US5] Filters on movies list page
- [x] T365 [US5] E2e tags + franchise filter in `tests/e2e/movies-tags-franchise.spec.ts`

---

## Phase 10: User Story 6 — En cours, en pause, vu (P1)

- [x] T366 [US6] Unit tests status rules (no en cours on films) in `tests/unit/movie-status-rules.test.ts`
- [x] T367 [US6] Status picker + watch date in `src/components/fields/movie-fields.tsx`
- [x] T368 [US6] Wire activity derivation on status/`watchedAt` writes
- [x] T369 [US6] E2e série en cours + film en pause in `tests/e2e/movies-status-pause.spec.ts`

---

## Phase 11: User Story 7 — Episodes and next episode (P1)

- [x] T370 [US7] Unit tests episode progress + next key in `tests/unit/movie-episode-progress.test.ts`
- [x] T371 [US7] Implement `markEpisodeWatched` / `computeNextEpisode` in `src/application/movies/episode-progress.ts`
- [x] T372 [US7] Episode grid UI on série detail per movie-library-ui.md
- [x] T373 [US7] Optional release reminder scheduling (PWA)
- [x] T374 [US7] E2e mark épisode vu updates next episode in `tests/e2e/movies-episodes.spec.ts`

---

## Phase 12: User Story 8 — Notes and quotes (P2)

- [x] T375 [US8] Unit tests movie quote use cases in `tests/unit/movie-quotes.test.ts`
- [x] T376 [US8] Implement `src/application/movies/movie-quotes.ts`
- [x] T377 [US8] IndexedDB + Postgres quote repositories
- [x] T378 [US8] Sync push/pull routes + engine per movie-quotes-sync.md
- [x] T379 [US8] `MovieQuotesSection` on detail
- [x] T380 [US8] Integration isolation tests + e2e quote offline sync

---

## Phase 13: User Story 9 — Mood, filters, where to watch (P2)

- [x] T381 [US9] Unit tests discovery filters in `tests/unit/movie-discovery-filters.test.ts`
- [x] T382 [US9] Implement `filterMoviesByDiscovery` in `src/application/movies/discovery-filters.ts`
- [x] T383 [US9] Mood/pace fields + discovery sheet per movie-discovery-ui.md
- [x] T384 [US9] Server streaming lookup route + cache (stub OK initially)
- [x] T385 [US9] E2e discovery filter + empty streaming state

---

## Phase 14: User Story 10 — Private recommendations (P3)

- [x] T386 [US10] Unit tests `suggestMovies` in `tests/unit/movie-recommendations.test.ts`
- [x] T387 [US10] Implement `src/application/movies/recommendations.ts`
- [x] T388 [US10] Recommendations panel on movies list
- [x] T389 [US10] E2e recommendations smoke

---

## Phase 15: User Story 11 — Goals, streak, heatmap (P2)

- [x] T390 [US11] Unit tests streak/heatmap in `tests/unit/watch-insights.test.ts`
- [x] T391 [US11] Implement `computeWatchStreak` / `buildWatchHeatmap` in `src/application/movies/watch-insights.ts`
- [x] T392 [US11] Watch goal use case + repository
- [x] T393 [US11] Insights page per movie-insights-ui.md
- [x] T394 [US11] E2e heatmap on status/episode change

---

## Phase 16: User Story 12 — Stats and year-in-review (P3)

- [x] T395 [US12] Unit tests `computeMovieStats` in `tests/unit/movie-stats.test.ts`
- [x] T396 [US12] Implement stats + year-in-review in `src/application/movies/movie-stats.ts`
- [x] T397 [US12] Stats views on insights page
- [x] T398 [US12] E2e stats smoke

---

## Phase 17: Polish — Phases B–D

- [x] T399 [P] Extend `quickstart.md` with Phase B–D manual validation
- [x] T400 Local quality gate: typecheck, vitest, e2e for US5–US12

---

## Phase 18: Catalog search quality & fallback (2026-10-28)

- [x] T401 [P1] Unit tests Wikidata search edge cases + empty result handling in `tests/unit/wikidata-movie-search.test.ts`
- [x] T402 [P1] Improve Wikidata query params (French labels, entity type filters) in adapter
- [ ] T403 [P2] TMDB search adapter + `TMDB_API_KEY` env; composite port Wikidata → TMDB fallback
- [ ] T404 [P2] Map TMDB hits to `MovieSearchHit`; optional persist `tmdbId` on item (migration + domain)
- [ ] T405 [P2] Integration tests composite search route in `tests/integration/movies-catalog-routes.test.ts`
- [x] T406 [P1] E2e honest empty search → manual add path (movies quick-add)
- [ ] T407 [P3] Optional **TVDB** episode-list enrichment for séries — server key; research.md §18 public-apis Video entry

---

## Dependencies (Phases B–D)

**Gate**: T343+ after **T320** complete.

```text
T320 → Phase 8 (T343–T359)
  → US5 (T360–T365) → US9 (T381–T385) → US10 (T386–T389)
  → US6 (T366–T369) → US7 (T370–T374)
  → US8 (T375–T380) after T355
  → US11 (T390–T394) → US12 (T395–T398)
  → T399–T400
```
