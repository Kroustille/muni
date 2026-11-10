# Data model: Souvenirs & progression (015)

**Spec**: [spec.md](spec.md) | **Research**: [research.md](research.md)

All synced entities follow foundation (001) conventions: composite PK **`(user_id, id)`**, `id` uuid generated on the client, **`fields_updated_at` jsonb** of HLC stamps for per-field LWW, **`deleted_at`** soft delete (tombstones pulled), **`server_updated_at`** for pull cursors. Wire and columns are snake_case; domain types camelCase. Calendar dates are `YYYY-MM-DD` strings in the user's time zone (default `Europe/Paris`, same as récap).

Migration: **`db/migrations/0021_memories_growth_tables.ts`** (after `0020_fitness_scheduled_snapshots`).

---

## Souvenir (`souvenir`) — synced

| Field | Type | Rules |
|---|---|---|
| `id` | uuid | client-generated |
| `title` | text | trimmed, 1–200 chars (FR-001) |
| `occurredOn` | date | required, default today, **≤ today** (edge case: no future) |
| `body` | text \| null | ≤ 10 000 chars |
| `mood` | `BookMood` \| null | shared mood vocabulary (R4) |
| `place` | text \| null | ≤ 200 chars |
| `favourite` | boolean | default `false` |
| `links` | jsonb `SouvenirLink[]` | ≤ 10; whole-value LWW (R3) |
| `createdAt` | timestamptz | |
| `deletedAt` | timestamptz \| null | soft delete + undo |
| `fieldsUpdatedAt` | jsonb | per-field HLC |

`SouvenirLink = { kind: "item" | "fitness_workout" | "plant"; id: uuid }` — `item` must not be a shopping item (client validation; R3).

Indexes: `(user_id, server_updated_at)` for pull; IDB index on `occurredOn` (timeline, Ce jour-là) and a multi-entry index on `links[].id` is **not** needed (scan is fine at personal scale).

Search: title + place participate in global search (FR-006) via existing `normalizeText`.

---

## Objectif (`goal`) — synced

| Field | Type | Rules |
|---|---|---|
| `id` | uuid | |
| `title` | text | 1–200 chars |
| `periodKind` | `week \| month \| quarter \| year \| custom` | presets only compute dates |
| `startDate` / `endDate` | date | `startDate ≤ endDate`; span ≤ 3 years |
| `targetKind` | `domain_count \| checkin_count \| done` | R5 |
| `metric` | `books \| movies \| recipes \| fitness \| music_practice \| plants \| souvenirs` \| null | required iff `domain_count` |
| `targetCount` | int \| null | ≥ 1, required unless `done` |
| `status` | `active \| archived` | "completed" is **derived** (progress ≥ target or done check-in) |
| `reflection` | text \| null | ≤ 5 000 chars (FR-016) |
| `reflectionPromptDismissedAt` | timestamptz \| null | end-of-period prompt dismissed |
| `createdAt`, `deletedAt`, `fieldsUpdatedAt` | | standard |

Derived (never stored): `progressCount`, `isComplete`, `completedOn` (calendar day the target was reached — the day of the N-th counted event; used for timeline, Moments forts, and `goals_completed` achievements).

**Virtual goals** (R6, not stored): projections of `ReadingGoal` / `WatchGoal` for a year → `{ source: "reading_goal" | "watch_goal", metric: "books" | "movies", periodKind: "year", startDate: "<year>-01-01", endDate: "<year>-12-31", targetKind: "domain_count", targetCount }`.

---

## Check-in (`goal_checkin`) — synced

| Field | Type | Rules |
|---|---|---|
| `id` | uuid | |
| `goalId` | uuid | same-user goal (server-validated) |
| `occurredOn` | date | ≤ today; counted only if within goal period |
| `note` | text \| null | ≤ 1 000 chars |
| `createdAt`, `deletedAt`, `fieldsUpdatedAt` | | standard |

Only valid for goals with `targetKind` `checkin_count` or `done`.

---

## Réalisation (`achievement`) — synced

| Field | Type | Rules |
|---|---|---|
| `id` | uuid | auto: **deterministic** `uuidV5(NS, "${ruleId}:${threshold}")` (R7); manual: random |
| `origin` | `auto \| manual` | |
| `ruleId` | text \| null | required iff `auto` |
| `ruleVersion` | int \| null | |
| `threshold` | int \| null | required iff `auto` |
| `title` | text | auto: rendered from i18n at creation and stored (stable if copy changes); manual: 1–200 |
| `earnedOn` | date | auto: day the threshold was crossed; manual: user-chosen ≤ today |
| `body` | text \| null | ≤ 5 000 (manual only in UI) |
| `links` | jsonb `SouvenirLink[]` | auto: triggering item when single (e.g. the 10th book) |
| `celebratedAt` | timestamptz \| null | set when the celebration toast was shown/dismissed (prevents re-celebrating on other devices) |
| `createdAt`, `deletedAt`, `fieldsUpdatedAt` | | standard |

Invariants: an auto achievement is **never** re-created after the user deletes it (tombstone keeps the deterministic id). Evaluation is insert-only (FR-021).

---

## Local-only (IndexedDB, not synced)

| Store | Key | Purpose |
|---|---|---|
| `on_this_day_dismissal` | `calendarDay` | Ce jour-là dismissed for that day on this device (FR-012) |
| `memories_prefs` | `"prefs"` | `{ onThisDayEnabled: boolean }` device preference (R8) |
| `timeline_filter` | `"filter"` | remembered Fil de vie domain filter (spec US2 AS2) |

IDB version bump in `src/adapters/indexeddb/db.ts` adds: `souvenir`, `goal`, `goal_checkin`, `achievement`, the three local stores, plus the standard outbox tags `memories_growth_*`.

---

## Derived: Timeline entry (not stored)

```ts
type TimelineEntry =
  | { kind: "souvenir"; occurredOn: string; souvenirId: string; title: string; favourite: boolean; mood: BookMood | null }
  | { kind: "domain"; occurredOn: string; sortInstant: string; achievement: RecapAchievement } // from 011 contributors
  | { kind: "achievement"; occurredOn: string; achievementId: string; title: string }
  | { kind: "goal_completed"; occurredOn: string; goalId: string; title: string };
```

Grouped by `occurredOn` (desc), within a day: souvenirs first, then achievements, goals, then domain lines by `sortInstant` desc.

---

## Relationships

```text
souvenir.links[] ──► item | fitness_workout | plant      (soft reference, may dangle)
goal 1 ── * goal_checkin
achievement.links[] ──► item | fitness_workout | plant   (soft reference)
reading_goal / watch_goal ──► virtual goal (read-through)
```

## State transitions

- **Goal**: `active` → `archived` (user) ; `archived` → `active` (user) ; delete = soft delete. Completion is derived and does not change `status`.
- **Achievement**: created (auto/manual) → soft-deleted (user). No other transitions.
- **Souvenir**: created → edited → soft-deleted ⇄ restored (undo window, 001 pattern).
