# Tasks: Book barcode scan (002)

**Input**: Design documents from `/specs/002-book-barcode-scan/`

**Prerequisites**: Muni v1 (`001`) merged or available on `main`; plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Build order (X1)**: Complete **all tasks in this file** before starting feature **003** (`specs/003-movie-imdb-search/tasks.md`). Feature **004** follows **003**.

**Architecture**: Hexagonal — domain extensions, `BookCatalogLookup` and `BarcodeScanner` ports, Open Library adapter, route handler, mobile UI driving adapters. TDD per constitution.

**Tests**: Write tests before implementation in each story unless noted [P] parallel file.

**Task IDs**: **T201–T2xx** (reserved band for feature 002).

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
- [ ] T222 [US1] Build `CatalogPreview` component in `src/components/books/catalog-preview.tsx` per contracts/ui-book-scan.md (depends on T202)
- [ ] T223 [US1] Build `ScanModal` in `src/components/books/scan-modal.tsx` continuous scan UX (depends on T221, T222)
- [ ] T224 [US1] Wire scan + lookup + preview into books list page `src/app/(app)/books/page.tsx` (mobile only) (depends on T219, T223)
- [ ] T225 [US1] Wire scan entry into book quick-add flow in `src/components/quick-add/` (mobile only, N3) (depends on T224)
- [ ] T226 [US1] Extend IndexedDB item repository mapping for new book fields in `src/adapters/indexeddb/item-repository.ts` (depends on T205)
- [ ] T227 [US1] Extend Postgres item repository for new columns in `src/adapters/postgres/server-item-repository.ts` (depends on T207, T209)

---

## Phase 4: User Story 2 — Dedupe, merge, restore (P1)

**Goal**: Silent ISBN upsert, manual merge, soft-delete restore (B4, B5, L1).

**Independent Test**: quickstart.md dedupe and soft-delete sections.

- [ ] T228 [US2] Create unit tests for `upsertBookFromCatalog` (duplicate ISBN update, restore deleted, manual merge title+author) in `tests/unit/upsert-book-from-catalog.test.ts`
- [ ] T229 [US2] Implement `upsertBookFromCatalog` in `src/application/books/upsert-from-catalog.ts` per research.md merge rules (depends on T228, T215)
- [ ] T230 [US2] Connect preview confirm to `upsertBookFromCatalog` in `src/components/books/catalog-preview.tsx` (depends on T229, T222)

---

## Phase 5: User Story 3 — Lookup failure & desktop boundary (P2)

- [ ] T231 [US3] Implement lookup failure → manual add with ISBN prefilled in scan/preview flow (depends on T224, B10)
- [ ] T232 [US3] Add e2e test desktop has no scan control in `tests/e2e/books-desktop.spec.ts`
- [ ] T233 [US3] Add e2e test lookup failure path with mocked API in `tests/e2e/books-lookup-failure.spec.ts`

---

## Phase 6: User Story 4 — Manual ISBN on mobile (P2)

- [ ] T234 [US4] Add manual ISBN field + lookup trigger on mobile book add UI per contracts/ui-book-scan.md
- [ ] T235 [US4] Unit test manual ISBN path reuses preview in `tests/unit/books-manual-isbn.test.ts`

---

## Phase 7: Polish

- [x] T236 [P] Show `pageCount` on book detail when present (N1) in book detail component
- [ ] T237 Update `specs/002-book-barcode-scan/quickstart.md` with any command fixes after implementation
- [ ] T238 Run full CI (`typecheck`, `test:coverage`, `test:e2e` book scenarios) and fix regressions

---

## Dependencies

```text
Phase 1–2 → US1 → US2 → US3/US4 (parallel) → Polish
```

**Cross-feature (X1)**: Do not start 003 tasks until T238 complete (or explicit scope sign-off).

## Parallel examples

- T216 + T220 + T212 after T210
- T232 + T233 after US1 UI wired
