# Contract: Movie catalog search UI

## Entry (N4)

- Movies list: **Rechercher dans le catalogue**
- Movie quick-add: same search entry

## Search sheet

- Text field + submit; catalog lookup runs **1 second after typing stops** (submit still immediate); loading state; result list (title, year, kind film/série, catalog rating if any).
- Tap row → load detail → preview sheet (all fields editable, M8).
- When search returns no film/série hits, show **Ajouter manuellement** — quick-add prefills the title field; list page opens editable preview (title-only OK, FR-CAT02).

## Preview

- Fields: title, synopsis, year, catalog rating (read-only label), media kind.
- Save → `upsertMovieFromCatalog`.

## Personal rating

- Shown only when status `watched`; independent of catalog rating (M4).
