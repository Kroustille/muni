# Tasks: Book barcode scan (002)

**Input**: Design documents from `/specs/002-book-barcode-scan/`

**Prerequisites**: Muni v1 (`001`) merged or available on `main`; plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Build order (X1)**: Complete **all tasks in this file** before starting feature **003** (`specs/003-movie-imdb-search/tasks.md`). Feature **004** follows **003**.

**Architecture**: Hexagonal — domain extensions, `BookCatalogLookup` and `BarcodeScanner` ports, Open Library adapter, route handler, mobile UI driving adapters. TDD per constitution.

**Tests**: Write tests before implementation in each story unless noted [P] parallel file.

**Task IDs**: **T201–T279** Phase A (catalog); **T280+** Phases B–D (library, discovery, insights).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Feature 002)

- [x] T201 Add Open Library and barcode WASM dependencies and document versions in `package.json` per research.md
- [x] T202 [P] Add i18n keys for scan, preview, lookup errors, genres editor in `src/i18n/fr.json`

---

## Phase 2: Foundational (Blocking)

**Purpose**: Schema, domain, ports, cache, ISBN utilities — required before user stories.

- [x] T203 Create unit tests for ISBN normalize/validate (ISBN-10/13, checksum, reject invalid) in `tests/unit/isbn.test.ts`
- [x] T204 Implement ISBN helpers in `src/domain/isbn.ts` (depends on T203)
- [x] T205 Extend domain `Item` / book zod schema with `isbn`, `synopsis`, `genres`, `publicationYear`, `publisher`, `pageCount` per data-model.md in `src/domain/item.ts` with cross-type null rules
- [x] T206 Create unit tests for book catalog field validation on `Item` in `tests/unit/domain-item-book-catalog.test.ts` (depends on T205)
- [x] T207 Write Kysely migration `db/migrations/0002_book_catalog_fields.ts` adding nullable columns to `items` for book catalog fields
- [x] T208 Write Kysely migration `db/migrations/0003_catalog_cache.ts` for `catalog_cache` table per data-model.md
- [x] T209 Regenerate and commit `src/adapters/postgres/db-types.ts` via `yarn run db:codegen` after T207–T208
- [x] T210 Define `BookCatalogLookup` port in `src/application/ports/book-catalog-lookup.ts` per contracts/book-catalog-api.md
- [x] T211 Define `BarcodeScanner` port (`scanContinuous(callback)`, `stop()`) in `src/application/ports/barcode-scanner.ts`
- [x] T212 [P] Create unit tests for `CatalogCacheRepository` TTL logic in `tests/unit/catalog-cache.test.ts`
- [x] T213 Implement `CatalogCacheRepository` port and Postgres adapter in `src/application/ports/catalog-cache-repository.ts` and `src/adapters/postgres/catalog-cache-repository.ts` (depends on T208, T212)

**Checkpoint**: Domain and persistence ready.

---

## Phase 3: User Story 1 — Scan and add from catalog (P1)

**Goal**: Mobile scan → server lookup → editable preview → save.

**Independent Test**: quickstart.md mobile scan section.

- [x] T214 [US1] Create unit tests for `lookupBook` use case (valid ISBN, not found, provider error) with fake port in `tests/unit/lookup-book.test.ts`
- [x] T215 [US1] Implement `lookupBook` in `src/application/books/lookup-book.ts` (depends on T210, T214)
- [x] T216 [P] [US1] Create unit tests for Open Library adapter mapping to `BookCatalogHit` with mocked fetch in `tests/unit/open-library-adapter.test.ts`
- [x] T217 [US1] Implement Open Library adapter in `src/adapters/open-library/book-catalog-lookup.ts` with cache via T213 (depends on T216)
- [x] T218 [US1] Create route handler tests for `GET /api/books/lookup` (401, 400, 404, 200) in `tests/integration/books-lookup-route.test.ts`
- [x] T219 [US1] Implement `src/app/api/books/lookup/route.ts` wiring cache + adapter + session (depends on T215, T217, T218)
- [x] T220 [P] [US1] Create unit tests for WASM/native `BarcodeScanner` adapter with injected frame source in `tests/unit/barcode-scanner.test.ts`
- [x] T221 [US1] Implement `src/adapters/browser/barcode-scanner.ts` (iOS WASM always; Android BarcodeDetector when available) per research.md (depends on T220)
- [x] T222 [US1] Build `CatalogPreview` component in `src/components/books/catalog-preview.tsx` per contracts/ui-book-scan.md (depends on T202)
- [x] T223 [US1] Build `ScanModal` in `src/components/books/scan-modal.tsx` continuous scan UX (depends on T221, T222)
- [x] T224 [US1] Wire scan + lookup + preview into books list page `src/app/(app)/books/page.tsx` (mobile only) (depends on T219, T223)
- [x] T225 [US1] Wire scan entry into book quick-add flow in `src/components/quick-add/` (mobile only, N3) (depends on T224)
- [x] T226 [US1] Extend IndexedDB item repository mapping for new book fields in `src/adapters/indexeddb/item-repository.ts` (depends on T205)
- [x] T227 [US1] Extend Postgres item repository for new columns in `src/adapters/postgres/server-item-repository.ts` (depends on T207, T209)

