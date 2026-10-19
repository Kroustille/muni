# Quickstart: Fitness training (008)

**Prerequisites**: Muni **001–007** on `main`. Run `node specs/008-fitness-training/validate-catalog.mjs` (must pass).

## Catalog seed (foundational)

1. Fresh app / cleared site data → open `/fitness` → catalog picker loads without network.
2. Search “deadlift” → finds “Soulevé de terre”.
3. Bump `version` in seed in dev → relaunch → local catalog updates; old logs still show snapshot.

## Phase A — Program & today (US1–US2)

1. Create program with 3 sessions on Mon/Wed/Fri; add catalog exercises to each.
2. Go offline; edit program name → reload → change persists.
3. On a day with a planned session: home shows **À faire** → **Commencer** → log opens prefilled.
4. Mark **Terminé** without logging sets → appears in recent activity as completed.
5. **Passer** with note → skip recorded; no full log.
6. Day with no plan → **Séance libre** starts empty log.

## Phase B — Log & precision (US3–US4)

1. Log 3 sets with varying reps/charge on one exercise; timed set with duration only.
2. Offline save → reload → values intact.
3. RPE 11 rejected; RPE 8 saved.
4. Add exercise mid-workout via picker; **Récemment utilisés** shows last picks.
5. **Dupliquer comme modèle** from history → new log with same exercises.

## Phase C — Progression (US5–US6)

1. History lists workouts newest first; search by exercise name.
2. Same exercise across 3 workouts with increasing charge → progression shows upward trend / PR on third.
3. Plan 4 sessions in week; complete 2, skip 1 → week strip matches.

## Phase D — Companion (US7–US8)

1. After **Terminé**, optional recovery 1–5 fields on detail.
2. Enable assiduity → two weeks with ≥1 workout → streak 2; disable hides streak.
3. Home card shows week count and next session when program exists.

## Quality gate

- `node specs/008-fitness-training/validate-catalog.mjs`
- `yarn typecheck`, unit tests for fitness domain and sync isolation
- E2e: `tests/e2e/fitness-*.spec.ts` when implemented
