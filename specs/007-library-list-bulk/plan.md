# Implementation Plan: Library list UX, search, bulk, catalog multi-add

**Branch**: `007-library-list-bulk` (work on `main`) | **Date**: 2026-10-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-library-list-bulk/spec.md`

**Depends on**: **001–005**; **recommended after** [006-nextjs-16](../006-nextjs-16/plan.md) lands on `main`.

**Task band**: **T701–T7xx** (see [tasks.md](tasks.md)).

**Product context**: Locked decisions in spec clarifications and `/cursor/stores/self/docs/library-ux-roadmap-2026-10-17.md`.

## Summary

Deliver homogeneous **list page** behavior on **six** routes: shopping, books, movies, recipes, music artists, music tracks — **client-side list-local search**, **select + toggle** sort UI, **row delete** and **bulk delete** with shared **undo** semantics, **bulk series/saga** assignment (books/movies only), extended **global search** (author/director), and **catalog multi-add** for books and movies. French UI; offline-first; no Postgres full-text (FR-029).

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥22, Next.js 16+ (post-006) or 15.5 if 006 not merged yet

**Primary Dependencies**: Existing hexagonal stack; reuse `normalizeText` (`src/domain/text.ts`), `list-sort` domain, `createSearchUseCase` (`src/application/search.ts`), catalog flows (`BookCatalogFlow`, `MovieCatalogFlow`), `UndoDeleteProvider` (`src/components/UndoToast.tsx`)

**Storage**: No new tables V1 — bulk writes patch existing **Item** jsonb columns (`seriesName`, `seriesPosition`, `franchiseId`, `franchiseName`, `franchiseOrder`); global search index remains in-memory client side

**Testing**: Vitest for domain filters, search index, bulk use cases; Playwright e2e per [quickstart.md](quickstart.md); constitution ≥80% logic coverage

**Target Platform**: PWA mobile-first + desktop list/detail split

**Constraints**: Soft delete only (FR-011–FR-012); batch undo one toast; combobox derived from `collectLibrarySeriesNames` / `collectLibraryFranchiseNames`; music lists get search/sort/delete/bulk delete only (FR-021)

**Scale/Scope**: Six list surfaces + `/search` + two catalog flows; hundreds of items per type client-filtered

## Constitution Check

*GATE: Pass before Phase 0. Re-check after Phase 1.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-first | Pass | List search and bulk are client-side on loaded items |
| II. Capture speed | Pass | No extra required fields on quick-add |
| III. Typed lists | Pass | Per-type search fields per FR-003–FR-007 |
| IV. Simplicity | Pass | Reuse single-item delete/restore; LWW patches for bulk |
| V. Privacy | Pass | No analytics |
| VI. Portable backend | Pass | Bulk = standard item patches through existing sync |
| VII. Hexagonal | Pass | New use cases in `application/`; UI in `components/` |

**Post-design**: Bulk undo batching is UI/application concern only — no constitution violation.

## Project Structure

### Documentation (this feature)

```text
specs/007-library-list-bulk/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── list-local-search.md
│   ├── list-sort-ui.md
│   ├── list-selection-bulk.md
│   ├── global-search-extension.md
│   └── catalog-multi-add.md
└── tasks.md
```

### Source Code (touch map)

```text
src/domain/
  list-sort.ts                    # unchanged fields; UI only
  list-local-search.ts            # NEW — per-type match rules
  text.ts                         # normalizeText (existing)
src/application/
  search.ts                       # extend index: author, director
  items.ts                        # optional bulk helpers
  books/assign-series-bulk.ts     # NEW
  movies/assign-franchise-bulk.ts # NEW
src/components/
  ListSortFilter.tsx              # select + toggle
  lists/list-page-content.tsx     # search + selection bar
  music/music-list-page.tsx       # parity with ListPageContent
  UndoToast.tsx                   # batch undo extension
  lists/ListSelectionBar.tsx      # NEW
  fields/GroupCombobox.tsx        # NEW shared series/saga
src/components/books/book-catalog-flow.tsx
src/components/movies/movie-catalog-flow.tsx
tests/unit/                       # filters, search, bulk use cases
tests/e2e/                        # list search, bulk, catalog multi-add
src/i18n/fr.json
```

**Structure Decision**: Prefer **shared list mechanics** in `list-page-content.tsx` and `music-list-page.tsx` (or thin shared hook) rather than six divergent implementations.

## Phased implementation outline (recommended ship order)

Aligned with roadmap: **search + sort (US1–US2)** → **delete (US3–US4)** → **bulk series/saga (US5–US6)** → **global search (US7)** → **catalog multi-add (US8)**.

1. **Domain**: `filterItemsForListLocalSearch(type, items, query)` with field matrix from spec.
2. **UI**: `ListSearchField`, refactor `ListSortFilter` to select + direction button.
3. **Delete**: Wire `DeleteWithUndoButton` on rows; extend undo provider for `string[]` batch.
4. **Selection**: Checkbox column + `ListSelectionBar` actions.
5. **Bulk assign**: Combobox + validation (order required); application use cases patching items.
6. **Global search**: Extend `createSearchUseCase` indexed fields.
7. **Catalog**: Multi-select on catalog result list + sequential upsert with progress/errors.

## Open decisions (defaults in research.md)

| ID | Topic | Default |
|----|--------|---------|
| OD-007-1 | Sort persistence | Keep existing per-route behavior (URL query or state) when replacing chips |
| OD-007-2 | Selection + filter | Bulk actions only on selected row ids; clear selection on route change |
| OD-007-3 | Bulk order | Single numeric order applied to **all** selected items (spec US5/US6) |
| OD-007-4 | New franchiseId | `crypto.randomUUID()` once per new saga batch |
| OD-007-5 | Undo window | Same `UNDO_MS` (5000) as single delete unless bulk UX testing says otherwise |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Batch undo state | FR-012 | N separate toasts breaks UX |
| In-memory search index extension | FR-022–FR-024 | Server FTS explicitly out of scope |

## Artifacts

| Artifact | Path |
|----------|------|
| Research | [research.md](research.md) |
| Data model | [data-model.md](data-model.md) |
| Quickstart | [quickstart.md](quickstart.md) |
| Contracts | [contracts/](contracts/) |
