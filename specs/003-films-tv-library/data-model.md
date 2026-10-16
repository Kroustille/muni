# Data Model: Movie catalog search (003)

## Movie item extensions (`type = movie`)

| Field | Type | Rules |
|-------|------|-------|
| `imdbId` | text null | Format `tt\d+` when set; dedupe key |
| `synopsis` | text null | |
| `releaseYear` | smallint null | |
| `catalogRating` | numeric null | 0–10 display scale; not personal `rating` |
| `mediaKind` | text null | `film` \| `series` |

Existing: `title`, `status`, `rating` (1–5 personal), `recommendedBy`, `notes`.

## DTOs

- **MovieSearchHit**: `{ wikidataId, title, releaseYear?, imdbId?, mediaKind, catalogRating? }`
- **MovieCatalogDetail**: extends hit with `synopsis?` for preview

## State transitions

- Upsert by `imdbId` or merge manual per research.md; soft-delete restore on same `imdbId` (M5).
