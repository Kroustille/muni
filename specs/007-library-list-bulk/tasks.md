# Tasks: Library list UX, search, bulk, catalog multi-add (007)

**Input**: `/specs/007-library-list-bulk/`

**Prerequisites**: Features **001–005**; [006-nextjs-16](../006-nextjs-16/tasks.md) recommended complete. Design docs: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

**Task IDs**: **T701–T758** (feature 007 band).

---

## Phase 1: Setup

- [ ] T701 [P] Add i18n keys for list search, sort select/toggle, selection bar, bulk actions, catalog multi-add in `src/i18n/fr.json`

---

## Phase 2: Foundational

**Purpose**: Shared domain and undo infrastructure before list UI stories.

- [ ] T702 Unit tests for `filterItemsForListLocalSearch` per type in `tests/unit/list-local-search.test.ts`
- [ ] T703 Implement `src/domain/list-local-search.ts` per [contracts/list-local-search.md](contracts/list-local-search.md) (depends on T702)
- [ ] T704 Unit tests for batch undo state transitions in `tests/unit/undo-delete-batch.test.ts`
- [ ] T705 Extend `src/components/UndoToast.tsx` with `deleteManyWithUndo(ids: string[])` and batch restore (depends on T704)
- [ ] T706 [P] Create `src/components/lists/ListSearchField.tsx` (controlled query input)
- [ ] T707 [P] Create `src/components/lists/ListSelectionBar.tsx` shell (props for actions; wired later)

**Checkpoint**: Domain search tests green; undo provider supports batch API.

---

## Phase 3: User Story 1 — List-local search (P1)

**Goal**: Search field on all six list types (FR-001–FR-007).

**Independent Test**: [quickstart.md](quickstart.md) § List-local search.

- [ ] T708 [US1] Wire `ListSearchField` + `filterItemsForListLocalSearch` into `src/components/lists/list-page-content.tsx`
- [ ] T709 [US1] Wire same search into `src/components/music/music-list-page.tsx` for artists and tracks
- [ ] T710 [US1] French empty state when search has no matches in `src/components/lists/ListEmptyState.tsx` or list pages
- [ ] T711 [US1] E2e smoke list-local search in `tests/e2e/library-list-local-search.spec.ts`

**Checkpoint**: US1 independently testable on all six routes.

---

## Phase 4: User Story 2 — Sort select + toggle (P1)

**Goal**: Replace sort chips with select + direction button (FR-008–FR-010).

**Independent Test**: [quickstart.md](quickstart.md) § Sort UI.

- [ ] T712 [US2] Refactor `src/components/ListSortFilter.tsx` per [contracts/list-sort-ui.md](contracts/list-sort-ui.md)
- [ ] T713 [US2] Verify sort persistence unchanged on books/movies/shopping/recipes list pages using `list-page-content.tsx`
- [ ] T714 [US2] Verify sort on `src/components/music/music-list-page.tsx`
- [ ] T715 [P] [US2] Unit or component test for `ListSortFilter` direction toggle `aria-label` in `tests/unit/list-sort-filter.test.tsx`

**Checkpoint**: US2 complete without regressing `src/domain/list-sort.ts`.

---

## Phase 5: User Story 3 — Delete from list row (P1)

**Goal**: Row delete with undo (FR-011).

**Independent Test**: [quickstart.md](quickstart.md) § Row delete.

- [ ] T716 [US3] Add `DeleteWithUndoButton` to shopping/recipe rows in `src/components/lists/list-page-content.tsx`
- [ ] T717 [US3] Add row delete to `BookMovieRow` / music rows as needed in `src/components/rows/`
- [ ] T718 [US3] E2e row delete + undo in `tests/e2e/library-row-delete.spec.ts`

---

## Phase 6: User Story 4 — Multi-select and bulk delete (P1)

**Goal**: Selection mode and batch undo (FR-012–FR-014).

**Independent Test**: [quickstart.md](quickstart.md) § Bulk delete.

- [ ] T719 [US4] Add selection mode toggle and row checkboxes in `src/components/lists/list-page-content.tsx`
- [ ] T720 [US4] Add selection mode to `src/components/music/music-list-page.tsx`
- [ ] T721 [US4] Wire bulk delete action on `ListSelectionBar` using `deleteManyWithUndo` per [contracts/list-selection-bulk.md](contracts/list-selection-bulk.md)
- [ ] T722 [US4] E2e bulk delete 3 items + single undo in `tests/e2e/library-bulk-delete.spec.ts`

---

## Phase 7: User Story 5 — Bulk assign book series (P1)

**Goal**: Combobox + required order (FR-015–FR-017).

**Independent Test**: [quickstart.md](quickstart.md) § Bulk series.

- [ ] T723 [US5] Unit tests `assignBooksToSeries` in `tests/unit/assign-books-series-bulk.test.ts`
- [ ] T724 [US5] Implement `src/application/books/assign-series-bulk.ts` (patches `seriesName`, `seriesPosition` on each id)
- [ ] T725 [P] [US5] Implement `src/components/fields/GroupCombobox.tsx` using `collectLibrarySeriesNames` from `src/application/books/book-library-filters.ts`
- [ ] T726 [US5] Bulk série sheet on books list + validation (order required) in `src/components/lists/list-page-content.tsx`
- [ ] T727 [US5] E2e bulk series assign in `tests/e2e/library-bulk-series.spec.ts`

