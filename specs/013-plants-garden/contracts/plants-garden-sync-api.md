# Contract: Plants & garden sync API

**Applies to**: Offline-first push/pull for all 013 entities (FR-011). Pattern mirrors [008 fitness sync](../../008-fitness-training/contracts/fitness-sync-api.md), [010 cookbook sync](../../010-recipe-source-book/contracts/cookbook-sync-api.md), and [012 music-practice sync](../../012-music-practice/contracts/music-practice-sync-api.md).

## Entities synced

| Entity | Table / store | Push | Pull | MVP phase |
|--------|---------------|------|------|-----------|
| Plant | `plant` | yes | yes | P1 |
| Plant care event | `plant_care_event` | yes | yes | P1 |
| Plant care profile | `plant_care_profile` | yes | yes | P2 |
| Vegetable culture | `vegetable_culture` | yes | yes | P2 |
| Vegetable milestone | `vegetable_milestone` | yes | yes | P2 |

**Not synced**: external species catalogs (none in MVP).

## Routes

| Method | Path | Body / query |
|--------|------|----------------|
| POST | `/api/sync/plants-garden/push` | `{ plants[], careEvents[], careProfiles[], cultures[], milestones[] }` |
| GET | `/api/sync/plants-garden/pull` | `?since=<iso>&limit=<n>` |

P1 push/pull MAY omit empty P2 arrays until P2 ships; server accepts omitted keys as `[]`.

Implementation MAY split push/pull per entity if payload limits require; semantics unchanged.

## Merge semantics

- Per-field LWW using `fields_updated_at` on each scalar field.
- `seasonalHints` on `plant` and `plant_care_profile` are **single jsonb fields** — latest whole-value write wins (008 `plannedSessions` pattern).
- Soft delete: `deleted_at` set; pull includes tombstones per existing sync policy.
- Care events are **append-mostly**; `occurredAt` and `eventType` changes use LWW on those fields.

## Server validation (push)

- Reject rows for other `user_id`.
- `plant.title`: trimmed length **1–500**.
- `plant.locationTag`: enum **`indoor`** \| **`outdoor`** \| **`both`**.
- `plant_care_event.plantId` MUST reference same-user plant when plant not hard-deleted.
- `occurredAt` MUST NOT be future date (server uses user TZ or UTC date boundary — match recipe cook validation).
- **Water dedupe**: reject second push row with same `(plantId, eventType=water, occurredAt date)` OR merge to existing id — **implementation picks reject with 400** mirroring recipe same-day cook.
- `vegetable_milestone`: dedupe per `(cultureId, milestoneType, occurredAt date)` on push (400 on duplicate).
- Optional refs (`careProfileId`, `seasonalHintId`) MUST belong to same user when present.

## Authorization

- Session required; `user_id` from session only; isolation tests required (Constitution V).

## Client queue

- Outbound queue tags `plants_garden_*` registered in `sync-run.ts`.
- Local CRUD never blocked on network; expired session does not block local writes.

## Wire naming

Snake_case on API: `location_tag`, `care_profile_id`, `seasonal_hints`, `event_type`, `occurred_at`, `milestone_type`, `culture_id`, aligned with Postgres columns.

## FR mapping

| Area | Requirement |
|------|-------------|
| Offline sync | FR-011 |
| Water dedupe | FR-006 |
| Isolation | Constitution V |
