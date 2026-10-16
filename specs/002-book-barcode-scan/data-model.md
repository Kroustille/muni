# Data Model: Books feature 002

## Phase A — Book item extensions (`type = book`)

| Field | Type | Rules |
|-------|------|-------|
| `isbn` | text null | ISBN-13 normalized when known; unique per user among non-deleted rows (enforced in use case) |
| `synopsis` | text null | From catalog; editable |
| `genres` | jsonb null | Array of strings; empty array treated as null |
| `publicationYear` | smallint null | 1000–2100 when set |
| `publisher` | text null | |
| `pageCount` | integer null | ≥ 1 when set (N1) |

Existing book fields unchanged: `title` required; `author` optional (B8); `status`, `rating`, `recommendedBy`, `notes`.

**Status enum (Phase B extension)**: `to_read` | `reading` | `read` | **`paused`** (UI **En pause**). DB check constraint updated accordingly.

## Phase B — Library fields on book item

| Field | Type | Rules |
|-------|------|-------|
| `workId` | text null | Open Library work key (`OL…W`) from catalog, or `local:{uuid}` for manual grouping; editions sharing value group in UI (FR-B07) |
| `tags` | jsonb null | string[]; normalized trim; max 50 × 40 chars |
| `seriesName` | text null | Free text series title |
| `seriesPosition` | numeric null | Order within series; nullable if unknown |
| `pagesRead` | integer null | ≥ 0; meaningful when `status` is `reading` or `paused` (FR-B03) |
| `loanedTo` | text null | Borrower display name; **at most one active loan** — if set, book treated as lent (FR-B04) |
| `loanedAt` | date null | Optional loan start; must be null when `loanedTo` is null |

**Notes**: `notes` remains the private notes field (FR-B05). No loan history columns in v1.

### Server + client: `book_quotes`

| Field | Type | Rules |
|-------|------|-------|
| `user_id` | uuid | Owner (same as items) |
| `id` | uuid | Primary key with user_id |
| `book_item_id` | uuid | FK → `items.id` where `type = book` |
| `text` | text | Required, non-empty after trim |
| `page` | integer null | ≥ 1 when set |
| `created_at` | timestamptz | Set on create; immutable |
| `deleted_at` | timestamptz null | Soft delete |
| `fields_updated_at` | jsonb | Per-field LWW map |
| `server_updated_at` | timestamptz | Pull cursor |

Indexes: `(user_id, book_item_id)`, `(user_id, server_updated_at)`.

**Domain type `BookQuote`**: `{ id, bookItemId, text, page?, createdAt, deletedAt?, fieldsUpdatedAt }`.

## Phase C — Discovery fields on book item

| Field | Type | Rules |
|-------|------|-------|
| `mood` | text null | One of controlled keys (see research.md §16) |
| `pace` | text null | One of controlled keys (see research.md §16) |

Filters combine mood, pace, and tags (AND within dimension, OR across selected tags — document in UI contract).

## Phase D — Reading goals (`reading_goals`)

| Field | Type | Rules |
|-------|------|-------|
| `user_id` | uuid | Owner |
| `year` | smallint | Calendar year e.g. 2026 |
| `target_count` | integer | ≥ 1 |
| `fields_updated_at` | jsonb | LWW |
| `server_updated_at` | timestamptz | Sync cursor |

Unique `(user_id, year)`.

**Progress** (derived, not stored): count of books finished in `year` per activity/finish rules in research.md §13–14.

## Phase D — Activity (derived model, not a table v1)

**Activity day** (for heatmap + streaks, FR-D02):

A local-calendar-day `D` is active if ∃ book item where any of:

1. `fieldsUpdatedAt.status` maps to a timestamp on `D` and the change reflects a book status change (any of `to_read`, `reading`, `read`, `paused`), or
2. `fieldsUpdatedAt.pagesRead` maps to a timestamp on `D`, or
3. Current `status === 'read'` and `fieldsUpdatedAt.status` on `D` corresponds to entering `read`.

Implementation may inspect patch history only via stored `fieldsUpdatedAt` keys (no full audit log). **Streak**: consecutive active days ending today; **heatmap**: count active days per day (0 or 1 for display).

Optional future: `activity_events` materialized table if derivation cost exceeds budget (not v1).

## Server: `catalog_cache` (Phase A)

| Field | Type | Rules |
|-------|------|-------|
| `provider` | text | e.g. `open_library` |
| `cache_key` | text | ISBN-13 or search key |
| `payload` | jsonb | Raw normalized catalog DTO |
| `fetched_at` | timestamptz | For TTL eviction |

Primary key `(provider, cache_key)`.

## Domain types

- **BookCatalogHit** (Phase A + B): Phase A fields plus optional **`workId`** when edition lookup provides it.
- **BookQuote**: see table above.
- **ReadingGoal**: `{ year, targetCount, fieldsUpdatedAt }`.

## State transitions

- Scan confirm → create or upsert per FR-008 (active update, soft-delete restore); populate `workId` when catalog hit includes it.
- **Paused**: from any status → `paused`; may set `pagesRead`; resume → `reading` or `read`.
- **Loan**: set `loanedTo` (+ optional `loanedAt`); clear both on return.
- **Quote**: create/update/delete via quote sync; deleting parent book soft-deletes or orphans quotes per use case (recommend: cascade soft-delete quotes when book deleted).

## Sync

- **Items**: existing per-field LWW (`fields_updated_at`). All new book columns participate.
- **Quotes**: same merge algorithm on `BookQuote` wire shape; separate push/pull endpoint.
- **Goals**: same LWW; small table synced with dedicated pull/push or piggyback on user meta sync (implementer choice — prefer dedicated `reading_goals` sync in same family as quotes).
