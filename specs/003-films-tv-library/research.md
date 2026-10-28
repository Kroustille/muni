# Research: Movie catalog search (003)

## 1. Provider (M1)

- **Decision**: Wikidata — title search via `wbsearchentities` and/or SPARQL for films (`instance of` film) and television series (`instance of` television series), read `P345` (IMDb ID), `P57` ignored (N2), ratings from `P444` when present.
- **Rationale**: Keyless, legal, FR labels via `?item rdfs:label@fr`.
- **Alternatives**: OMDb/TMDB (keys); IMDb official API (licensing).

## 2. Media kinds (M2) — updated 2026-10-16

- **Decision**: `mediaKind`: `film` vs `series` on the **library row**. Catalog search still returns series/film entities only (not episode rows). **Episode tracking** is nested on the série item (`episodeProgress` map).
- **Rationale**: Product walkthrough denied “one row per series only” without episodes; search UX unchanged (FR-003).

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

---

## 8. Franchise grouping (Phase B)

- **Decision**: User assigns `franchiseName` + shared `franchiseId` (uuid) across titles; optional `franchiseOrder` for watch order hints in list/detail.
- **Rationale**: FR-B02; no custom lists feature.

## 9. En cours scope (Phase B)

- **Decision**: `in_progress` status only when `mediaKind === 'series'`. Films use `to_watch` | `watched` | `paused` only.
- **Rationale**: Clarify session 2026-10-16.

## 10. Watch date (Phase B)

- **Decision**: On transition to `watched`, default `watchedAt` to local today; user may edit or clear.
- **Rationale**: FR-B05; episode vu may set per-episode `watchedAt` inside `episodeProgress`.

## 11. Episode progress storage (Phase B)

- **Decision**: Jsonb map on série item: keys `S{season}E{episode}` → `{ watchedAt?: ISO date }`. Catalog may seed episode list from Wikidata when available; manual episode keys allowed.
- **Rationale**: OD-003-1; avoids list-row-per-episode.

## 12. Next episode + reminders (Phase B)

- **Decision**: Recompute `nextEpisodeKey` on progress write; optional Web Push / local notification when `airDate` known for next unaired episode (permission-gated).
- **Rationale**: FR-B09; details in `contracts/movie-library-ui.md`.

## 13. Movie quotes sync (Phase B)

- **Decision**: Mirror `book_quotes` — separate table, push/pull routes, per-quote LWW.
- **Rationale**: FR-B07 parity with books.

## 14. Mood / pace vocab (Phase C)

- **Decision**: Reuse books controlled keys (`calm`, `intense`, … — see `002-books-library/research.md` §16) for consistency.
- **Rationale**: OD-003-4.

## 15. Streaming availability (Phase C)

- **Decision**: Server proxy endpoint; cache by `imdbId`; empty array when no provider configured (FR-C04 honest empty state).
- **Rationale**: OD-003-3; no client-side API keys.

## 16. Watch activity days (Phase D)

- **Decision**: Same derivation pattern as books `reading-activity.ts` but sources are movie status changes, `watchedAt`, and episode progress updates (FR-D02).
- **Rationale**: Clarify session 2026-10-16.

## 17. Watch goals (Phase D)

- **Decision**: `watch_goals` table analogous to `reading_goals`; count finishes in calendar year using `watchedAt` on films and série-level `watched` status.
- **Rationale**: FR-D01 private goal.

---

## Deferred / v1 limits (2026-10-17 audit)

Honest boundaries for implementers and follow-on work. **Do not** treat completed `tasks.md` rows as implying these are shipped.

| Area | v1 reality |
|------|------------|
| **Streaming availability** | Port `StreamingAvailabilityLookup` with **no-op adapter** v1; `lookupMovieStreaming` caches adapter results (empty until a real provider is wired). `GET /api/movies/streaming` exists; UI **Où regarder** shows the honest empty state (OD-003-3). |
| **Watch goals sync** | Same pattern as books: goals live in **IndexedDB**; `watch_goals` on Postgres is not on sync push/pull yet — **local-only goals v1**. |
| **Episode progress e2e** | Episode mark/next-key logic is covered by **unit** tests (`movie-episode-progress.test.ts`, domain validation). There is **no** Playwright scenario for série detail → mark **épisode vu** → next episode (gap vs FR-B09 manual quickstart). |

