# Contract: Fitness sync API

**Applies to**: Offline-first push/pull for fitness entities (FR-001, FR-051). Pattern mirrors `book_quotes` sync.

## Entities synced

| Entity | Table / store | Push | Pull |
|--------|---------------|------|------|
| User settings | `fitness_user_settings` | yes | yes |
| Program | `fitness_program` | yes | yes |
| Workout log | `fitness_workout_log` | yes | yes |
| Skip record | `fitness_skip_record` | yes | yes |

**Not synced**: exercise catalog (bundled read-only).

## Routes (tentative paths)

| Method | Path | Body / query |
|--------|------|----------------|
| POST | `/api/sync/fitness/push` | `{ programs[], workoutLogs[], skipRecords[], settings? }` |
| GET | `/api/sync/fitness/pull` | `?since=<iso>&limit=<n>` |

Alternative: one route per entity type — implementation may split if payload size requires; semantics unchanged.

## Merge semantics

- Per-field LWW using `fields_updated_at` on each top-level field.
- `plannedSessions` and `loggedExercises` are **single fields** — latest whole-array write wins (same as recipe ingredients).
- Soft delete: `deleted_at` set; pull includes tombstones until client purges per existing sync policy.

## Authorization

- Session required; `user_id` from session only; isolation tests required (SC-005).

## Client queue

- IndexedDB outbound queue entries tagged `fitness_*` consistent with existing sync engine registration.
- Fitness reads/writes never block on network; expired session does not block local fitness CRUD (FR-001).
