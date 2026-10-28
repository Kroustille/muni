# Contract: Suggestion deep links

**Applies to**: `ActivitySuggestionCandidate.deepLink`, Accueil primary action navigation

## Rules

- **One authoritative screen per domain** (FR-014) — no `/suggestions/[id]` route
- Use existing app routes; include item id path segment
- If item soft-deleted at navigation time → domain list empty state or 404 handler (no guilt toast)

## Normative paths (defaults — align with shipped routes)

| `domainId` | Path pattern | Notes |
|------------|--------------|-------|
| `book` | `/items/{itemId}` or `/books` detail if dedicated | Match 002 list UX |
| `movie` | `/items/{itemId}` | Film/série item id |
| `music_track` | `/items/{itemId}` or `/music/tracks` | Track backlog row |
| `recipe` | `/items/{itemId}` | Recipe item |
| `fitness` | `/fitness` or `/fitness/workout/{id}` | Skip nudge → planned session |
| `music_practice` | `/music/practice/...` per [012 ui-routes](../../012-music-practice/contracts/ui-routes.md) | Tab deep link query optional |
| `plants` | `/plants/{plantId}` per [013 ui-routes](../../013-plants-garden/contracts/ui-routes.md) | Water action on detail |

Implementation tasks **must** verify paths against `src/app/(app)/` at ship time; update this contract if routes differ.

## Query params

Optional `?from=suggestions` for analytics-free debugging only — **no** tracking in MVP (Constitution V).
