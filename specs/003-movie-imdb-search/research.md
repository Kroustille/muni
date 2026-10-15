# Research: Movie catalog search (003)

## 1. Provider (M1)

- **Decision**: Wikidata — title search via `wbsearchentities` and/or SPARQL for films (`instance of` film) and television series (`instance of` television series), read `P345` (IMDb ID), `P57` ignored (N2), ratings from `P444` when present.
- **Rationale**: Keyless, legal, FR labels via `?item rdfs:label@fr`.
- **Alternatives**: OMDb/TMDB (keys); IMDb official API (licensing).

## 2. Media kinds (M2)

- **Decision**: `mediaKind`: `film` vs `series`; filter out seasons/episodes in mapper.
- **Rationale**: One row per series.

## 3. Disambiguation (M3)

- **Decision**: Return up to 20 hits; UI list required selection; no default first hit.
- **Rationale**: M3.

## 4. Catalog rating (M4)

- **Decision**: Store `catalogRating` as number 0–10 when Wikidata provides; display read-only; never map to `rating` (1–5).
- **Rationale**: L5, M4.

## 5. Merge manual rows (M6)

- **Decision**: When `imdbId` absent, match normalized title (+ optional year if both sides have year) before create; same pattern as books 002.
- **Rationale**: M6 / B4 parity.

## 6. Cache (X4)

- **Decision**: Reuse `catalog_cache` with provider `wikidata`; TTL 24h; separate keys for search queries and entity QIDs.
- **Rationale**: Shared infrastructure with 002.

## 7. Rate limiting

- **Decision**: Server-side debounce not required; cache reduces load; polite `User-Agent` on Wikidata requests.
- **Rationale**: Self-hosted single user.
