# Contract: Book scan and preview UI

## Entry points

- Books list: **Rechercher par titre** on all devices (B11); **Scanner** on mobile only (N3, B9).
- Book quick-add (type=book): **Rechercher par titre** on all devices; **Scanner** on mobile only alongside manual fields.

Desktop: no scan and no manual ISBN lookup field (B9); title catalog search matches movies list behavior.

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

## Title catalog search (B11)

- Search sheet: typing triggers catalog lookup **1 second after the user stops typing**; submit button still runs search immediately.
