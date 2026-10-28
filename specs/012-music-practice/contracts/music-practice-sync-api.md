# Contract: Music practice sync API

**Applies to**: Offline-first push/pull for all 012 entities (FR-001–FR-021, foundation sync). Pattern mirrors [008 fitness sync](../../008-fitness-training/contracts/fitness-sync-api.md) and [010 cookbook sync](../../010-recipe-source-book/contracts/cookbook-sync-api.md).

## Entities synced

| Entity | Table / store | Push | Pull |
|--------|---------------|------|------|
| Music composition | `music_composition` | yes | yes |
| DJ set | `dj_set` | yes | yes |
| Practice instrument | `practice_instrument` | yes | yes |
| Practice exercise | `practice_exercise` | yes | yes |
| Practice plan | `practice_plan` | yes | yes |
| Practice log | `practice_log` | yes | yes |
| Learning piece | `learning_piece` | yes | yes |

**Not synced**: 004 music library rows (read-only reference by id).

## Routes

| Method | Path | Body / query |
|--------|------|----------------|
| POST | `/api/sync/music-practice/push` | `{ compositions[], djSets[], instruments[], exercises[], plans[], logs[], learningPieces[] }` |
| GET | `/api/sync/music-practice/pull` | `?since=<iso>&limit=<n>` |

Implementation MAY split push/pull per entity if payload limits require; semantics unchanged.

## Merge semantics

- Per-field LWW using `fields_updated_at` on each scalar field.
- `sessionNotes`, `setlist`, `assignments`, `exerciseIds` are **single jsonb fields** — latest whole-value write wins (same as fitness `loggedExercises`).
- Soft delete: `deleted_at` set; pull includes tombstones per existing sync policy.

## Server validation (push)

- Reject rows for other `user_id`.
- When `dj_set.status === performed`, require `performedAt`.
- When `music_composition.status === finished`, require `finishedAt` (default server may coerce today if missing — prefer client default).
- `practice_plan.isActive`: if push sets `true`, demote other active plans for user (transaction) OR reject second active — **implementation picks demote** (008 pattern).
- Optional uuid refs (`instrumentId`, `exerciseId`, `linkedTrackId`) MUST belong to same user when present; orphaned refs allowed if target soft-deleted.

## Authorization

- Session required; `user_id` from session only; isolation tests required.

## Client queue

- Outbound queue tags `music_practice_*` registered in `sync-run.ts`.
- Local CRUD never blocked on network; expired session does not block local writes.

## Wire naming

Snake_case on API: `music_composition` rows use `genre_style`, `tempo_bpm`, `session_notes`, `linked_track_ids`, etc., aligned with Postgres columns.
