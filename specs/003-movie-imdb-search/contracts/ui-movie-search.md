# Contract: Movie catalog search UI

## Entry (N4)

- Movies list: **Rechercher dans le catalogue**
- Movie quick-add: same search entry

## Search sheet

- Text field + submit; loading state; result list (title, year, kind film/série, catalog rating if any).
- Tap row → load detail → preview sheet (all fields editable, M8).

## Preview

- Fields: title, synopsis, year, catalog rating (read-only label), media kind.
- Save → `upsertMovieFromCatalog`.

## Personal rating

- Shown only when status `watched`; independent of catalog rating (M4).
