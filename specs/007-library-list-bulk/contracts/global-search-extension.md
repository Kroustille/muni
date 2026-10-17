# Contract: Global search index extension

**Use case**: `createSearchUseCase` in `src/application/search.ts`

## Indexing

On rebuild from `repository.query()`:

- Always index `normalizedTitle`.
- For `item.type === "book"`: also index `normalizeText(item.author ?? "")`.
- For `item.type === "movie"`: also index `normalizeText(item.director ?? "")`.
- Other types: title only (unchanged behavior).

## Query

- Empty normalized query → return `[]` (unchanged).
- Non-empty: include item if query substring matches **any** indexed field for that item.

## Tests

- Unit tests in `tests/unit/search-use-case.test.ts` (or new file): author-only and director-only matches; title behavior unchanged.

## Non-goals

- Postgres full-text.
- Weighted ranking title vs author (optional future).