---

## Phase 4: User Story 2 — Dedupe, merge, restore (P1)

**Goal**: Silent ISBN upsert, manual merge, soft-delete restore (B4, B5, L1).

**Independent Test**: quickstart.md dedupe and soft-delete sections.

- [x] T228 [US2] Create unit tests for `upsertBookFromCatalog` (duplicate ISBN update, restore deleted, manual merge title+author) in `tests/unit/upsert-book-from-catalog.test.ts`
- [x] T229 [US2] Implement `upsertBookFromCatalog` in `src/application/books/upsert-from-catalog.ts` per research.md merge rules (depends on T228, T215)
- [x] T230 [US2] Connect preview confirm to `upsertBookFromCatalog` in `src/components/books/catalog-preview.tsx` (depends on T229, T222)

---

## Phase 5: User Story 3 — Lookup failure & desktop boundary (P2)

- [x] T231 [US3] Implement lookup failure → manual add with ISBN prefilled in scan/preview flow (depends on T224, B10)
- [x] T232 [US3] Add e2e test desktop has no scan control in `tests/e2e/books-desktop.spec.ts`
- [x] T233 [US3] Add e2e test lookup failure path with mocked API in `tests/e2e/books-lookup-failure.spec.ts`

---

## Phase 6: User Story 4 — Manual ISBN on mobile (P2)

- [x] T234 [US4] Add manual ISBN field + lookup trigger on mobile book add UI per contracts/ui-book-scan.md
- [x] T235 [US4] Unit test manual ISBN path reuses preview in `tests/unit/books-manual-isbn.test.ts`

---

## Phase 7: Polish

- [x] T236 [P] Show `pageCount` on book detail when present (N1) in book detail component
- [x] T237 Update `specs/002-book-barcode-scan/quickstart.md` with any command fixes after implementation
- [x] T238 Local quality gate (no GitHub CI): `yarn typecheck`, `yarn test` / vitest; e2e when Docker stack available — and fix regressions

---

## Phase 8: User Story 1 extension — Title catalog search (B11)

**Goal**: Mobile title search in Open Library; pick one row; same preview/merge as ISBN; desktop unchanged (B9).

- [x] T239 Extend `BookCatalogLookup` port with `searchByTitle` in `src/application/ports/book-catalog-lookup.ts` and contracts/book-catalog-api.md
- [x] T240 [P] Unit tests for Open Library search mapper and adapter `searchByTitle` in `tests/unit/open-library-search-mapper.test.ts` and `tests/unit/open-library-adapter.test.ts`
- [x] T241 Implement Open Library `search.json` in adapter with `search:…` cache keys (array jsonb) in `src/adapters/open-library/`
- [x] T242 Fix Postgres `catalog_cache` jsonb round-trip for array payloads + integration test in `tests/integration/postgres-catalog-cache.test.ts`
- [x] T243 Implement `searchBooks` use case and `GET /api/books/search` route; wire `searchBooks` in `src/composition/server.ts`
- [x] T244 [P] Route and use-case tests in `tests/integration/books-search-route.test.ts` and `tests/unit/search-books.test.ts`
- [x] T245 Build mobile `BookCatalogSearchSheet` + **Rechercher par titre** on list and quick-add; i18n `fr.json`
- [x] T246 Update spec clarifications (B11), contracts, and research.md for title search
- [x] T247 Enable **Rechercher par titre** on desktop (books list + quick-add); scan/ISBN remain mobile-only; e2e `books-catalog-title-search.spec.ts`

---

## Phase 9: Foundational — Phases B–D (library, discovery, insights)

**Purpose**: Contracts, data model, migrations, domain, ports, and shared reading-activity rules before US5–US12.

**Prerequisite**: Phase A complete (**T238** done).

