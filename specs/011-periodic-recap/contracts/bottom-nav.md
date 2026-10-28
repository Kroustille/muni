# Contract: Bottom navigation — Récap entry

**Applies to**: `src/components/nav-config.ts`, `BottomNav.tsx`, `SidebarNav.tsx`, `fr.json`.

## Requirement (FR-010)

Primary access to **`/recap`** MUST be a dedicated **Récap** item in **bottom navigation** (mobile shell), consistent with 001 app shell patterns.

## Mobile bottom nav (`md:hidden`)

**Layout after change (OD-011-6)**:

| Order | Item | href | Icon (Lucide) |
|-------|------|------|----------------|
| 1 | Accueil | `/` | `Home` |
| 2 | Recherche | `/search` | `Search` |
| — | **+** quick add | (button) | `Plus` |
| 3 | **Récap** | `/recap` | `CalendarRange` or `Sparkles` (pick one in impl; document in PR) |
| 4 | Réglages | `/settings` | `Settings` |

Implementation note: today `PRIMARY_NAV` has 3 items split 2+1 around FAB; extend to **4 items** (2 before FAB, 2 after) without removing Settings.

**Active state**: `match` returns true when `pathname === '/recap'` or `pathname.startsWith('/recap/')`.

**Label**: i18n `recap.nav` → **Récap** (French).

## Desktop sidebar (`md:flex`)

Add **Récap** link in the **primary** block (with Accueil, Recherche, Réglages) — same href and label as bottom nav.

Do **not** bury Récap only under “Lists”.

## Accessibility

- `aria-current="page"` when on `/recap`.
- Bottom nav retains `aria-label={t("nav.bottom")}`.

## Testing

- Playwright: from `/lists/books`, tap bottom **Récap** → `/recap` loads offline (US3).
- Active styling on `/recap` tab.

## Non-goals

- Récap is **not** added to LIST_NAV (not a typed list).
- No badge count on tab in MVP (optional future).
