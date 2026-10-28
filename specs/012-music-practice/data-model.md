# Data Model: Music practice — compositions, DJ sets & instrument learning (012)

All user tables: composite PK `(user_id, id)`, `deleted_at`, `fields_updated_at` jsonb, `server_updated_at` timestamptz. Repositories scoped by `user_id`.

## music_composition

| Field | Type | Rules |
|-------|------|-------|
| `title` | text | Trimmed; length **1–500** |
| `status` | enum | `idea` \| `in_progress` \| `paused` \| `finished` \| `archived` |
| `startedAt` | date null | Optional |
| `finishedAt` | date null | Set when `finished`; backdate allowed; not future (user TZ) |
| `lastWorkedAt` | date null | Updated on session note or manual touch |
| `genreStyle` | text null | Max **200** |
| `tempoBpm` | int null | 20–400 when set |
| `mood` | text null | Max **200** |
| `notes` | text null | Max **5000** |
| `externalUrl` | text null | URL parse optional client-side |
| `sessionNotes` | jsonb | `{ date: YYYY-MM-DD, text: string }[]`; LWW whole field; text max **2000** per entry |
| `linkedTrackIds` | uuid[] null | P2; references 004 track item ids; no server FK to items in MVP |

## dj_set

| Field | Type | Rules |
|-------|------|-------|
| `title` | text | **1–500** trimmed |
| `status` | enum | `planned` \| `performed` \| `cancelled` |
| `performedAt` | date null | **Required** when `performed`; backdate allowed |
| `venue` | text null | Max **300** |
| `durationMinutes` | int null | ≥ 0 |
| `genreStyle` | text null | Max **200** |
| `bpmRange` | text null | Max **50** (single text MVP) |
| `mood` | text null | Max **200** |
| `notes` | text null | Max **5000** |
| `setlist` | jsonb | `{ sortOrder, text, trackId?: uuid }[]`; LWW whole field; text **1–500** per line |
| `externalUrl` | text null | Optional recording link |

## practice_instrument

| Field | Type | Rules |
|-------|------|-------|
| `name` | text | **1–200** trimmed |
| `notes` | text null | Max **2000** |

## practice_exercise

| Field | Type | Rules |
|-------|------|-------|
| `title` | text | **1–500** trimmed |
| `instrumentId` | uuid null | Same-user `practice_instrument` id when set |
| `category` | text null | Max **100** (étude, gamme, … free text) |
| `notes` | text null | Max **2000** |

## practice_plan

| Field | Type | Rules |
|-------|------|-------|
| `name` | text | **1–300** trimmed |
| `isActive` | boolean | At most one `true` per user (MVP) |
| `assignments` | jsonb | `PlanAssignment[]`; LWW whole field |

### PlanAssignment (inside `assignments`)

| Field | Type | Rules |
|-------|------|-------|
| `id` | uuid | Stable within plan |
| `exerciseId` | uuid | Required; same-user exercise |
| `weekdays` | int[] null | 1=Mon … 7=Sun ISO |
| `specificDates` | string[] null | `YYYY-MM-DD` |
| `sortOrder` | number | Stable ordering |
| **Constraint** | — | At least one of `weekdays` or `specificDates` non-empty when assignment active |

## practice_log

| Field | Type | Rules |
|-------|------|-------|
| `practicedAt` | date | Required; backdate allowed; not future |
| `practiceKind` | enum | `structured` \| `improvisation`; default **`structured`** |
| `instrumentId` | uuid null | |
| `exerciseIds` | uuid[] | May be empty for ad-hoc or **`improvisation`** logs |
| `learningPieceId` | uuid null | Optional; not required for récap |
| `durationMinutes` | int null | ≥ 0 |
| `notes` | text null | Max **2000** |

**Récap (011)**: Each non-deleted row → one Musique achievement keyed by **`sourcePracticeLogId`**; multiple rows same **`learningPieceId`** and/or same calendar **`practicedAt`** remain distinct unless the **same log id** is replayed. **`practiceKind: improvisation`** included. Status-only **learning_piece** changes do not substitute.

**Side effect (application)**: When `learningPieceId` set, update that piece’s `lastPracticedAt` to `practicedAt` if newer (not a separate stored event table).

## learning_piece

| Field | Type | Rules |
|-------|------|-------|
| `title` | text | **1–500** trimmed |
| `instrumentId` | uuid null | |
| `status` | enum | `learning` \| `comfortable` \| `paused` \| `archived` |
| `linkedTrackId` | uuid null | P2; 004 `music_track` item id; **no** listen status mutation |
| `startedAt` | date null | |
| `lastPracticedAt` | date null | From logs or manual |
| `notes` | text null | Max **5000** |

## Relationships

```text
User ──< practice_instrument
User ──< practice_exercise ──optional instrumentId──> practice_instrument
User ──< practice_plan ──assignments[].exerciseId──> practice_exercise
User ──< practice_log ──optional links──> exercise(s), instrument, learning_piece
User ──< learning_piece ──optional instrumentId──> practice_instrument
User ──< learning_piece ──optional linkedTrackId──> items (music_track) [logical ref only]
User ──< music_composition ──optional linkedTrackIds[]──> items (music_track)
User ──< dj_set ──optional setlist[].trackId──> items (music_track)
```

## Client “today” computation (not persisted)

For active `practice_plan`, include assignment if:
- `specificDates` contains today’s `YYYY-MM-DD`, OR
- `weekdays` contains today’s ISO weekday

Merge duplicates by `exerciseId` with stable `sortOrder`.

## FR mapping

| Requirement | Model |
|-------------|--------|
| FR-001–FR-002 | `music_composition`, `dj_set` |
| FR-014 | `practice_instrument` |
| FR-015 | `practice_exercise` |
| FR-016 | `practice_plan` + assignments |
| FR-017 | `practice_log` |
| FR-018 | `learning_piece` |
| FR-013 | `finishedAt`, `performedAt`, `practicedAt` persisted with LWW |
