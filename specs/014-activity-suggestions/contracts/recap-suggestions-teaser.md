# Contract: Récap suggestions teaser

**Applies to**: `src/components/recap/suggestions-teaser.tsx`, `/recap` layout (when [011](../../011-periodic-recap/spec.md) ships)

## Purpose

Single **forward-looking** entry point (US4) — **must not** duplicate selection logic or show suggestion rows inside period lists (FR-011).

## Visibility

| Condition | Show teaser |
|-----------|-------------|
| ≥1 visible suggestion slot today | Yes |
| Zero candidates or block dismissed | Hidden |
| Recap period empty | Teaser independent of recap content |

## UI

- One line French: **`suggestions.recapTeaser`** → e.g. « Deux idées pour plus tard → »
- Link: `/#activity-suggestions` (OD-014-4) or in-app router to `/` with hash
- Position: **Above** period switcher / first recap section (spec UX sketch)

## Data

Call `getSuggestionsViewModel` with today's snapshot — **same** `buildDailySuggestions` read path as Accueil; **do not** re-run first-visit compute on `/recap` unless snapshot missing and product explicitly allows lazy compute (plan default: **read-only** on recap — if no snapshot yet, teaser hidden until user visits Accueil).

## Tests

- E2e: seed stale items, visit Accueil once, open `/recap` → teaser visible
- Unit: teaser hidden when `visibleSlots.length === 0`
