# Contract: Music UI

## Navigation

- Home entries: **Artistes**, **Morceaux** (or grouped Music section).

## Lists (MU4)

- Each list: primary **Rechercher** (catalog) + standard list behaviors.
- **Artistes** and **Morceaux**: **Trier par** (Date or Note) + **Ordre** (Croissant or Décroissant).
- **Artistes** list rows: color-coded **1–5 note** control + badge (optional anytime).
- **Morceaux** list rows: status + note when `listened` (same gating as books/movies).
- Catalog search field: lookup **1 second after typing stops** (submit still immediate).
- No catalog on quick-add; list header **Ajouter** and bottom **+** on `/music/artists` or `/music/tracks` open the manual quick-add form for that music type (same as other typed lists).

## Preview

- All imported fields editable; optional URL fields; MBID stored on confirm.

## Track form (manual)

- Title, artist (required), album, year optional; artist autocomplete from artist items.

## Artist form (manual)

- Name (title) required only.