- [ ] T280 Extend `specs/002-book-barcode-scan/data-model.md` with Phase B–D fields (tags, series, `catalogWorkId`/`workKey`, `pagesRead`, lending, mood/pace, `book_quotes` child, reading settings) per spec FR-B*–FR-D*
- [ ] T281 [P] Author `specs/002-book-barcode-scan/contracts/book-library-ui.md` (tags, series, work grouping, **En pause**, lending, notes scope) mapping FR-B01–B07
- [ ] T282 [P] Author `specs/002-book-barcode-scan/contracts/book-quotes-sync.md` (quote wire, push/pull, per-field LWW, soft delete, isolation)
- [ ] T283 [P] Author `specs/002-book-barcode-scan/contracts/book-discovery-ui.md` (mood/pace editors, discovery filters, recommendations surface)
- [ ] T284 [P] Author `specs/002-book-barcode-scan/contracts/book-insights-ui.md` (annual goal, streak, heatmap, stats, year-in-review)
- [ ] T285 Extend `BookCatalogHit` + `specs/002-book-barcode-scan/contracts/book-catalog-api.md` with `catalogWorkId` (Open Library work key); update `src/application/ports/book-catalog-lookup.ts`
- [ ] T286 Create unit tests for extended book item validation (`paused` status, tags, series, `pagesRead` ≥ 0 when set, loan fields, mood/pace) in `tests/unit/domain-item-book-library.test.ts`
- [ ] T287 Extend book zod schema and `FIELDS_BY_TYPE.book` in `src/domain/item.ts` per updated data-model.md (depends on T286)
- [ ] T288 Write Kysely migration `db/migrations/0008_book_library_fields.ts` (tags jsonb, series, work ids, pages_read, loaned_to, loaned_at, mood, pace)
- [ ] T289 Write Kysely migration `db/migrations/0009_book_quotes.ts` for `book_quotes` child table per book-quotes-sync.md
- [ ] T290 [P] Write Kysely migration `db/migrations/0010_user_reading_settings.ts` for private annual goal (calendar year + target count) per book-insights-ui.md
- [ ] T291 Regenerate and commit `src/adapters/postgres/db-types.ts` via `yarn run db:codegen` after T288–T290
- [ ] T292 [P] Create `BookQuote` domain type + zod in `src/domain/book-quote.ts` with unit tests in `tests/unit/domain-book-quote.test.ts`
- [ ] T293 Define `BookQuoteRepository` port in `src/application/ports/book-quote-repository.ts` per book-quotes-sync.md
- [ ] T294 Create unit tests for reading activity day rules (FR-D02: status change among book statuses, `pagesRead` update, transition to `read`) in `tests/unit/reading-activity.test.ts`
- [ ] T295 Implement `deriveReadingActivityDays` in `src/application/books/reading-activity.ts` (depends on T294)
- [ ] T296 [P] Add i18n keys for library, discovery, insights, quotes, pause, lending in `src/i18n/fr.json`

**Checkpoint**: Schema, contracts, and domain ready for user stories.

---

## Phase 10: User Story 5 — Tags and series (P1)

**Goal**: Free-form tags and optional series name + position; filter list by tag or series.

**Independent Test**: Assign tags and series on a book; filter list; only matching rows remain.

- [ ] T297 [US5] Create unit tests for tag/series list filtering in `tests/unit/book-library-filters.test.ts`
- [ ] T298 [US5] Implement `filterBooksByTagOrSeries` in `src/application/books/book-library-filters.ts` (depends on T297)
- [ ] T299 [P] [US5] Unit tests for IndexedDB/Postgres mapping of library fields in `tests/unit/book-library-repository-fields.test.ts`
- [ ] T300 [US5] Extend `src/adapters/indexeddb/item-repository.ts` and `src/adapters/postgres/server-item-repository.ts` for library columns (depends on T288, T299)
- [ ] T301 [US5] Tag chip editor + series fields on create/edit per `contracts/book-library-ui.md` in `src/components/fields/book-fields.tsx` and `src/components/items/ItemDetailForm.tsx`
- [ ] T302 [US5] Tag and series filter controls on `src/app/(app)/books/page.tsx` per book-library-ui.md (depends on T298, T301)
- [ ] T303 [US5] E2e assign tag/series and filter in `tests/e2e/books-tags-series.spec.ts`

---

## Phase 11: User Story 6 — Editions grouped by work (P1)

**Goal**: One item per edition; list/detail group by `catalogWorkId` or manual `workKey`.

**Independent Test**: Two ISBNs same work → two rows, grouped; manual link merges group.

