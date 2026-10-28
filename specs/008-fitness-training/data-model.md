# Data Model: Fitness — training, logging, progression (008)

**Session-first realignment (2026-10-28)**: Prefer **séance template** + **scheduled séance** entities below. Legacy **`fitness_program`** / **`plannedSessions`** / **`weekdays[]`** on `main` is documented in [research.md](./research.md) §11.

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

### fitness_seance_template (library)

| Field | Type | Rules |
|-------|------|-------|
| `id` | uuid | |
| `title` | text | Trimmed, non-empty (French UI) |
| `sortOrder` | number optional | Library ordering |
| `templateExercises` | jsonb | Ordered array of TemplateExercise (LWW whole field) |

### TemplateExercise (inside `templateExercises`)

| Field | Type | Rules |
|-------|------|-------|
| `exerciseId` | string | Required; must exist in catalog at edit time |
| `defaultSetCount` | int optional | |
| `targetReps` | int optional | |
| `notes` | text optional | |

### fitness_scheduled_seance (optional **planifier**)

| Field | Type | Rules |
|-------|------|-------|
| `id` | uuid | |
| `calendarDate` | date | User-chosen explicit date (FR-014) |
| `seanceTemplateId` | uuid | References `fitness_seance_template.id` |
| `sortOrder` | number optional | When multiple scheduled on same date |

### fitness_workout_log

| Field | Type | Rules |
|-------|------|-------|
| `id` | uuid | |
| `status` | `in_progress` \| `completed` \| `abandoned` | FR-022 |
| `calendarDate` | date | Local calendar day for adherence |
| `seanceTemplateId` | uuid null | Set when started from a template (FR-021) |
| `scheduledSeanceId` | uuid null | Set when started from a **planifiée** row |
| `title` | text | Default from template or “Séance libre” |
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
| `scheduledSeanceId` | uuid | Preferred link when skipping **planifiée** |
| `seanceTemplateId` | uuid optional | Denormalized for display if schedule row deleted |
| `note` | text optional | |

## Legacy (shipped weekly-program shape — migrate away)

### fitness_program (deprecated target)

| Field | Type | Rules |
|-------|------|-------|
| `id` | uuid | |
| `name` | text | Was program container |
| `isActive` | boolean | **Reject** as product default post 2026-10-28 |
| `plannedSessions` | jsonb | Each **PlannedSession** had `weekdays[]` — map to templates + scheduled rows or drop |

See [research.md](./research.md) §11 for migration intent.

## Client-only / derived (not synced)

| Entity | Purpose |
|--------|---------|
| `RecentlyUsedExerciseIds` | Last N `exerciseId`s from logs/template edits (FR-026) |
| `PersonalRecordView` | Derived max charge / reps per `exerciseId` for UI badges |
| `WeekAdherenceView` | **Planifiée** vs completed vs skipped for current week (US6) |

## Validation summary

- No custom `exerciseId` outside catalog (FR-028).
- RPE 1–10 only; reject out of range on save.
- Soft delete workout/template/schedule with undo toast (FR-050).
- Archived catalog id: show `nameFrSnapshot` + “exercice archivé” if id missing from current catalog.

## Migrations (implementation)

- `db/migrations/0014_fitness_tables.ts` (numbers tentative): create tables above + indexes on `(user_id, server_updated_at)` per entity. Follow-up migration may rename/split program table when implementing session-first.
- Sync routes: `src/app/api/sync/fitness/...` (see [contracts/fitness-sync-api.md](contracts/fitness-sync-api.md)).
