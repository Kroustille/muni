# Research: Books feature 002

Phase A decisions (§1–7) unchanged from 2026-10-15. Below: **new** decisions for Phases B–D (2026-10-16 planning).

## 1. Catalog provider

- **Decision**: Open Library Search/API by ISBN (`https://openlibrary.org/isbn/{isbn}.json` + works/editions for metadata) and title search (`https://openlibrary.org/search.json`).
- **Rationale**: B1 — no API key; good ISBN coverage; fits X2 server proxy.
- **Alternatives**: Google Books (key, quotas); dual provider (rejected — extra scope).

## 2. Barcode scanning on mobile

- **Decision**: **iOS / PWA**: WASM-based scanner (continuous frames from `getUserMedia`). **Android**: use `BarcodeDetector` when `globalThis.BarcodeDetector` exists, else same WASM path.
- **Rationale**: B2 — iPhone is primary; BarcodeDetector unreliable on iOS Safari.
- **Alternatives**: ZXing-js only (heavier); native-only (fails B2 on iPhone).

## 3. ISBN validation

- **Decision**: Accept ISBN-10 and ISBN-13; normalize to ISBN-13 for storage and cache key; reject checksum failures before network.
- **Rationale**: Reduces junk lookups during continuous scan (B3).

## 4. Metadata localization

- **Decision**: Map Open Library fields to display strings with French preference: use `languages` / `title` variants when present; per-field fallback to English (L4). Application-layer normalizer, not in adapter SQL.
- **Rationale**: Consistent with movies/music features.

## 5. Merge without ISBN (B4)

- **Decision**: When adding by ISBN, if no row has that ISBN, find at most one active manual book where `normalize(title)` matches catalog title AND (`author` empty OR `normalize(author)` matches catalog author). Update that row; if multiple candidates, update none and create new (edge case — rare).
- **Rationale**: B4 without fuzzy magic dialogs.

## 6. Server cache (X4)

- **Decision**: PostgreSQL table `catalog_cache` with `provider`, `cache_key` (ISBN-13), `payload` jsonb, `fetched_at`; TTL 24h in application logic.
- **Rationale**: Reduces Open Library load; shared across users on self-hosted instance acceptable for public metadata.

## 7. Desktop scope (B9)

- **Decision**: Feature-detect mobile viewport + touch OR explicit `useIsMobile` hook used only to show scan/ISBN UI; desktop routes unchanged.
- **Rationale**: Clear product boundary.

---

## 8. Open Library work id (Phase B, FR-B07)

- **Decision**: On ISBN lookup, read `edition.works[0].key` (already fetched in adapter for synopsis). Normalize to **`workId`** string: strip leading `/works/` → e.g. `OL45804W`. Store on book item at catalog upsert. Title search hits **omit** work id until user runs ISBN lookup or full edition fetch (acceptable v1).
- **Rationale**: Matches “one row per edition, grouped by work”; no extra API for grouping when adding by scan.
- **Alternatives**: Separate `catalogWorkId` + `manualWorkGroupId` (rejected — one grouping key is enough); collapse editions into one row (denied in spec).

## 9. Manual work grouping (Phase B)

- **Decision**: User action **« Lier à une édition »** picks another book item in library; both items receive the same `workId` — prefer non-null OL id if either has one, else generate `local:{uuid}` shared by both. Unlink clears `workId` only on selected item if it was `local:*` and siblings remain grouped.
- **Rationale**: No opaque id typing for users; satisfies “manual link otherwise”.
- **Alternatives**: User types work id (rejected — error-prone).

## 10. Tags storage (Phase B)

- **Decision**: `tags: string[]` on item (jsonb), normalized trim + case-fold for dedupe display; max 50 tags per book, max 40 chars each (domain validation).
- **Rationale**: FR-B01; same pattern as `genres` without catalog semantics.
- **Alternatives**: Tag entity table (rejected — YAGNI at scale).

## 11. Series fields (Phase B)

- **Decision**: `seriesName` (text) + `seriesPosition` (numeric, nullable) — allows `2.5` for novellas via decimal; sort by name then position.
- **Rationale**: FR-B02 volume/order without separate series entity.

## 12. Book quotes sync (Phase B, FR-B06)

- **Decision**: Table `book_quotes` with own `fields_updated_at` + soft delete; client sync via **`GET/POST /api/sync/quotes`** with same LWW merge as items (`merge()` reuse). Parent `bookItemId` must reference existing non-deleted book owned by user (server validate on push).
- **Rationale**: Child records sync individually per clarify Q&A; avoids embedding unbounded arrays on `items`.
- **Alternatives**: Quotes embedded in item jsonb (rejected — LWW whole-field conflict); CRDT (denied by constitution).

## 13. Reading activity derivation (Phase D, FR-D02)

- **Decision**: **No `activity_events` table in v1.** A calendar day is active if, for any book item, `fieldsUpdatedAt` for `status`, `pagesRead`, or transition into `read` falls on that day **in the user’s local timezone** (default `Europe/Paris` until user timezone preference exists). Recompute on read for heatmap/streak/goal progress.
- **Rationale**: Clarify session — progress/completion without session timer; constitution simplicity.
- **Alternatives**: Append-only event log (deferred — OD if perf regresses); UTC-only days (rejected — poor UX for French user).

## 14. Reading goals (Phase D)

- **Decision**: Table `reading_goals`: `(user_id, year)` unique, `target_count` integer ≥ 1. Progress = count of books whose **first** transition to `read` in that calendar year (detected via `fieldsUpdatedAt.read` crossing into read status during year, or status `read` with `fieldsUpdatedAt.read` in year).
- **Rationale**: FR-D01 private annual goal; avoids double-counting re-reads if user toggles status (only first finish in year counts unless we add `finishedAt` later).
- **Alternatives**: Store goal on user profile json (rejected — needs sync + validation).

