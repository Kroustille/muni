# Contract: Domain stale contributors

**Applies to**: `src/application/suggestions/contributors/*.ts`

## Interface

Each contributor exports:

```typescript
export const booksStaleContributor: DomainStaleContributor = {
  domainId: "book",
  listStaleCandidates(deps, ctx) { /* ActivitySuggestionCandidate[] */ },
};
```

**Context** `ctx`: `{ calendarDay: string; timeZone: string }` — use for whole-day `score` only; do not use wall-clock except TZ conversion.

## Normative rules

All staleness tables and `minStaleDays` values are defined in [research.md](../research.md). Contributors **must not**:

- Read fitness **assiduity streak** fields (spec edge case)
- Emit shopping or quote rows
- Emit recap achievement shapes or write completion entities

## Per-contributor checklist

| File | Domain | Key signals |
|------|--------|-------------|
| `books-stale-contributor.ts` | `book` | `reading`/`paused`/`to_read`; anchors per research |
| `movies-stale-contributor.ts` | `movie` | `to_watch`, série progress |
| `music-tracks-stale-contributor.ts` | `music_track` | `to_listen` only |
| `recipes-stale-contributor.ts` | `recipe` | `cookedDates` max or createdAt |
| `fitness-stale-contributor.ts` | `fitness` | last completed gap; skipped session |
| `music-practice-stale-contributor.ts` | `music_practice` | 012 statuses + practice_log |
| `plants-stale-contributor.ts` | `plants` | last water event; optional potager P1.1 |

## Registry

`contributors/index.ts` exports ordered array and `allStaleContributors`.

Adding a domain = new file + register + unit tests + i18n kind labels — **no** change to `buildDailySuggestions` signature.

## Graceful degradation

If repository port throws **not implemented** or store empty → return `[]`; log at debug in dev only (no user-facing error).
