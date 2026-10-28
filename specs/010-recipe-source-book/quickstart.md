# Quickstart: Recipe source book / cookbook (010)

**Prerequisites**: Muni **001** on `main`; migration **0015** applied; `yarn db:up` for integration tests.

## Foundation smoke

1. Fresh login → add recipe **title only** → detail shows **no** Ouvrage source block.
2. DevTools → Application → IndexedDB: `cookbooks` store exists (may be empty).

## P1 — Combobox capture (US1–US2)

1. Add recipe → expand **Ouvrage source** → type new cookbook **Grand Livre de Cuisine** → **Créer** → page **42** → save.
2. Go offline → reopen detail → title, page, section visible.
3. Add second recipe → combobox search **grand** → pick same cookbook → page **100** → save.
4. Edit first recipe → set cookbook **Auteur** → save → both recipe details show author after reload.

## P1 — Edit & clear (US3)

1. Edit recipe → change page only → save → detail updates.
2. Clear combobox selection → save → section hidden; page not stored (verify IndexedDB item row).

## P1 — Detail (US4)

1. Recipe with author + ISBN on cookbook → detail order: title, author, page, ISBN.
2. Recipe without cookbook → no source section.

## P1 — Sync (US5)

1. Device A offline: create cookbook + recipe with source → sync when online.
2. Device B pull → open recipe → same cookbook fields and page.
3. Device B edit cookbook author → sync → Device A detail shows new author.
4. Concurrent: A changes page, B changes cookbook on same recipe → after sync, per-field LWW (latest timestamp wins per field).

## P2 — Search (US6)

1. Three recipes; two share cookbook **Desserts faciles**.
2. Global search **dessert** → two recipes returned.

## Quality gate

- `yarn typecheck`
- `tests/unit/cookbook/*`, `tests/integration/cookbook-sync.test.ts`
- `tests/e2e/recipe-source.spec.ts`
- `yarn verify:ci` before push to `main`
