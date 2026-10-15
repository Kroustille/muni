# Data Model: Book barcode scan (002)

## Book item extensions (`type = book`)

| Field | Type | Rules |
|-------|------|-------|
| `isbn` | text null | ISBN-13 normalized when known; unique per user among non-deleted rows (enforced in use case) |
| `synopsis` | text null | From catalog; editable |
| `genres` | jsonb null | Array of strings; empty array treated as null |
| `publicationYear` | smallint null | 1000–2100 when set |
| `publisher` | text null | |
| `pageCount` | integer null | ≥ 1 when set (N1) |

Existing book fields unchanged: `title` required; `author` optional (B8); `status`, `rating`, `recommendedBy`, `notes`.

## Server: `catalog_cache`

| Field | Type | Rules |
|-------|------|-------|
| `provider` | text | e.g. `open_library` |
| `cache_key` | text | ISBN-13 |
| `payload` | jsonb | Raw normalized catalog DTO |
| `fetched_at` | timestamptz | For TTL eviction |

Primary key `(provider, cache_key)`.

## Domain types

- **BookCatalogHit**: `{ isbn, title, author?, synopsis?, genres?, publicationYear?, publisher?, pageCount? }` — wire DTO from port, no Open Library shapes in domain.

## State transitions

- Scan confirm → create or upsert per FR-008 (active update, soft-delete restore).
- Manual add without lookup → `isbn` may remain null on mobile/desktop.

## Sync

New fields participate in existing per-field LWW (`fields_updated_at`). No change to merge algorithm.