- [ ] T304 [US6] Unit tests for `groupBooksByWork` (`catalogWorkId`, `workKey`, orphan editions) in `tests/unit/book-work-grouping.test.ts`
- [ ] T305 [US6] Implement `groupBooksByWork` in `src/application/books/work-grouping.ts` (depends on T304)
- [ ] T306 [US6] Map Open Library edition `works[0].key` to `catalogWorkId` in `src/adapters/open-library/book-catalog-lookup.ts` + extend `tests/unit/open-library-adapter.test.ts`
- [ ] T307 [US6] Persist `catalogWorkId` on catalog upsert in `src/application/books/upsert-from-catalog.ts` (depends on T285, T306)
- [ ] T308 [US6] Work-grouped list rows + edition stack on detail + manual `workKey` link UI per book-library-ui.md on `src/app/(app)/books/page.tsx` and `src/components/items/ItemDetailForm.tsx` (depends on T305, T307)
- [ ] T309 [US6] E2e second ISBN same work stays grouped in `tests/e2e/books-work-grouping.spec.ts`

---

## Phase 12: User Story 7 — En pause and lending (P1)

**Goal**: Status **En pause** (`paused`) with optional `pagesRead`; one active loan (`loanedTo`, optional `loanedAt`).

**Independent Test**: Set paused with pages; lend and clear loan; resume to `reading`/`read`.

- [ ] T310 [US7] Unit tests for `paused` status, `pagesRead`, and loan field rules (FR-B03, FR-B04) in `tests/unit/book-pause-lending.test.ts`
- [ ] T311 [US7] Extend `BookFields` / detail for `paused` + `pagesRead` per book-library-ui.md in `src/components/fields/book-fields.tsx` (depends on T287, T310)
- [ ] T312 [US7] Lending inputs + clear-loan action in `src/components/items/ItemDetailForm.tsx` per FR-B04 (depends on T311)
- [ ] T313 [US7] Emit reading-activity events on book status/`pagesRead` writes via `src/application/items.ts` for insights (depends on T295, T312)
- [ ] T314 [US7] E2e pause, pages read, lend/return in `tests/e2e/books-pause-lending.spec.ts`

---

## Phase 13: User Story 8 — Notes and quotes (P2)

**Goal**: Private notes (existing field) + synced quote child records per book.

**Independent Test**: Add/edit/delete quotes offline; sync; notes unchanged scope.

- [ ] T315 [US8] Unit tests for quote CRUD use cases in `tests/unit/book-quotes.test.ts`
- [ ] T316 [US8] Implement quote use cases in `src/application/books/book-quotes.ts` (depends on T293, T315)
- [ ] T317 [P] [US8] IndexedDB `BookQuoteRepository` in `src/adapters/indexeddb/book-quote-repository.ts`
- [ ] T318 [US8] Postgres `BookQuoteRepository` in `src/adapters/postgres/book-quote-repository.ts` (depends on T289, T317)
- [ ] T319 [US8] Wire quote push/pull API and client sync per `contracts/book-quotes-sync.md` (`src/app/api/sync/book-quotes/push/route.ts`, `pull/route.ts`, `src/application/sync/book-quotes-engine.ts`) (depends on T316, T318)
- [ ] T320 [US8] `BookQuotesSection` list/add/edit/delete on book detail per book-library-ui.md in `src/components/books/book-quotes-section.tsx` (depends on T319)
- [ ] T321 [US8] Two-user isolation integration tests for quotes in `tests/integration/book-quotes-isolation.test.ts`
- [ ] T322 [US8] E2e quote offline add then sync in `tests/e2e/books-quotes.spec.ts`

---

## Phase 14: User Story 9 — Mood, pace, and filters (P2)

**Goal**: Set mood/pace on books; filter browse by mood, pace, and tags.

**Independent Test**: Set mood on read book; discovery filter shows only matches.

- [ ] T323 [US9] Unit tests for mood/pace validation and combined filters in `tests/unit/book-discovery-filters.test.ts`
- [ ] T324 [US9] Implement `filterBooksByDiscovery` in `src/application/books/discovery-filters.ts` (depends on T323, T298)
- [ ] T325 [US9] Mood/pace pickers on book detail per `contracts/book-discovery-ui.md` in `src/components/books/book-discovery-fields.tsx`
- [ ] T326 [US9] Discovery browse sheet with mood/pace/tag filters on `src/app/(app)/books/page.tsx` per book-discovery-ui.md (depends on T324, T325)
- [ ] T327 [US9] E2e discovery filter by mood and tag in `tests/e2e/books-discovery-filters.spec.ts`

