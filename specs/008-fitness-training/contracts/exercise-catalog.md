# Contract: Exercise catalog (bundled seed)

**Applies to**: Program editor, workout log, progression views (FR-026–FR-028).

## Source artifacts

| File | Role |
|------|------|
| `specs/008-fitness-training/exercises.catalog.json` | Canonical exercise list |
| `specs/008-fitness-training/muscles.catalog.json` | Category filter labels |
| `specs/008-fitness-training/validate-catalog.mjs` | CI/local validation |

## Runtime loading

1. On first launch or when bundled `version` > local `catalogVersion`, merge seed into IndexedDB `fitness_exercise_catalog`.
2. **Never** fetch exercises from network at runtime (FR-027).
3. Implementation MAY copy JSON to `public/fitness/exercises.catalog.json` at build time; content must match spec seed.

## Picker UI

- Search: `normalizeText` on `nameFr` and `nameEn` (substring, accent-insensitive).
- Filters: `category` (from muscles catalog), `equipment`, `modality`.
- Empty search: show **Récemment utilisés** section (client-only ids) then full list or grouped by category.
- No “create exercise” action; empty search with no match shows French help text (FR-028).

## Display rules

- UI shows **`nameFr` only**; `nameEn` never rendered as primary label.
- Log save MUST persist `nameFrSnapshot` on each `LoggedExercise`.
- Unknown `exerciseId` in old logs: show snapshot + archived label.

## Version bumps

- Increment `version` in `exercises.catalog.json` when adding/removing/changing entries.
- New workouts store current `catalogVersion` on `fitness_workout_log`.
- Removing an id does not delete historical logs.
