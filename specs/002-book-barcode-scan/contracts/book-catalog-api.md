# Contract: Book catalog lookup API

## Port: `BookCatalogLookup`

```typescript
lookupByIsbn(isbn: string): Promise<BookCatalogHit | null>;
```

- Input: normalized ISBN-13.
- Output: `null` if not found; otherwise `BookCatalogHit` (see data-model.md).
- Errors: network/provider errors propagate as typed `CatalogLookupError` for route mapping.

## HTTP: `GET /api/books/lookup`

**Auth**: Session required (same as other `/api/*`).

**Query**: `isbn` (required) — ISBN-10 or ISBN-13.

**Response 200**:

```json
{
  "isbn": "9782070368228",
  "title": "...",
  "author": "...",
  "synopsis": "...",
  "genres": ["..."],
  "publicationYear": 1962,
  "publisher": "...",
  "pageCount": 320
}
```

**Response 404**: `{ "error": "not_found" }`

**Response 400**: invalid ISBN format.

**Caching**: Server checks `catalog_cache` before Open Library; stores on success (X4).

**Client rule**: UI MUST NOT call Open Library directly (X2).