---

## Phase 8: User Story 6 — Bulk assign movie saga (P1)

**Goal**: Franchise combobox + shared `franchiseId` (FR-018–FR-020).

**Independent Test**: [quickstart.md](quickstart.md) § Bulk saga.

- [ ] T728 [US6] Unit tests `assignMoviesToFranchise` in `tests/unit/assign-movies-franchise-bulk.test.ts`
- [ ] T729 [US6] Implement `src/application/movies/assign-franchise-bulk.ts` (new saga → `crypto.randomUUID()` for `franchiseId`)
- [ ] T730 [US6] Reuse `GroupCombobox` with `collectLibraryFranchiseNames` from `src/application/movies/movie-library-filters.ts`
- [ ] T731 [US6] Bulk Saga action on movies list in `src/components/lists/list-page-content.tsx`
- [ ] T732 [US6] E2e bulk saga in `tests/e2e/library-bulk-saga.spec.ts`

---

## Phase 9: User Story 7 — Global search author/director (P2)

**Goal**: Extend local search index (FR-022–FR-024).

**Independent Test**: [quickstart.md](quickstart.md) § Global search.

- [ ] T733 [US7] Unit tests extended `createSearchUseCase` in `tests/unit/search-use-case.test.ts`
- [ ] T734 [US7] Implement author/director indexing in `src/application/search.ts` per [contracts/global-search-extension.md](contracts/global-search-extension.md)
- [ ] T735 [US7] E2e global search author/director in `tests/e2e/global-search-metadata.spec.ts`

---

## Phase 10: User Story 8 — Catalog multi-add (P2)

**Goal**: Multi-select catalog results (FR-025–FR-028).

**Independent Test**: [quickstart.md](quickstart.md) § Catalog multi-add.

- [ ] T736 [US8] Unit tests batch catalog add orchestration in `tests/unit/catalog-multi-add.test.ts`
- [ ] T737 [US8] Multi-select UI + batch action in `src/components/books/book-catalog-flow.tsx` per [contracts/catalog-multi-add.md](contracts/catalog-multi-add.md)
- [ ] T738 [US8] Multi-select UI + batch action in `src/components/movies/movie-catalog-flow.tsx`
- [ ] T739 [US8] French partial-failure messaging for batch add in catalog flows
- [ ] T740 [US8] E2e catalog multi-add books in `tests/e2e/catalog-multi-add-books.spec.ts`
- [ ] T741 [US8] E2e catalog multi-add movies in `tests/e2e/catalog-multi-add-movies.spec.ts`

---

## Phase 11: Polish & cross-cutting

- [ ] T742 Run [quickstart.md](quickstart.md) manual checklist; fix gaps
- [ ] T743 [P] Update `specs/007-library-list-bulk/quickstart.md` if flows differ from implementation
- [ ] T744 Quality gate: `yarn typecheck`, `yarn test`, `yarn build`
- [ ] T745 Verify no regression to offline/sync tests from **001** (`tests/` isolation/offline suites)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1–2** block all user stories
- **US1–US2** can proceed in parallel after Phase 2
- **US3** depends on T705 (undo)
- **US4** depends on US3 row delete patterns + T705
- **US5–US6** depend on US4 selection bar
- **US7** independent after Phase 2 (can parallel US1–US6)
- **US8** independent of list bulk but after catalog flows stable
- **Polish** after desired stories complete

### User Story Dependencies

| Story | Depends on |
|-------|------------|
| US1 | Phase 2 (T703, T706) |
| US2 | Phase 1 (i18n) |
| US3 | T705 |
| US4 | US3, T707 |
| US5 | US4, T724–T725 |
| US6 | US4, T729–T730 |
| US7 | Phase 2 |
| US8 | Phase 1 |

### Parallel Opportunities

- T701, T706, T707 in parallel after T702 starts
- US7 (T733–T735) parallel to US1–US6 once Phase 2 done
- T740 and T741 in parallel

---

## Parallel Example: After Phase 2

```text
Developer A: T708–T711 (US1 search)
Developer B: T712–T715 (US2 sort)
Developer C: T733–T735 (US7 global search)
```

---

## Implementation Strategy

### MVP (minimum shippable increment)

1. Phase 1–2 + **US1** + **US2** (visible wins on all lists)
2. **US3** row delete
3. **US4** bulk delete
4. **US5–US6** series/saga
5. **US7–US8** P2

### Suggested merge slices

- PR1: US1 + US2
- PR2: US3 + US4
- PR3: US5 + US6
- PR4: US7 + US8

---

## Notes

- Task descriptions MUST keep file paths accurate if files are split during implementation.
- Follow Conventional Commits; French UI only.
- Do not add Postgres FTS or trash UI (FR-029–FR-030).
