# Contract: Book catalog lookup API

## Port: `BookCatalogLookup`

```typescript
lookupByIsbn(isbn: string): Promise<BookCatalogHit | null>;
searchByTitle(query: string, limit?: number): Promise<BookCatalogHit[]>;
```

- `lookupByIsbn` input: normalized ISBN-13.
- `searchByTitle` input: free-text title query; optional `limit` (default 20, max 20). Each hit includes `isbn` when Open Library provides one.
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

## HTTP: `GET /api/books/search`

**Auth**: Session required.

**Query**: `q` (required) — title search string; optional `limit`.

**Response 200**:

```json
{
  "results": [
    {
      "isbn": "9782070368228",
      "title": "...",
      "author": "..."
    }
  ]
}
```

**Response 400**: `{ "error": "missing_query" }`

**Response 502**: provider error.

**Caching**: Server caches search result arrays under `open_library` key `search:{normalizedQuery}:{limit}` (X4).

**Client rule**: UI MUST NOT call Open Library directly (X2).
