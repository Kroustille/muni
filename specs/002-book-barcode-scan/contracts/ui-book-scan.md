# Contract: Book scan and preview UI

## Entry points (mobile only)

- Books list: **Scanner** and **Rechercher par titre** (N3, B11).
- Book quick-add (type=book): **Scanner** and **Rechercher par titre** alongside manual fields (N3, B11).

Desktop: neither entry visible (B9).

## Scan modal

- Continuous scan until valid ISBN (B3).
- Shows live viewfinder; on ISBN → close scanner, start lookup loading state.
- Cancel returns without side effects.

## Catalog preview sheet

- Displays all imported fields; all editable (B6).
- Genres: multi-value editor (B7).
- Actions: **Enregistrer** (confirm), **Annuler**.
- On confirm: invoke `upsertFromCatalog` use case (dedupe/merge/restore).

## Lookup failure

- Toast or inline message; button **Ajouter manuellement** → manual form with ISBN prefilled (B10).

## Manual ISBN (mobile)

- Optional field **ISBN** + **Rechercher** triggers same preview flow without camera.