---

## 18. Catalog coverage & fallback providers (2026-10-28)

**Full index parse (58 Video APIs + Entertainment/Anime notes)**: [`docs/public-apis-books-films-investigation-2026-10-28.md`](/cursor/stores/self/docs/public-apis-books-films-investigation-2026-10-28.md).

**Research index**: [public-apis/public-apis](https://github.com/public-apis/public-apis) is used **only to discover** candidate APIs — **Video** section plus **Open Source Data** ([Wikidata](https://www.wikidata.org/w/api.php?action=help)). No runtime dependency on that repository.

**Baseline (shipped)**: **Wikidata** — `wikidata/movie-catalog-search.ts`; FR labels via `rdfs:label@fr`; `imdbId`, optional `P444`; server cache (§6).

**Problem**: Missing titles — sparse Q-items, generic French title collisions, incomplete série episode seeds.

### Candidates from public-apis **Video** (+ Wikidata)

| Provider | public-apis entry | Auth | HTTPS | CORS | FR / metadata | Muni fit | Recommendation |
|----------|-------------------|------|-------|------|---------------|----------|----------------|
| **Wikidata** | Open Source Data (not Video table) | OAuth optional | Yes | — | Strong `@fr` labels (M1) | Keyless; legal | **Keep baseline** |
| **TMDb** | [TMDb](https://www.themoviedb.org/documentation/api) — “Community-based movie data” | apiKey | Yes | Unknown | FR `language=fr-FR`; posters (we skip images L3) | Industry standard search | **P2 fallback search** |
| **Open Movie Database** | [Open Movie Database](http://www.omdbapi.com/) | apiKey | Yes | Unknown | EN-first; IMDb id lookup | Best after `imdbId` known | **P2 enrichment** (synopsis/rating), not primary search |
| **IMDb-API** | [IMDb-API](https://imdb-api.com/) | apiKey | Yes | Unknown | Third-party IMDb mirror | Licensing unclear vs official | **Defer** — prefer Wikidata/TMDB |
| **TVDB** | [TVDB](https://thetvdb.com/api-information) | apiKey | Yes | Unknown | Strong **série** episode metadata | Episode seed for FR-B08 | **P3 optional** — episode list enrichment only |
| **TVMaze** | [TVMaze](https://www.tvmaze.com/api) — index lists HTTP | No | Yes (use `api.tvmaze.com`) | Yes | EN-first TV metadata | IMDb lookup; episode lists; CC BY-SA | **P2 optional** — série episode seed only; server HTTPS |
| **Watchmode** | [Watchmode](https://api.watchmode.com/) | apiKey | Yes | Unknown | Streaming regions | Phase C streaming port | **Phase C** — `WATCHMODE_API_KEY`; not catalog search |
| **Trakt / Simkl** | Video — social tracking | apiKey | Yes | Mixed | User-centric, not catalog-first | Wrong product shape | **Reject** for catalog MVP |

Niche Video APIs (Breaking Bad quotes, SWAPI, etc.) are **not** general film/série catalog sources.

### Recommended strategy

| Priority | Provider | Role |
|----------|----------|------|
| **Primary** | Wikidata | Title search; film vs series; IMDb id |
| **Fallback P2** | TMDb (public-apis Video) | Server search when Wikidata &lt; threshold hits; map to `MovieSearchHit`; optional `tmdbId` on item |
| **Enrichment P2** | OMDb (public-apis Video) | Given `imdbId`, optional extra fields — cache by id; respect daily quota |
| **Enrichment P3 (optional)** | TVDB | Episode catalog seed for séries when Wikidata incomplete |
| **Enrichment P3 (optional)** | TVMaze | Episode seed + `lookup?imdb=` when TVDB/TMDB episode data thin |
| **Phase C** | Watchmode | Streaming availability (`§15`) |
| **Always** | Manual add | Offline title-only (M7) |

**P1**: Wikidata query tuning (`language=fr`, entity types); empty state; manual merge (M6).

**P2**: Composite `MovieCatalogSearch` port: Wikidata → TMDB → unified preview; keys server-side (`TMDB_API_KEY`, optional `OMDB_API_KEY`).

**FR**: [spec.md](spec.md) § Catalog search improvements (2026-10-28).
