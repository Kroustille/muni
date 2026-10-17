# Data Model: Library list UX, bulk, catalog multi-add (007)

## Persisted entities (unchanged tables)

Bulk and search features **patch existing** `items` rows (IndexedDB + Postgres). No new migrations V1 unless implementation discovers a missing column (none expected — series/franchise fields exist from 002/003).

### Book item fields (bulk writable)

| Field | Type | Rules |
|-------|------|-------|
| `seriesName` | text null | Trimmed; set on bulk assign (FR-015) |
| `seriesPosition` | numeric null | **Required** on bulk assign confirm; integer ≥ 1 when set (FR-017) |

### Movie item fields (bulk writable)

| Field | Type | Rules |
|-------|------|-------|
| `franchiseName` | text null | Trimmed; French UI label Saga (FR-019) |
| `franchiseId` | text null | UUID string shared by all movies in same saga batch when created (FR-020) |
| `franchiseOrder` | numeric null | **Required** on bulk assign confirm; integer ≥ 1 when set (FR-020) |

### Soft delete (existing)

| Field | Type | Rules |
|-------|------|-------|
| `deletedAt` | timestamp null | Set by `deleteItem`; cleared by `restoreItem` on undo |

## Client-only state (not synced)

### ListViewState (per list mount)

| Field | Type | Rules |
|-------|------|-------|
| `searchQuery` | string | Empty → show full filtered list (FR edge: empty query) |
| `sort` | `ListSort` | `field`: `date` \| `rating`; `order`: `asc` \| `desc`; rating field only when `itemTypeSupportsRatingSort` |
| `selectionMode` | boolean | When true, show checkboxes |
| `selectedIds` | Set\<string\> | Item ids; bulk actions apply only to this set |
| `statusFilter` | existing | Unchanged from current list pages |

### UndoDeleteBatch (UI)

| Field | Type | Rules |
|-------|------|-------|
| `pendingIds` | string[] | Ids soft-deleted awaiting commit after undo window |
| `expiresAt` | number | `Date.now() + UNDO_MS` (default 5000 ms) |
| `scope` | `"single"` \| `"batch"` | French toast copy may mention count when batch |

### GlobalSearchIndex entry (in-memory)

| Field | Type | Rules |
|-------|------|-------|
| `item` | Item | Full item reference |
| `normalizedTitle` | string | From `normalizeText(item.title)` |
| `normalizedAuthor` | string | `normalizeText(item.author ?? "")` when `type === book` |
| `normalizedDirector` | string | `normalizeText(item.director ?? "")` when `type === movie` |

Match: query normalized substring hits any non-empty indexed field for that item (FR-022–FR-024).

### CatalogMultiAddSession (ephemeral UI)

| Field | Type | Rules |
|-------|------|-------|
| `selectedCatalogKeys` | string[] | Provider-specific stable keys (ISBN, imdb, etc.) |
| `defaultStatus` | ItemStatus | `to_read` or `to_watch` per type — **same for entire batch** (FR-027) |
| `results` | `{ key, status: ok \| error, message? }[]` | Partial failure reporting (US8) |

## Validation summary

- Bulk series/saga: block submit if order field empty or non-numeric (FR-017, FR-020).
- List-local search: no query length minimum; trim optional leading spaces via normalize.
- Catalog batch: dedupe within batch by provider id before upsert loop.
