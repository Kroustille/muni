# Contract: Fitness sync API (008)

**Routes**: `src/app/api/sync/fitness/push`, `pull`

## Entities synced

| Entity | Postgres table | Client IDB store | Outbox |
|--------|----------------|------------------|--------|
| Session template | `fitness_session_template` | `fitnessSessionTemplates` | yes |
| Scheduled session | `fitness_scheduled_session` | `fitnessScheduledSessions` | yes |
| Workout log | `fitness_workout_log` | `fitnessWorkoutLogs` | yes |
| Skip record | `fitness_skip_record` | `fitnessSkipRecords` | yes |
| User settings | `fitness_user_settings` | `fitnessUserSettings` | yes |

**Removed (2026-10-28)**: `fitness_program` / `programs[]` payload — break-fast, no migration.

## Push

| Method | Path | Body |
|--------|------|------|
| POST | `/api/sync/fitness/push` | `{ sessionTemplates[], scheduledSessions[], workoutLogs[], skipRecords[], settings? }` |

Wire shapes: domain `*Wire` types in `session-template.ts`, `scheduled-session.ts`, `workout-log.ts`.

## Pull

| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/api/sync/fitness/pull` | `since`, `limit` | Same arrays + `cursor` |

LWW merge per field via `fields_updated_at` (unchanged from 008 research §1).
