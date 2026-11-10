# Contract: Memories & growth sync API

**Applies to**: Offline-first push/pull for all 015 entities (FR-004). Pattern mirrors [013 plants-garden sync](../../013-plants-garden/contracts/plants-garden-sync-api.md) and [012 music-practice sync](../../012-music-practice/contracts/music-practice-sync-api.md).

## Entities synced

| Entity | Table / IDB store | Push | Pull |
|---|---|---|---|
| Souvenir | `souvenir` | yes | yes |
| Objectif | `goal` | yes | yes |
| Check-in | `goal_checkin` | yes | yes |
| Réalisation | `achievement` | yes | yes |

**Not synced**: `on_this_day_dismissal`, `memories_prefs`, `timeline_filter` (device-local), virtual goals (projections of `reading_goal` / `watch_goal`, which keep their own sync).

## Routes

| Method | Path | Body / query | Auth |
|---|---|---|---|
| POST | `/api/sync/memories-growth/push` | `{ souvenirs[], goals[], goalCheckins[], achievements[] }` (omitted keys = `[]`) | session + `isSameOriginRequest` (POST) |
| GET | `/api/sync/memories-growth/pull` | `?since=<cursor>&limit=<1..500>` | session only — **no Origin check on GET** (2026-11-10 incident; browsers omit `Origin` on same-origin GET) |

Pull response: `{ souvenirs[], goals[], goalCheckins[], achievements[], cursor, hasMore }` ordered by `server_updated_at`.

## Merge semantics

- Per-field LWW using `fields_updated_at` (HLC) on each scalar field.
- `souvenir.links` and `achievement.links` are **single jsonb fields**: latest whole-value write wins.
- Soft delete via `deleted_at`; tombstones included in pull; a tombstone wins over older field writes.
- **Achievements with the same deterministic id** from two devices merge like any row (same PK) — this is the SC-004 guarantee. `celebrated_at` LWW: once any device sets it, others don't celebrate.

## Server validation (push)

- `user_id` always from session; rows for other users rejected (400 for the batch).
- `souvenir.title` trimmed 1–200; `occurred_on` ≤ server date + 1 day (tolerance for time zones); `links` ≤ 10, each `{ kind ∈ item|fitness_workout|plant, id uuid }`.
- `goal`: `start_date ≤ end_date`, span ≤ 3 years; `target_kind`/`metric`/`target_count` consistent per [data-model.md](../data-model.md).
- `goal_checkin.goal_id` must reference a same-user goal (tombstoned goal allowed — check-ins follow it).
- `achievement`: `origin = auto` ⇒ `rule_id`, `threshold` non-null.
- Link targets are **not** cross-validated (they live in other sync channels and may arrive later).

## Client

- Engine `src/application/sync/memories-growth-sync-engine.ts` registered in `runSync` engine list (`src/composition/client.ts`) — the runner continues other engines if this one fails (2026-11-10 resilience fix).
- Local writes call `onLocalWrite` → debounced sync; never blocked on network.

## Wire naming

`occurred_on`, `is_favourite` → **`favourite`** (boolean column name `favourite`), `period_kind`, `start_date`, `end_date`, `target_kind`, `target_count`, `goal_id`, `rule_id`, `rule_version`, `earned_on`, `celebrated_at`, `reflection_prompt_dismissed_at`.

## Tests

- Integration: push/pull round trip per entity, isolation between two users, deterministic achievement id from two pushes → one row, tombstone wins.
