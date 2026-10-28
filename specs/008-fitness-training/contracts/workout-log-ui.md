# Contract: Workout log UI

**User stories**: US2 (Phase A), US3–US4 (Phase B) — FR-020–FR-026.

## States

| Status | French label (i18n) | Counts toward adherence |
|--------|---------------------|-------------------------|
| `in_progress` | En cours | No |
| `completed` | Terminé | Yes |
| `abandoned` | Abandonné | No |

## Start flows

1. **From plan**: prefill `loggedExercises` from planned session order; `plannedSessionId` set.
2. **Séance libre**: empty exercises; user adds via picker.
3. **Duplicate template** (US4): copy exercises/set structure from selected history log; new id.

## Exercise block

- Header: catalog `nameFr` (live) or snapshot on completed log.
- Actions: add set, remove exercise, reorder.
- Sets table/list: reps, charge (user unit), durée, note distance, RPE.

## Route

- **`/fitness`** — home: today **planifiée**, **session picker** (all templates), **Séance libre**, week strip, recent logs.

## Session picker (FR-020)

- Section **Choisir une séance** (i18n `fitness.home.pickSession`): scrollable list or `<select>` + **Démarrer** for each **active** template (`deletedAt === null`).
- Order: same as library `sortOrder` or title.
- MUST work offline from local templates.

## Set input rules

- RPE: integer 1–10 or empty.
- Reps/charge/duration optional per set (FR-024).
- **Modality-aware layout (FR-024a)**: resolve catalog entry by `exerciseId` + `catalogVersion` on log; **strength** + load equipment → default columns reps + charge; **cardio** / **mobility** → default column durée (+ optional distance note); bodyweight strength (`poids du corps`) → reps prominent, charge optional.
- Duration UI may use minutes; store seconds.

## Completion

- Primary: **Terminé** — allowed with zero sets logged.
- Secondary: **Abandonner** — confirms once if data entered.
- Optional Phase D: **Bilan récupération** sheet after Terminé (FR-040).

## Concurrency

- If another `in_progress` log exists, modal: finish or abandon other before starting new (research §6).

## Delete

- From history: delete with **Annuler** undo (FR-050).
