# Quickstart: Books feature 002

**Prerequisites**: Muni v1 running locally (`001` quickstart). Phase **A** shipped on `main`. Phases **B–D** validated after **T280+** implementation per `tasks.md`.

**X1**: Complete 002 B–D (or agreed scope) before starting movie feature 003.

## Phase A — Catalog (shipped)

### Validate server lookup

1. Sign in; ensure network available.
2. `yarn db:up && yarn migrate:up` before first lookup if Postgres is fresh.
3. `curl -b cookies.txt "http://localhost:3000/api/books/lookup?isbn=9782070368228"` (session cookie from browser) → JSON hit with French/English title fields; after Phase B implementation, optional `workId` present.
4. Repeat within TTL → same payload served from cache (check logs).

### Validate mobile scan (manual / mocked)

1. Open books list on mobile viewport or device.
2. Tap **Scanner** → camera permission → point at ISBN barcode (or use dev hook to inject `9782070368228`).
3. Preview shows title, author, synopsis, genres; edit one field; save.
4. List shows one book; scan same ISBN again → same row updated, no duplicate.

### Validate desktop boundary

1. Desktop width: books list has no scan button; quick-add book has no scan or ISBN lookup controls.

### Validate lookup failure

1. Mock Open Library 404 for unknown ISBN → manual form with ISBN prefilled; save with title only.

### Validate soft-delete restore

1. Delete book with ISBN; scan same ISBN → book restored with refreshed metadata.

---

## Phase B — Library (manual after T280+)

### Tags, series, and list filters

1. Open an existing book → add tags `sf`, `favori`.
2. Set **Série** to `Dune`, **Tome** to `1`, save.
3. On `/books`, filter by tag `sf` → book appears; clear filter.
4. Filter by **Série** `Dune` → same book; clear filter.

### En pause and pages read

1. Set status **En pause**, set **Pages lues** to `120`, save.
2. Books list still shows the book; reopen detail → pages read unchanged.
3. Set status **En cours** → pages read retained.

### Lending

1. In **Prêt**, set **Prêté à** to `Marie`, optional **Depuis le** to today, save.
2. Reopen detail → loan fields present.
3. **Marquer comme rendu** → **Prêté à** and date cleared.

### Editions grouped by work

1. Add or scan a second book with a different ISBN but same Open Library work (or two items that share `catalogWorkId` after lookup).
2. List shows grouped editions (stack or cluster per `groupBooksByWork`).
3. On one edition, open **Autres éditions** → sibling visible; tap opens sibling detail.
4. Optional: **Lier à une édition…** on an orphan book → pick sibling → both share a work group; **Dissocier** on one edition leaves the other grouped.

### Private notes

1. Add text in **Notes privées**; save and reload → notes unchanged and not shown on list rows.

### Quotes (offline-friendly)

1. While offline (devtools → offline), add citation *« Il faut cultiver notre jardin. »* with page `42`.
2. Go online; wait for sync (or trigger sync).
3. Reload app on another session/device → citation still on book detail; edit or delete one quote and sync again.

---

## Phase C — Discovery (manual after US9–US10)

### Mood and pace on detail

1. On a **Lu** book, set **Ambiance** and **Rythme** from the dropdowns; save.
2. Clear one field → saves as empty (null).

### Discovery filters (books list)

1. On `/books`, open **Filtres découverte**.
2. Select the same **Ambiance** / **Rythme** and a tag used on another book → only matching rows remain.
3. Clear discovery filters → full library list returns (status filters still apply if set).

### Private recommendations

1. Seed at least three **À lire** / **En cours** books with overlapping tags or mood with your **Lu** books.
2. On `/books`, section **Pour vous** lists up to five library titles (no external API).
3. Tap a suggestion → opens that book’s detail.

---

## Phase D — Insights (manual after US11–US12)

Navigate to `/books/insights` (or the insights entry on the books tab if linked).

### Reading goal, heatmap, and streak

1. Set **Objectif de lecture** for the current year to `12`.
2. Mark two different books **Lu** today (or toggle status with sync).
3. **Activité de lecture** → today’s cell highlighted; goal shows progress such as `2 / 12`.
4. If yesterday also had qualifying activity, **Série actuelle : N jours** shows `N ≥ 1`.

### Stats breakdowns

1. With several **Lu** books across months/tags/genres, open **Statistiques** sections (by month, genres, tags, authors, pages).
2. Totals match your library (rough spot-check against list filters).

### Year in review

1. For a past calendar year with finished books, open **Bilan {year}**.
2. Summary cards show books read, pages, and top tags/genres consistent with that year’s **Lu** items.

---

## Automated checks (local)

After manual smoke above:

```bash
yarn typecheck
yarn vitest run tests/unit
```

When Docker stack is up (`yarn db:up` per `001` quickstart):

```bash
yarn test:e2e tests/e2e/books-*.spec.ts
```
