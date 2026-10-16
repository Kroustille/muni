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

## Phase B — Library (smoke after T280+)

### Tags, paused, and pages read

1. Open an existing book → add tags `sf`, `favori`.
2. Set status **En pause**, set **Pages lues** to `120`, save.
3. Books list filter by tag `sf` → book appears; clear filter.
4. Change status to **En cours** → pages read retained.

### Quotes (offline-friendly)

1. While offline (devtools → offline), add citation text *« Il faut cultiver notre jardin. »* with page `42`.
2. Go online; wait for sync (or trigger sync).
3. Reload app on another session/device → citation still on book detail.

---

## Phase D — Insights (smoke after insights tasks)

### Goal and heatmap

1. Set **Objectif de lecture** for current year to `12`.
2. Mark two different books **Lu** today (or toggle status with sync).
3. Open **Activité de lecture** → today’s cell highlighted; goal shows `2 / 12` (or current finish count).
4. Optional: verify streak increments when yesterday also had activity (seed via changing `pagesRead` on another day in tests).
