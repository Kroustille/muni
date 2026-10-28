# Contract: Cookbook sync API

**Applies to**: User-scoped cookbook catalog (FR-001, FR-006). Pattern mirrors [book quotes sync](../../002-books-library/contracts/book-quotes-sync.md).

## Domain port: `CookbookRepository`

```typescript
get(id: string): Promise<Cookbook | undefined>;
listAll(): Promise<Cookbook[]>;
upsert(cookbook: Cookbook, options?: { enqueue?: boolean }): Promise<Cookbook>;
softDelete(id: string): Promise<void>; // reserved; no MVP UI
subscribe(listener: () => void): Unsubscribe;
```

Server twin: `ServerCookbookRepository` with `findByIds`, `upsert`, `pullSince`.

## Wire shape: `CookbookWire`

```typescript
{
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  created_at: string; // ISO
  deleted_at: string | null;
  fields_updated_at: Record<string, string>;
  server_updated_at?: string; // server-only on pull
}
```

Validation:
- `title`: trimmed length **1–500**
- `author`: null or trimmed length **1–200**
- `isbn`: null or trimmed length **1–32**
- No `user_id` on wire rows

## HTTP: `POST /api/sync/cookbooks/push`

**Auth**: Session required.

**Body**: `{ cookbooks: CookbookWire[] }`

**Response 200**: `{ cookbooks: CookbookWire[] }` merged rows with `server_updated_at`.

**Response 400**: validation errors per row (same pattern as item sync).

**Server rules**:
- Reject rows referencing another user’s ids (implicit via session `user_id`)
- Merge per-field LWW using `fields_updated_at`

## HTTP: `GET /api/sync/cookbooks/pull`

**Auth**: Session required.

**Query**: `since` (ISO cursor, optional), `limit` (default 500).

**Response 200**: `{ cookbooks: CookbookWire[], cursor: string }`.

## Item sync extension (recipe fields)

Existing **`POST/GET /api/sync/items/*`** payloads gain optional fields on recipe rows only:

| Wire field | Type |
|------------|------|
| `cookbook_id` | uuid \| null |
| `source_page` | string \| null |

Server push MUST reject `source_page` when `cookbook_id` is null and MUST verify cookbook exists for user when `cookbook_id` is set.

## Client rules

- Cookbooks edited offline; enqueue on upsert like quotes.
- Recipe save that creates a cookbook performs **local cookbook upsert first**, then item upsert with `cookbook_id`.
- Pull order: cookbooks before items when hydrating cold start (or lazy-resolve detail if cookbook missing — retry after cookbook pull completes).

## FR mapping

| Area | Requirement |
|------|-------------|
| Cookbook catalog sync | FR-001, FR-006 |
| Recipe reference sync | FR-002, FR-006, US5 |
| Isolation | Constitution V |
