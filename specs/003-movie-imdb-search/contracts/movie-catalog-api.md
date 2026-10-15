# Contract: Movie catalog API

## Port: `MovieCatalogSearch`

```typescript
searchByTitle(query: string, limit?: number): Promise<MovieSearchHit[]>;
getDetail(wikidataId: string): Promise<MovieCatalogDetail | null>;
```

## HTTP

### `GET /api/movies/search?q=`

Session required. Returns `{ results: MovieSearchHit[] }` max 20.

### `GET /api/movies/entity?id=Q...`

Session required. Returns `MovieCatalogDetail` or 404.

Caching via `catalog_cache` (provider `wikidata`). Client MUST NOT call Wikidata directly.