---

## Phase 15: User Story 10 — Private recommendations (P3)

**Goal**: Suggest books from the user’s own library patterns only (FR-C03).

**Independent Test**: Library with varied tags/mood → recommendations list; no external API.

- [ ] T328 [US10] Unit tests for `suggestBooks` scoring (tags, mood, status, no network) in `tests/unit/book-recommendations.test.ts`
- [ ] T329 [US10] Implement `suggestBooks` in `src/application/books/recommendations.ts` (depends on T328, T324)
- [ ] T330 [US10] Recommendations panel on books list per book-discovery-ui.md in `src/components/books/book-recommendations.tsx` (depends on T329)
- [ ] T331 [US10] E2e recommendations visible for seeded library in `tests/e2e/books-recommendations.spec.ts`

---

## Phase 16: User Story 11 — Goals, streaks, and heatmap (P2)

**Goal**: Annual books-finished goal; optional streak; activity heatmap from FR-D02 rules.

**Independent Test**: Mark book read; heatmap day lights up; goal progress increments.

- [ ] T332 [US11] Unit tests for streak and heatmap aggregation in `tests/unit/reading-insights.test.ts`
- [ ] T333 [US11] Implement `computeStreak` and `buildActivityHeatmap` in `src/application/books/reading-insights.ts` (depends on T295, T332)
- [ ] T334 [US11] `ReadingSettings` use case + repository for annual goal in `src/application/books/reading-settings.ts` and adapters (depends on T290)
- [ ] T335 [US11] Insights section: goal editor, streak, heatmap per `contracts/book-insights-ui.md` in `src/app/(app)/books/insights/page.tsx` (depends on T333, T334)
- [ ] T336 [US11] E2e activity day on status/`pagesRead` change in `tests/e2e/books-reading-heatmap.spec.ts`

---

## Phase 17: User Story 12 — Stats and year-in-review (P3)

**Goal**: Stats breakdowns and optional year-in-review recap (FR-D03).

**Independent Test**: Seed books across months/tags; stats and recap match fixtures.

- [ ] T337 [US12] Unit tests for monthly/tag/genre/author/pages aggregations in `tests/unit/book-stats.test.ts`
- [ ] T338 [US12] Implement `computeBookStats` and `buildYearInReview` in `src/application/books/book-stats.ts` (depends on T337)
- [ ] T339 [US12] Stats tables/charts + year-in-review view per book-insights-ui.md in `src/app/(app)/books/insights/page.tsx` (depends on T338, T335)
- [ ] T340 [US12] E2e stats page smoke in `tests/e2e/books-stats.spec.ts`

---

## Phase 18: Polish — Phases B–D

- [ ] T341 [P] Extend `specs/002-book-barcode-scan/quickstart.md` with Phase B–D manual validation steps
- [ ] T342 Local quality gate (no GitHub CI): `yarn typecheck`, `yarn test` / vitest; e2e when Docker stack available — fix regressions for US5–US12

---

## Dependencies

### Phase A (catalog — complete)

```text
Phase 1–2 → US1 → US2 → US3/US4 (parallel) → Polish → US1 extension (B11)
```

**Cross-feature (X1)**: Do not start 003 tasks until **T238** complete (or explicit scope sign-off).

### Phases B–D (T280+)

**Gate**: All **T280+** work may start after Phase A quality gate **T238** is complete.

```text
T238 (Phase A done)
  → Phase 9 Foundational (T280–T296)
  → US5 (T297–T303) ─┬→ US9 (T323–T327) → US10 (T328–T331)
  → US6 (T304–T309)  │
  → US7 (T310–T314) ─┴→ US11 (T332–T336) → US12 (T337–T340)
  → US8 (T315–T322) after T293 + migrations (can parallel US5–US7 after Phase 9)
  → Polish T341–T342
```

**Story notes**:

- **US5** before **US9**/**US10** (tag filters reused).
- **US7** before **US11** (activity events from pause/pages/status).
- **US6** independent of US5 after Phase 9 (needs `catalogWorkId` from T285–T307).
- **US8** needs Phase 9 quote port/migrations; sync can run parallel to US5–US7 once T319 unblocked.

## Parallel examples

### Phase A

- T216 + T220 + T212 after T210
- T232 + T233 after US1 UI wired

### Phases B–D

- T281 + T282 + T283 + T284 + T296 after T280
- T299 + T317 after T288
- T306 + T310 after T287
- T328 + T332 + T337 after Phase 9 (different files)
