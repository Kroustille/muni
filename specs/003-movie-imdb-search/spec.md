# Feature Specification: Movie catalog search (Wikidata / IMDb id)

**Feature Branch**: `003-movie-imdb-search`

**Created**: 2026-10-15

**Status**: Draft

**Input**: Extend movies list and quick-add with title search against a keyless catalog via the server, user picks one result, preview all fields editable, save with silent `imdbId` dedupe. Feature films and TV series (one row per series).

**Depends on**: Muni v1 (`001`); **implement after feature 002 complete (X1)**.

## Clarifications

### Session 2026-10-15

- **M1:** Prefer **keyless** catalog (e.g. **Wikidata** title search, French labels, optional `imdbId`, synopsis, rating when present). No OMDb/TMDB/official IMDb APIs requiring keys in v1; one server env key only as last resort, never in client.
- **M2:** Feature films **and TV series** (one list row per series); not episodes.
- **M3:** User **picks one row** from search results (required).
- **M4:** Show **catalog score** read-only (e.g. /10); separate from personal 1–5 when watched.
- **M5:** Soft-deleted movie with same `imdbId` → **restore** and refresh catalog metadata.
- **M6:** Merge/update **manual** movie when user picks catalog result matching title (like B4 books).
- **M7:** **Title only** required on add.
- **M8:** **All imported fields editable** on preview before save.
- **M9:** **Single title field**; French first / English fallback per field (no separate original-title column).
- **L1–L5 (locked):** Silent `imdbId` dedupe; title-only search; no covers; FR-then-EN metadata; personal rating separate from catalog score.
- **N2:** No director field in v1.
- **N4:** Search on **movies list** and **movie quick-add**.
- **X2–X4:** Server proxy; online lookup only; server cache short TTL.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search and add from catalog (Priority: P1)

User opens movies list or movie quick-add, searches by title, sees disambiguated results (films and series), picks one row, previews metadata (title, synopsis, year, catalog rating, `imdbId`), edits any field, and saves.

**Independent Test**: Search "Dune", pick a result, save; item appears with `to_watch` default.

**Acceptance Scenarios**:

1. **Given** movies list, **When** user searches and selects a result, **Then** preview shows catalog fields (M8).
2. **Given** multiple hits, **When** results display, **Then** user must pick one (M3) — no auto-select.
3. **Given** TV series hit, **When** saved, **Then** one list row represents the series (M2).

---

### User Story 2 - Silent dedupe, merge, restore (Priority: P1)

Same `imdbId` updates existing row or restores soft-deleted row without warning. Manual movie without `imdbId` can merge when user picks matching catalog entry (M6).

**Independent Test**: Add manual "Dune", search and pick catalog same title → one row with `imdbId`; delete and re-add via search → restored.

---

### User Story 3 - Catalog rating display (Priority: P2)

When watched, personal 1–5 rating remains separate; catalog score shown as read-only metadata on detail (M4).

---

### User Story 4 - Offline and failure (Priority: P2)

Lookup requires network (X3). On failure, user can still add movie manually with title only (M7).

---

### Edge Cases

- Wikidata hit without `imdbId`: still allow add; dedupe by `imdbId` only when present.
- No French label: English title per M9.
- Empty search / no results: clear empty state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Movies list and movie quick-add MUST offer catalog search (N4).
- **FR-002**: Search MUST use server proxy only (X2).
- **FR-003**: Results MUST include films and TV series, not episodes (M2).
- **FR-004**: User MUST select exactly one result before preview (M3).
- **FR-005**: Preview MUST allow editing all imported fields (M8).
- **FR-006**: Store `imdbId` when available; silent dedupe and restore per M5, L1.
- **FR-007**: Store optional `synopsis`, `releaseYear`, `catalogRating` (numeric /10 display).
- **FR-008**: Title required; other fields optional (M7).
- **FR-009**: Metadata FR-first, EN fallback per field (M9, L4).
- **FR-010**: No cover images (L3); no director (N2).
- **FR-011**: Server caches search and entity payloads (X4).

### Key Entities

- **Movie item** extensions: `imdbId`, `synopsis`, `releaseYear`, `catalogRating`, `mediaKind` (`film` | `series`).

## Success Criteria *(mandatory)*

- **SC-001**: User adds a film from search in under 90 seconds with network.
- **SC-002**: Zero duplicate rows for same `imdbId` in acceptance tests.
- **SC-003**: Catalog rating never overwrites personal rating field.

## Out of Scope

- Episodes; IMDb scraping; client-side Wikidata; director field; cover art.
