# Research: Library list UX, bulk, catalog multi-add (007)

## 1. List-local search matching

- **Decision**: Implement `filterItemsForListLocalSearch` in `src/domain/list-local-search.ts` using existing `normalizeText` (case- and accent-insensitive substring, same as global search).
- **Rationale**: FR-002–FR-007; single pure function testable per type.
- **Alternatives**: Inline filters in each page (rejected — six copies); server FTS (rejected — FR-029).

## 2. Per-type searchable fields (V1)

| Item type | Fields |
|-----------|--------|
| `book` | `title`, `author` |
| `movie` | `title`, `director` |
| `music_track` | `title`, `artist` |
| `music_artist` | `title` (artist name row label) |
| `shopping`, `recipe` | `title` |

- **Rationale**: Locked roadmap + spec clarifications.
- **Alternatives**: Tags/franchise in list search (deferred — spec out of scope).

## 3. Sort UI pattern

- **Decision**: Replace chip groups in `ListSortFilter` with `<select>` for field + one button toggling `asc`/`desc` (icon + `aria-label` from i18n).
- **Rationale**: FR-008–FR-010; domain `ListSort` unchanged.
- **Alternatives**: Keep chips (rejected — spec).

## 4. Delete and undo

- **Decision**: Reuse `deleteItem` / `restoreItem` from item use cases; extend `UndoDeleteProvider` to hold `pendingIds: string[]` for bulk with **one** toast restoring all ids in batch.
- **Rationale**: FR-011–FR-012; matches existing `UNDO_MS = 5000`.
- **Alternatives**: Confirm dialog (rejected — spec); separate undo per row (rejected).

## 5. Selection mode

- **Decision**: Checkbox column + sticky `ListSelectionBar` with actions (delete; assign series/saga when type allows). Long-press optional enhancement — checkbox sufficient for V1 desktop/mobile.
- **Rationale**: FR-013–FR-014.
- **Alternatives**: Swipe-only bulk (rejected — poor desktop parity).

## 6. Series / saga combobox

- **Decision**: Shared `GroupCombobox` fed by `collectLibrarySeriesNames(books)` or `collectLibraryFranchiseNames(movies)`; “create new” sets free-text name; on confirm for movies generate `franchiseId` via `crypto.randomUUID()` shared across batch.
- **Rationale**: FR-015–FR-020; overwrite existing group fields on assign (spec edge case).
- **Alternatives**: Franchise entity table (rejected — V2 roadmap).

## 7. Bulk order field

- **Decision**: Single required integer `seriesPosition` / `franchiseOrder` applied to **every** selected item in the batch.
- **Rationale**: Spec US5/US6 clarification.
- **Alternatives**: Per-row order grid (deferred).

## 8. Global search extension

- **Decision**: Extend `createSearchUseCase` index entries with `normalizedAuthor` / `normalizedDirector` (nullable); match if query substring hits title **or** those fields.
- **Rationale**: FR-022–FR-024; offline local index.
- **Alternatives**: Separate search endpoints (rejected).

## 9. Catalog multi-add

- **Decision**: Checkbox on catalog result rows; “Ajouter N …” runs sequential `upsertBookFromCatalog` / `upsertMovieFromCatalog` with shared default status; surface partial errors in French toast/summary.
- **Rationale**: FR-025–FR-028.
- **Alternatives**: Parallel unbounded fetch (rejected — rate limits / UX).

## 10. Music list parity

- **Decision**: Apply same search + sort UI + delete/bulk to `MusicListPage` (`music_artist`, `music_track` routes); no saga/series actions.
- **Rationale**: FR-001, FR-021.
- **Alternatives**: Defer music (rejected — locked).

## 11. Sequencing with 006

- **Decision**: Implement on branch rebased onto **006** when available.
- **Rationale**: Roadmap; reduces Next upgrade + UI merge conflicts.
- **Alternatives**: Implement on Next 15 (acceptable short-term if 006 delayed).
