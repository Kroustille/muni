# Contract: History, progression, adherence

**User stories**: US5–US6 (Phase C), US7–US8 (Phase D).

## History (`/fitness/history`)

- Sort: `calendarDate` desc, then `completedAt`.
- Row summary: title, date, exercise count or duration.
- In-fitness search: filter by session title or exercise `nameFr` / snapshot (FR-052).
- Tap → `/fitness/workout/[id]`.

## Progression (`/fitness/exercises/[exerciseId]/progression`)

- Input: `exerciseId` from catalog.
- Show last **8** occurrences by default (configurable constant).
- Per visit: date, best set volume or max charge, optional trend text (“charge max en hausse”).
- PR badge when save detects new max charge or max reps at charge (FR-032).
- Performance: SC-004 — client-side aggregate from local logs.

## Week adherence (US6)

- Week strip on fitness home or dedicated section: Mon–Sun.
- States: à faire, fait, passé, libre (unplanned completion).
- Skipped visually distinct from completed.

## Phase D (not MVP UI unless tasks say otherwise)

- Recovery strip 7 days on workout detail.
- Home fitness card: week completed count + next planned session (FR-042).
- Assiduity streak when `adherenceTrackingEnabled` (FR-041).