## 15. Private recommendations v1 (Phase C, FR-C03)

- **Decision**: **Rule-based, offline**, no ML: candidate pool = books with status `to_read` or null; score +1 per shared tag with any book marked `read` in last 12 months; +1 per shared genre; +2 if mood matches most recent `read` book with mood set; return top 5, shuffle ties. Hide section when &lt; 3 candidates.
- **Rationale**: “Private” and portable; no external API.
- **Alternatives**: Embeddings / LLM (out of scope v1); collaborative filtering (no multi-user data).

## 16. Mood & pace vocabularies (Phase C)

- **Decision** (proposed — **OD-002-10**): Optional enums stored as string keys, labels in `fr.json`:
  - **Mood**: `joyeux`, `melancolique`, `intense`, `apaisant`, `inspirant`, `sombre`, `drôle`, `romantique`
  - **Pace**: `lent`, `modéré`, `rapide`, `fébrile`
- **Rationale**: Enables FR-C02 filters without unbounded tag chaos.
- **Alternatives**: Free text (harder to filter); single combined “vibe” field (rejected — spec separates mood & pace).

---

## Deferred / v1 limits (2026-10-17 audit)

Honest boundaries for implementers and follow-on work. **Do not** treat completed `tasks.md` rows as implying these are shipped.

| Area | v1 reality |
|------|------------|
| **Reading goals sync** | Annual goals are read/written via **IndexedDB** (`reading-goal-repository`). PostgreSQL `reading_goals` exists (migration `0010`) but goals are **not** included in item/quote sync push/pull yet — **local-only goals v1**; a second device will not converge goal targets until dedicated routes land. |
| **Activity events** | Heatmap/streak derive from `fieldsUpdatedAt` / status (§13); no append-only `activity_events` table. |
| **Work id on title search** | Title-search catalog hits may omit `workId` until ISBN/edition fetch (§8). |

---

## 17. Catalog coverage & fallback providers (2026-10-28)

**Full index parse (26 Books APIs)**: [`docs/public-apis-books-films-investigation-2026-10-28.md`](/cursor/stores/self/docs/public-apis-books-films-investigation-2026-10-28.md).

**Research index**: [public-apis/public-apis](https://github.com/public-apis/public-apis) is **not** integrated at runtime — it is a **curated link catalog** used here to discover HTTPS APIs in the **Books** and **Video** sections. Each candidate below is evaluated for Muni: **French UI** (metadata or labels usable in FR-first copy), **offline-first** (manual add always; network only for server-proxied lookup per X2/X3), **API keys**, **HTTPS**, and **ToS** fit for a self-hosted companion (no scraping, no client-side keys).

**Baseline (shipped)**: **Open Library** — ISBN + title search via `open-library/book-catalog-lookup.ts`; server `catalog_cache`; client never calls third parties (X2). **MusicBrainz** serves **004**, not books.

**Problem**: Missing or weak titles — obscure FR editions, slow OL updates, noisy title-only queries, scan/ISBN edge cases.

### Candidates from public-apis **Books** (and close industry peers)

| Provider | public-apis entry | Auth | HTTPS | CORS (browser) | FR / metadata | Muni fit | Recommendation |
|----------|-------------------|------|-------|----------------|---------------|----------|----------------|
| **Open Library** | [Open Library](https://openlibrary.org/developers/api) — “Books, book covers…” | No | Yes | No (server OK) | Uneven FR; EN fallback per L4 | **Primary** — no key, aligns B1/X2 | **Keep baseline** |
| **Google Books** | [Google Books](https://developers.google.com/books/) | OAuth / API key | Yes | Unknown | Good volume; FR via `langRestrict` | Server proxy; quota ~1k/day typical | **P2 fallback** when OL empty |
| **Crossref** | [Crossref Metadata Search](https://github.com/CrossRef/rest-api-doc) | No | Yes | Unknown | Scholarly; weak consumer FR fiction | DOI/ISBN academic | **Defer** — wrong corpus for Valentin library |
| **Gutendex** | [Gutendex](https://gutendex.com/) | No | Yes | Unknown | Public domain only | No modern ISBN library | **Reject** for catalog add |
| **British National Bibliography** | Listed; **HTTP only** | No | **No** | Unknown | UK biblio | HTTPS violation for Muni | **Reject** |
| **ISBNdb** | *Not listed* in public-apis Books table (2026-10) | apiKey | Yes | — | ISBN-centric; commercial ToS | Paid tiers; good ISBN hit rate | **P3 optional** if OL+Google still miss scans — evaluate ToS/cost separately |

Other Books rows (religious corpora, Harry Potter trivia APIs, KDP niche tools) are **out of scope** for Muni’s general reading library.

### Recommended strategy (unchanged intent, clearer sourcing)

| Priority | Provider | Role |
|----------|----------|------|
| **Primary** | Open Library | ISBN + title; 24h server cache |
| **Fallback P2** | Google Books (public-apis Books) | Chained server lookup after OL miss; map to `BookCatalogHit` |
| **Fallback P3 (optional)** | ISBNdb (outside public-apis index) | ISBN-only backfill for scan flow if product accepts paid key |
| **Always** | Manual add | Offline; title-only OK (B8) |

**P1 (search quality, no new provider)**: Query normalization (accents, articles); ISBN-13 retry; merge heuristics; empty → manual (B10).

**P2 (implementation)**: Single search UI; `BookCatalogLookup` chain OL → Google Books; optional `googleVolumeId` on item for refresh. Keys in env only (`GOOGLE_BOOKS_API_KEY`).

**FR**: [spec.md](spec.md) § Catalog search improvements (2026-10-28).
