# Quickstart: Activity suggestions (014)

**Prerequisites**: Muni **001** on `main`; domain seed data (minimum: books + recipes). For full matrix, enable **008**, **012**, **013** as implemented. Recipe staleness best with **011** **`cookedDates`** ([recipe-cooked-dates](../../011-periodic-recap/contracts/recipe-cooked-dates.md)).

## Foundation smoke

1. Login → **Accueil** `/` loads without errors when suggestion stores empty.
2. DevTools → IndexedDB: `activity_suggestion_snapshot` store exists after first compute visit.

## P1 — Two ideas on Accueil (US1)

1. Seed book **`to_read`** with status touch **60+ days** ago and recipe with no **`cookedDates`** **45+ days** since create.
2. Set system date to new local day (or test harness `calendarDay`).
3. Open **Accueil** first time today → **exactly two** rows with French titles.
4. Leave Accueil → return same day → **same two** titles (snapshot stable).
5. Enable airplane mode → repeat step 4 → unchanged.

## P1 — Partial and empty pool

1. Only one stale candidate seeded → **one** row + neutral partial copy.
2. No stale candidates → block hidden or neutral empty (no fake rows).

## P1 — Dismiss (US2)

1. With two visible rows, tap **Pas maintenant** on first → only second remains.
2. Refresh Accueil → dismissed row still absent.
3. Optional: header **×** hides entire block for today.
4. Advance calendar day → new pair may appear; dismissed items eligible again if still stale.

## P2 — Domain diversity (US3)

1. Seed stale book + stale recipe + stale **`to_listen`** track.
2. First visit → two suggestions from **at least two domains** when scores within diversity window ([research.md](research.md)).
3. Tap primary action → lands on correct domain detail ([contracts/suggestion-deep-links.md](contracts/suggestion-deep-links.md)).

## P2 — Récap teaser (US4)

1. After Accueil compute with ≥1 visible slot, open **`/recap`** (011 route).
2. Teaser line visible above period content; recap lists show **past only**.
3. Follow link → Accueil scrolls to `#activity-suggestions`.

## Quality gates

1. Run guilt lexicon test: `tests/unit/suggestions/guilt-lexicon.test.ts` green.
2. Run `yarn verify:ci` after implementation.

## Cross-feature notes

- **011**: Teaser only — no suggestion lines in `buildRecapSnapshot`.
- **008**: Confirm fitness nudge does not show streak UI.
- **013**: Plant nudge uses last water date — no overdue badge copy.
