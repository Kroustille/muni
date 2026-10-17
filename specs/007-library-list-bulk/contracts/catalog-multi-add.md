# Contract: Catalog multi-add (books & movies)

**Components**: `BookCatalogFlow`, `MovieCatalogFlow`, title flows if applicable.

## UI

- Each catalog search result row: checkbox for multi-select.
- Primary action: **Ajouter N à la bibliothèque** (French; N = selected count).
- Disabled when N = 0 or while batch running.

## Behavior

- Sequential upsert per selected result using existing `upsertBookFromCatalog` / `upsertMovieFromCatalog`.
- **Same default status** for every item in batch: `to_read` (books), `to_watch` (movies).
- Dedupe: duplicate ISBN/imdb within batch or library → merge per 002/003 rules; no duplicate active rows.
- Partial failure: show which items failed (French); successful items remain saved.

## Offline

- When catalog search disabled offline, multi-add unavailable (unchanged catalog offline rules).

## Non-goals

- Per-item status picker in batch.
- Parallel unbounded API calls.
