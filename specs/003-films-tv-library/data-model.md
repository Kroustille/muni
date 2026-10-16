# Data Model: Films & TV feature 003

## Phase A — Movie item extensions (`type = movie`) *(shipped)*

| Field | Type | Rules |
|-------|------|-------|
| `imdbId` | text null | `tt\d+` when set; dedupe key |
| `synopsis` | text null | |
| `releaseYear` | smallint null | |
| `catalogRating` | numeric null | 0–10 display; not personal `rating` |
| `mediaKind` | text null | `film` \| `series` |
| `director` | text null | Catalog + editable |
| `cast` | jsonb null | string[] read-only in UI after save |

Existing: `title`, `status`, `rating` (1–5 personal), `recommendedBy`, `notes`.

## Phase B — Library fields on movie item

| Field | Type | Rules |
|-------|------|-------|
| `tags` | jsonb null | string[]; max 50 × 40 chars |
| `franchiseId` | text null | Shared uuid for saga/franchise grouping |
| `franchiseName` | text null | Display label (denormalized for list) |
| `franchiseOrder` | smallint null | Suggested watch order within franchise |
| `watchedAt` | date null | Optional; default today on **vu**; editable/clearable (FR-B05) |
| `episodeProgress` | jsonb null | Only when `mediaKind === 'series'`. Map key `S{n}E{m}` → `{ watchedAt?: date }` (FR-B08) |
| `nextEpisodeKey` | text null | Derived cache `S{n}E{m}` for UX (recomputed on write) |

**Status enum (films)**: `to_watch` | `watched` | `paused` — MUST NOT use `in_progress`.

**Status enum (séries)**: `to_watch` | `in_progress` (UI **En cours**) | `paused` | `watched`.

**Notes**: `notes` = private notes (FR-B06). No lending columns (denied).

### Server + client: `movie_quotes`

| Field | Type | Rules |
|-------|------|-------|
| `user_id` | uuid | Owner |
| `id` | uuid | PK with user_id |
| `movie_item_id` | uuid | FK → `items.id` where `type = movie` |
| `text` | text | Required |
| `context` | text null | Optional (character/scene) |
| `created_at` | timestamptz | Immutable |
| `deleted_at` | timestamptz null | Soft delete |
| `fields_updated_at` | jsonb | Per-field LWW |
| `server_updated_at` | timestamptz | Pull cursor |

Domain type `MovieQuote`: `{ id, movieItemId, text, context?, createdAt, deletedAt?, fieldsUpdatedAt }`.

## Phase C — Discovery fields on movie item

| Field | Type | Rules |
|-------|------|-------|
| `mood` | text null | Controlled vocab (see research.md) |
| `pace` | text null | Controlled vocab |
| `streamingProviders` | jsonb null | Cached snapshot `{ name, url? }[]` from server; optional |

## Phase D — Watch goals (`watch_goals`)

| Field | Type | Rules |
|-------|------|-------|
| `user_id` | uuid | Owner |
| `year` | smallint | Calendar year |
| `target_count` | integer | ≥ 1 finished films/séries in year |
| `fields_updated_at` | jsonb | LWW |
| `server_updated_at` | timestamptz | Sync cursor |

Unique `(user_id, year)`. Progress derived: films/séries marked `watched` in year per `watchedAt` or status transition.

## Phase D — Watch activity (derived, not a table v1)

**Activity day** (FR-D02): calendar day `D` is active if any movie item has:

1. Status change timestamp on `D` among allowed transitions (`in_progress`, `paused`, `watched`, `to_watch`), or
2. `episodeProgress` key gains `watchedAt` on `D`, or
3. Film/série marked `watched` on `D`.

No session timer. Streak private + optional in UI.

## DTOs (Phase A)

- **MovieSearchHit**: `{ wikidataId, title, releaseYear?, imdbId?, mediaKind, catalogRating?, director? }`
- **MovieCatalogDetail**: extends hit with `synopsis?`, `cast?`, optional `episodes?[]` for série seed

## State transitions

- Upsert by `imdbId` (Phase A). Episode progress only on série rows. Marking film **vu** sets optional `watchedAt` default today.
