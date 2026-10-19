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

## Set input rules

- RPE: integer 1–10 or empty.
- Reps/charge/duration optional per set (FR-024).
- Duration UI may use minutes; store seconds.

## Completion

- Primary: **Terminé** — allowed with zero sets logged.
- Secondary: **Abandonner** — confirms once if data entered.
- Optional Phase D: **Bilan récupération** sheet after Terminé (FR-040).

## Concurrency

- If another `in_progress` log exists, modal: finish or abandon other before starting new (research §6).

## Delete

- From history: delete with **Annuler** undo (FR-050).
