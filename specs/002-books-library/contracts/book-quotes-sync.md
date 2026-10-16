# Contract: Book quotes sync

## Domain port: `BookQuoteRepository`

```typescript
listByBook(bookItemId: string): Promise<BookQuote[]>;
upsert(quote: BookQuote): Promise<BookQuote>;
softDelete(id: string): Promise<void>;
subscribe(bookItemId: string, listener: () => void): Unsubscribe;
```

Server twin: `ServerBookQuoteRepository` with `findByIds`, `upsert`, `pullSince`.

## Wire shape: `BookQuoteWire`

```typescript
{
  id: string;
  book_item_id: string;
  text: string;
  page: number | null;
  created_at: string; // ISO
  deleted_at: string | null;
  fields_updated_at: Record<string, string>;
  server_updated_at?: string; // server-only on pull
}
```

Validation: `text` trimmed length 1–4000; `page` null or integer ≥ 1; `book_item_id` must reference a `book` item owned by the user (server push).

## HTTP: `POST /api/sync/quotes/push`

**Auth**: Session required.

**Body**: `{ quotes: BookQuoteWire[] }` (no `user_id` on rows).

**Response 200**: `{ quotes: BookQuoteWire[] }` merged rows with `server_updated_at`.

**Response 400**: validation errors per row (same pattern as item sync).

## HTTP: `GET /api/sync/quotes/pull`

**Auth**: Session required.

**Query**: `since` (ISO cursor, optional), `limit` (default 500).

**Response 200**: `{ quotes: BookQuoteWire[], cursor: string }`.

## Client rules

- Quotes MUST be edited offline; push in background like items.
- Book detail UI: list quotes ordered by `created_at` desc; add/edit/delete triggers local upsert then sync.
- LWW per field: `text`, `page`, `deleted_at` (not `created_at`).

## Parent lifecycle

When a book item is soft-deleted, client SHOULD soft-delete all quotes for that `book_item_id` in the same session (server MAY reject quotes for deleted parents on push).

## FR mapping

| Area | Requirement |
|------|-------------|
| Child quote entity + sync | FR-B06 |
| Per-field LWW, soft delete, book isolation | FR-B06, constitution IV |
