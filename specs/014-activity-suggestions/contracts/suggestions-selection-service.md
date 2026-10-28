# Contract: Suggestions selection service

**Applies to**: `src/application/suggestions/build-daily-suggestions.ts`, domain types in `src/domain/activity-suggestion.ts`.

## Purpose

Deterministic, offline **daily pair** selection for Accueil — contrast [011 recap aggregation](../../011-periodic-recap/contracts/recap-aggregation-service.md) (past achievements). **Must not** import recap contributors (FR-011).

## Public use case

### `buildDailySuggestions`

```text
Input:
  calendarDay: string           // YYYY-MM-DD local
  timeZone?: string             // default Europe/Paris
  trigger: 'accueil_first_visit' | 'read_only'
  deps: SuggestionsDeps

Output: DailyActivitySuggestionSnapshot (see data-model.md)
```

**Behavior**:

1. Load existing snapshot for `calendarDay` from `ActivitySuggestionStore`. If present and `trigger === 'accueil_first_visit'` on revisit → return unchanged (US1 stable snapshot).
2. If absent and `trigger === 'accueil_first_visit'`:
   - Build candidate pool (step 3).
   - Run selection algorithm ([research.md](../research.md) § Selection algorithm).
   - Persist snapshot with 0–2 slots.
3. **BUILD pool**:
   - For each registered stale contributor (stable order), call `listStaleCandidates(deps, { calendarDay, timeZone })`.
   - Filter: not soft-deleted, not dismissed today, `score >= minStaleDays`, shopping excluded.
4. **PICK** S1/S2 with diversity rule OD-014-3.
5. Apply dismiss flags from store onto slots when rendering (does not re-pick).

**Must not**: Backfill third candidate when user dismisses one slot (FR-012).

### `getSuggestionsViewModel`

```text
Input: snapshot, i18n
Output: ActivitySuggestionsViewModel
```

Maps slots to French strings via `kind` + domain templates; runs guilt lexicon guard (tests).

## `SuggestionsDeps` (ports)

| Port | Used by |
|------|---------|
| `ItemRepository` (books, movies, music tracks, recipes) | 002–004, recipe staleness |
| `FitnessWorkoutRepository` / program ports | 008 gap + skip |
| **012** composition, DJ, practice log repos | music_practice contributor |
| **013** plant + care event repos | plants contributor |
| `ActivitySuggestionStore` | snapshot + dismiss read/write |
| `Clock` / `localCalendar` helper | Europe/Paris day boundary (shared with 011) |

No network. Missing repo → contributor returns `[]` (FR-013).

## Contributor interface

See [domain-stale-contributors.md](domain-stale-contributors.md).

**Registry order** (tie-break): `books`, `movies`, `musicTracks`, `recipes`, `fitness`, `musicPractice`, `plants`.

## Tests (normative)

| File | Covers |
|------|--------|
| `tests/unit/suggestions/selection-algorithm.test.ts` | Exactly 2, diversity, tie-break, fitness cap |
| `tests/unit/suggestions/snapshot-idempotency.test.ts` | Same day revisit |
| `tests/unit/suggestions/dismiss-no-backfill.test.ts` | FR-012 |
| `tests/unit/suggestions/*-contributor.test.ts` | Per-domain staleness tables |

## Performance

Target **< 50ms p95** on 2k items in Vitest fixture (constitution scale).
