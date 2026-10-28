# Contract: Apprentissage plan & today UI

**Applies to**: User stories C1–C2, FR-014–FR-017, FR-019.

## Instrument registry

- Simple list + quick-add **name**.
- Optional notes on detail.
- Used as filter on exercise library and default on new exercises/pieces.

## Exercise library

- Quick-add **title**; optional instrument picker, category, notes.
- List search on title; filter by instrument.

## Plan editor (`/apprentissage/plan`)

- One **active** plan name (create if none).
- Add assignment: pick exercise → choose weekdays (multi) and/or specific dates.
- Reorder assignments.
- Saving updates `practice_plan.assignments` jsonb.

## Today view

- Compute planned exercises for current local calendar day (see [data-model.md](../data-model.md)).
- Each row: exercise title, instrument name if any, **Fait** button.
- **Fait** creates `practice_log` with `practicedAt=today`, `exerciseIds=[id]`, optional instrument from exercise.
- **Ad-hoc log** button: optional exercise multi-select, instrument, notes, date (default today).

## Recent activity

- Below today list: last N practice logs (title derived from exercises or « Séance libre »).

## Offline

Mark done and plan edits work offline; sync when online.
