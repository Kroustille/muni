# Contract: Fitness UI routes and navigation

**Applies to**: App shell primary navigation (FR-004), French labels via `fr.json`.

## Primary navigation

| Route | Purpose | Phase |
|-------|---------|-------|
| `/fitness` | Fitness home — today’s sessions, week strip entry, recent activity | A |
| `/fitness/program` | Edit active training program (sessions, weekdays, planned exercises) | A |
| `/fitness/workout/[id]` | In-progress or completed workout log editor | A/B |
| `/fitness/history` | Reverse-chronological workouts and skips | C |
| `/fitness/exercises/[exerciseId]/progression` | Per-exercise trends and PRs | C |
| `/fitness/settings` | Charge unit, adherence toggle (Phase D) | A / D |

## Navigation label (French)

- Shell entry: **Entraînement** (or **Fitness** if product prefers shorter — pick one key in i18n; default **Entraînement**).
- Icon: consistent with other list destinations (hand-built SVG, no new library).

## Fitness home (`/fitness`)

- **Today block**: planned sessions for local calendar day with status **À faire** / **En cours** / **Fait** / **Passé**.
- Actions: **Commencer**, **Passer** (optional note), **Séance libre**.
- **Recent activity**: last N completed/skipped (configurable in UI, default 5).
- Empty state: CTA to create program → `/fitness/program`.

## Deep links

- Workout detail always `/fitness/workout/[id]`.
- Progression from history row or exercise name tap on log detail.

## Non-goals (MVP)

- No `/search` global integration required (FR-052 optional later).
- No settings sub-routes for Health/Garmin.
