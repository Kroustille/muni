# Data Model: Fitness — training, logging, progression (008)

## Read-only catalog (not synced per user)

### ExerciseCatalogDocument (bundled seed)

| Field | Type | Rules |
|-------|------|-------|
| `version` | integer | Monotonic; bump on each catalog release |
| `locale` | `"fr"` | Display locale for seed metadata |
| `exercises` | array | See ExerciseCatalogEntry |

### ExerciseCatalogEntry

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | Kebab-case slug; stable forever |
| `nameFr` | string | UI label (French only) |
| `nameEn` | string | Search alias only; never shown in UI |
| `category` | string | MUST exist in `muscles.catalog.json` `id` |
| `equipment` | string[] | Closed enum per spec / validate-catalog.mjs |
| `modality` | `strength` \| `cardio` \| `mobility` | |
| `tags` | string[] optional | e.g. `push`, `pull`, `hinge` |

### MuscleCategoryDocument

| Field | Type | Rules |
|-------|------|-------|
| `version` | integer | Align with exercises catalog when categories change |
| `muscles` | array | `{ id, nameFr, sortOrder }` for filter UI |

### Client catalog store (`fitness_exercise_catalog` IndexedDB)

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | Same as catalog entry |
| … | | Full entry denormalized for offline search |
| `catalogVersion` | integer | Local applied version; upgrade when `version` in seed increases |

## Persisted user entities (Postgres + IndexedDB + sync)

All tables: composite PK `(user_id, id)`, `deleted_at`, `fields_updated_at` jsonb, `server_updated_at` timestamptz. Repositories scoped by `user_id` (FR-002, FR-051).

### fitness_user_settings (one row per user)

| Field | Type | Rules |
|-------|------|-------|
| `id` | uuid | Fixed singleton id per user (or single row enforced in app) |
| `chargeUnit` | `kg` \| `lb` | Default `kg` |
| `adherenceTrackingEnabled` | boolean | Default false (Phase D) |
| `adherenceMinWorkoutsPerWeek` | smallint | Default 1 when enabled |

### fitness_program (one active program MVP)

| Field | Type | Rules |
|-------|------|-------|
| `id` | uuid | |
| `name` | text | Trimmed, non-empty |
| `isActive` | boolean | Exactly one `true` per user in MVP (FR-010) |
| `plannedSessions` | jsonb | Ordered array of PlannedSession (LWW whole field) |

### PlannedSession (inside `plannedSessions`)

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | Stable uuid within program |
| `title` | text | French UI |
| `weekdays` | int[] | 1=Monday … 7=Sunday (ISO); multiple sessions same day allowed |
| `sortOrder` | number | Stable order among sessions sharing a weekday |
| `exercises` | PlannedExercise[] | Ordered |

### PlannedExercise

| Field | Type | Rules |
|-------|------|-------|
| `exerciseId` | string | Required; must exist in catalog at edit time |
| `defaultSetCount` | int optional | |
| `targetReps` | int optional | |
| `notes` | text optional | |

### fitness_workout_log

| Field | Type | Rules |
|-------|------|-------|
| `id` | uuid | |
| `status` | `in_progress` \| `completed` \| `abandoned` | FR-022 |
| `calendarDate` | date | Local calendar day for adherence |
| `plannedSessionId` | string null | Set when started from plan (FR-021) |
| `title` | text | Default from planned session or “Séance libre” |
| `startedAt` | timestamptz | |
| `completedAt` | timestamptz null | Set when `completed` |
| `catalogVersion` | int | Catalog version at log creation |
| `loggedExercises` | jsonb | LoggedExercise[]; LWW whole field |
| `recovery` | jsonb null | Phase D: `{ sleep, energy, soreness, note }` each 1–5 optional |

### LoggedExercise (inside `loggedExercises`)

| Field | Type | Rules |
|-------|------|-------|
| `exerciseId` | string | Required (FR-024) |
| `nameFrSnapshot` | string | Required at save |
| `sets` | SetRow[] | Ordered |

### SetRow

| Field | Type | Rules |
|-------|------|-------|
| `reps` | int optional | ≥ 0 |
| `chargeKg` | number optional | ≥ 0; display via user unit |
| `durationSeconds` | int optional | ≥ 0 |
| `distanceNote` | text optional | Cardio free text |
| `rpe` | int optional | 1–10 integer |

### fitness_skip_record

| Field | Type | Rules |
|-------|------|-------|
| `id` | uuid | |
| `calendarDate` | date | |
| `plannedSessionId` | string | |
| `note` | text optional | |

## Client-only / derived (not synced)

| Entity | Purpose |
|--------|---------|
| `RecentlyUsedExerciseIds` | Last N `exerciseId`s from logs/plan edits (FR-026) |
| `PersonalRecordView` | Derived max charge / reps per `exerciseId` for UI badges |
| `WeekAdherenceView` | Planned vs completed vs skipped for current week (US6) |

## Validation summary

- No custom `exerciseId` outside catalog (FR-028).
- RPE 1–10 only; reject out of range on save.
- Soft delete workout/program components with undo toast (FR-050).
- Archived catalog id: show `nameFrSnapshot` + “exercice archivé” if id missing from current catalog.

## Migrations (implementation)

- `db/migrations/0014_fitness_tables.ts` (numbers tentative): create tables above + indexes on `(user_id, server_updated_at)` per entity.
- Sync routes: `src/app/api/sync/fitness/...` (see [contracts/fitness-sync-api.md](contracts/fitness-sync-api.md)).
