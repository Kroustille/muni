# Implementation Plan: Films & TV — library, catalog, and insights

**Branch**: `003-films-tv-library` (work continues on `main`) | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-films-tv-library/spec.md`

**Build order (X1)**: Phase **A** is **shipped** on `main` (T301–T320). Implement **Phases B → C → D** (this plan) before expanding **004** (music). Feature **002** (books) precedes **003** per X1.

**Task band**: Phase A used **T301–T320**. Phases B–D implementation tasks start at **T343+** (see `tasks.md`).

## Summary

**Phase A (done)**: Server-proxied Wikidata title search for films and séries, preview-and-confirm, silent `imdbId` dedupe/merge/restore, director + cast on catalog path, catalog vs personal rating.

**Phase B — Library**: Tags; **franchise / saga** grouping with watch order; film statuses (`to_watch`, `watched`, `paused`) and série statuses including **`in_progress` (En cours)**; optional **watch date** on **vu**; **movie quotes** as synced child entities; **per-episode vu** nested under série items; **next episode** + **release reminders**.

**Phase C — Discovery**: Optional **mood** and **pace**; filters on tags, mood, pace, **film vs série**; **where to watch** when provider returns data; **private** recommendations v1 (rule-based, local only).

**Phase D — Insights**: Annual **watch goal** (private), **streak** + **activity heatmap** from **watch activity days** (no timer), stats breakdowns, year-in-review — derived from items, episode progress, goals.

Architecture stays **hexagonal**, **offline-first**, **French UI**, **per-field LWW** on items and quote rows. Reuse book patterns: `src/application/books/*` → parallel `src/application/movies/*` where sensible.

## Technical Context

**Language/Version**: TypeScript 5.x, Node 22, Next.js 15 (existing stack)

**Primary Dependencies**: Wikidata Query Service (Phase A, shipped); optional streaming/episode enrichment behind server proxy (Phase C/B — see research.md)

**Storage**:
- **Items** (`items` / IndexedDB): extend movie columns for B/C fields; extend movie `status` enum (`paused`, `in_progress` for series)
- **Episode progress**: nested jsonb on série item **or** `movie_episode_progress` child rows (see data-model.md — prefer jsonb map v1 for offline simplicity)
- **Movie quotes**: `movie_quotes` table + IndexedDB store; sync channel like book quotes
- **Watch goals**: `watch_goals` table (year + target) + local mirror
- **Insights**: derive activity days from `fieldsUpdatedAt` + status / episode vu events (FR-D02)

**Testing**: Vitest (domain, use cases, quote sync, watch activity); Playwright for episode mark + heatmap smoke per quickstart.md

**Target Platform**: PWA mobile + desktop parity for B–D (catalog search already all devices)

**Constraints**: X2 server proxy for catalog and provider lookups; library/insights offline; no analytics; no ML recommendations v1; integer 1–5 stars; **no En cours on films**

**Scale/Scope**: One user; hundreds of films/séries; dozens of episodes per série

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-first | Pass | Tags, pause, episodes, quotes, goals offline; streaming hints optional online |
| II. Capture speed | Pass | Title-only manual add unchanged |
| III. Typed lists | Pass | Movie-only fields; quotes scoped to `type=movie` parent |
| IV. Simplicity | Pass | LWW; recommendations deterministic; activity derived |
| V. Privacy | Pass | Goals, streaks, recs private |
| VI. Portable backend | Pass | Postgres migrations; ports for quotes + goals |
| VII. Hexagonal | Pass | `MovieQuoteRepository`, `WatchGoalRepository`, `WatchActivity` derive |

## Phased implementation outline

### Phase A — Catalog (shipped)

T301–T320 on `main`: search, entity fetch, dedupe, offline manual add, e2e catalog search.

### Phase B — Library (T343+)

1. Migration: tags, franchise id/name/order, `watchedAt`, mood/pace placeholders if not C-only, episode progress blob, director persisted (already partial from A)
2. Status UX: films never show **En cours**; séries show **En cours** / **En pause** / **À voir** / **Vu**
3. Franchise UI: group list rows; optional order index
4. Episodes: season/episode grid; mark **épisode vu**; compute **next episode**
5. Reminders: local notifications for next air date when catalog provides (PWA permission)
6. Quotes + notes: mirror book quote sync

### Phase C — Discovery (T3xx band after B stable)

Mood/pace pickers, combined filters, streaming panel on detail (cached server response), private recommendations port.

### Phase D — Insights (T3xx)

Watch goals repo, `deriveWatchActivityDays`, insights page under movies route, stats + year-in-review.

## Open decisions (defaults in research.md)

| ID | Topic | Default |
|----|--------|---------|
| OD-003-1 | Episode storage | `episodeProgress: Record<"S{season}E{episode}", { watchedAt? }>` on série item jsonb |
| OD-003-2 | Franchise key | `franchiseId` uuid shared by user-assigned group + optional `franchiseOrder` number |
| OD-003-3 | Streaming provider | Server route `GET /api/movies/streaming?imdbId=` stub → empty until provider chosen |
| OD-003-4 | Mood/pace vocab | Same controlled keys as books (research.md §16 books) unless FR copy differs |
| OD-003-5 | Série “Vu” | All episodes marked vu OR user explicit “Marquer la série comme vue” |
| OD-003-6 | Catalog fallback (2026-10-28) | **Settled** — Wikidata primary; **TMDB** P2 search fallback; optional **OMDb** enrichment; research.md §18, tasks T401–T406 |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Child quote sync | FR-B07 | Inline json array breaks per-quote LWW |
| Episode map on item | FR-B08 | Separate episode rows explode list model user denied |

## Artifacts

| Artifact | Path |
|----------|------|
| Data model | [data-model.md](data-model.md) |
| Research | [research.md](research.md) |
| Quickstart | [quickstart.md](quickstart.md) |
| Contracts | [contracts/](contracts/) |
