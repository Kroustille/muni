# Data Model: Recipe source book / cookbook citation (010)

## Cookbook (user-scoped catalog — **not** an `items` row)

Persisted in **`cookbooks`** (Postgres) and **`cookbooks`** IndexedDB object store. Synced via cookbook push/pull (see [contracts/cookbook-sync-api.md](contracts/cookbook-sync-api.md)).

| Field | Type | Rules |
|-------|------|-------|
| `user_id` | uuid | Owner (session-scoped on server) |
| `id` | uuid | PK with `user_id` |
| `title` | text | Required on create; trimmed; `char_length(btrim(title))` between **1** and **500** |
| `author` | text null | Optional; trimmed empty → null; max **200** chars when set |
| `isbn` | text null | Optional free text in MVP; trimmed empty → null; max **32** chars when set |
| `created_at` | timestamptz | Set on create; immutable |
| `deleted_at` | timestamptz null | Soft delete (no delete UI in MVP; tombstones for sync) |
| `fields_updated_at` | jsonb | Per-field LWW map (`title`, `author`, `isbn`, `deleted_at`) |
| `server_updated_at` | timestamptz | Pull cursor |

**Indexes**: `(user_id, server_updated_at)` for pull; optional `(user_id, lower(title))` deferred — client search uses in-memory normalize.

**Domain type `Cookbook`**: `{ id, title, author, isbn, createdAt, deletedAt?, fieldsUpdatedAt }`.

**Invariants**:
- Created only through recipe combobox confirm-create or upsert when editing author/ISBN on recipe form (FR-005).
- **Not** linked to `items` where `type = book`; no reading `status`, rating, or quotes.

## Recipe item extensions (`type = recipe` on `items`)

| Field | Type | Rules |
|-------|------|-------|
| `cookbook_id` | uuid null | When set, MUST reference existing non-deleted cookbook for same `user_id` (server push validation) |
| `source_page` | text null | Short text (ranges, “p. 42”); max **100** chars when set; **MUST be null when `cookbook_id` is null** (FR-002, edge case) |

**LWW**: `cookbook_id` and `source_page` are separate scalar fields in `fields_updated_at` (same as `notes`).

**DB check constraint (recipe branch)**:
- `cookbook_id` and `source_page` null for non-recipe types
- `(source_page IS NULL OR cookbook_id IS NOT NULL)`
- Recipe rows keep existing recipe nullability rules (`author`, `status`, etc. null)

**Wire (item sync)** snake_case: `cookbook_id`, `source_page`.

**Domain `Item` (recipe)**: add `cookbookId: string | null`, `sourcePage: string | null` — null for non-recipe types in validation.

## Relationships

```text
User ──< Cookbook (catalog)
User ──< Item (recipe) ──optional cookbook_id──> Cookbook
```

- Many recipes may reference one cookbook (US2).
- Deleting/restoring a recipe does **not** delete the cookbook (MVP).
- Clearing recipe `cookbookId` clears `sourcePage` in the same use case before persist.

## Client combobox search (not persisted)

Search existing cookbooks with `normalizeText` substring match on **title** and **author** (if present). Sort: title localeCompare `fr`. Cap dropdown at **20** results; “Créer « … »” when trimmed query non-empty and no exact title match.

## P2 search index (US6)

In-memory search index entry for each recipe item includes normalized **cookbook title** resolved from local cookbook store when `cookbookId` set (see [contracts/recipe-search-extension.md](contracts/recipe-search-extension.md)).

## FR mapping

| Requirement | Model |
|-------------|--------|
| FR-001 | Cookbook entity + table |
| FR-002 | `cookbook_id` + `source_page` with orphan-page rule |
| FR-006 | LWW + sync columns on both entities |
| FR-008 | Clear selection → both fields null |
| FR-009 | No `book` item fields or ids |
| FR-011 (P2) | Search index includes cookbook title |
