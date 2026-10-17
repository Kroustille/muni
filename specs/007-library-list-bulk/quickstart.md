# Quickstart: Library list UX, bulk, catalog multi-add (007)

**Prerequisites**: Muni **001–005** (and **006** recommended). Seed data: ≥10 books with distinct authors, ≥10 movies with directors, music artists/tracks, shopping/recipes.

## List-local search (US1)

1. Open `/books`; type partial **author** not in title → only matching books visible.
2. Open `/movies`; search **director** substring.
3. Open `/music/tracks`; search **artist** or title.
4. Open `/music/artists`; search artist **name**.
5. Disable network; repeat on books — still filters (offline).

## Sort UI (US2)

1. On books list: open sort **select** → choose **Note**; click direction control → order toggles asc/desc with French `aria-label`.
2. On `/shopping`: sort select shows **date** only (no rating).

## Row delete + undo (US3)

1. On recipes list, delete from row action (not detail).
2. Tap **Annuler la suppression** within 5s → item returns.

## Bulk delete (US4)

1. Enter selection mode; pick 3 shopping items; delete.
2. Single undo restores all 3.

## Bulk series (US5)

1. Books list: select 2 books without series.
2. Assign série via combobox → create **Test Saga**; order **1**.
3. Both rows show série and position 1.

## Bulk saga (US6)

1. Movies list: select 2 films; **Saga** → new name; order **2**.
2. Both share `franchiseName` and same franchise id (inspect detail or devtools).

## Global search (US7)

1. Book with author "Dupont" not in title → `/search` for "Dupont" finds book.
2. Movie by director-only query finds movie.

## Catalog multi-add (US8)

1. Books catalog search: select 3 results; add batch → all `to_read` (or merged if duplicate ISBN).
2. Movies catalog: same with `to_watch`.
3. Simulate one failure if possible → French partial success message.

## Quality gate

`yarn typecheck`, `yarn test`, `yarn build`; e2e `tests/e2e/library-list-bulk*.spec.ts` when added per tasks.md.
