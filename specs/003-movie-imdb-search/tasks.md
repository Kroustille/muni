# Tasks: Movie catalog search (003)

**Input**: `/specs/003-movie-imdb-search/`

**Prerequisites**: Feature **002** fully implemented (`specs/002-book-barcode-scan/tasks.md` complete, X1). Design docs: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md.

**Build order (X1)**: Complete this file before starting **004** (`specs/004-music-artists-tracks/tasks.md`).

**Task IDs**: **T301–T3xx** (feature 003 band).

---

## Phase 1: Setup

- [ ] T301 [P] Add i18n keys for movie catalog search, preview, media kinds in `src/i18n/fr.json`

---

## Phase 2: Foundational

- [ ] T302 Extend domain movie fields (`imdbId`, `synopsis`, `releaseYear`, `catalogRating`, `mediaKind`) in `src/domain/item.ts` with tests in `tests/unit/domain-item-movie-catalog.test.ts`
- [ ] T303 Migration `db/migrations/0004_movie_catalog_fields.ts` and regenerate `db-types.ts`
- [ ] T304 Define `MovieCatalogSearch` port in `src/application/ports/movie-catalog-search.ts`
- [ ] T305 [P] Unit tests for Wikidata mapper with fixture JSON in `tests/unit/wikidata-movie-mapper.test.ts`
- [ ] T306 Implement Wikidata adapter in `src/adapters/wikidata/movie-catalog-search.ts` with `catalog_cache` (depends on T304, T305)

---

## Phase 3: User Story 1 — Search and add (P1)

- [ ] T307 [US1] Unit tests `searchMovies` use case in `tests/unit/search-movies.test.ts`
- [ ] T308 [US1] Implement `src/application/movies/search-movies.ts`
- [ ] T309 [US1] Route tests `GET /api/movies/search` and `GET /api/movies/entity` in `tests/integration/movies-catalog-routes.test.ts`
- [ ] T310 [US1] Implement `src/app/api/movies/search/route.ts` and `src/app/api/movies/entity/route.ts`
- [ ] T311 [US1] Build `CatalogSearch` + preview components in `src/components/movies/` per contracts/ui-movie-search.md
- [ ] T312 [US1] Wire into movies list and quick-add (N4) in `src/app/(app)/movies/page.tsx` and quick-add flow
- [ ] T313 [US1] Extend IndexedDB and Postgres repositories for movie catalog fields

---

## Phase 4: User Story 2 — Dedupe, merge, restore (P1)

- [ ] T314 [US2] Unit tests `upsertMovieFromCatalog` (imdbId dedupe, restore, manual merge) in `tests/unit/upsert-movie-from-catalog.test.ts`
- [ ] T315 [US2] Implement `src/application/movies/upsert-from-catalog.ts`
- [ ] T316 [US2] Connect preview save to upsert use case

---

## Phase 5: User Story 3 — Catalog rating display (P2)

- [ ] T317 [US3] Show read-only catalog rating on movie detail; keep personal `rating` gated by `watched` status

---

## Phase 6: User Story 4 — Offline / failure (P2)

- [ ] T318 [US4] Disable search when offline with message; manual title-only add still works
- [ ] T319 [US4] E2e `tests/e2e/movies-catalog-search.spec.ts` with mocked API

---

## Phase 7: Polish

- [ ] T320 Run CI; update quickstart.md if needed

**Cross-feature**: Do not start 004 until T320 complete.
