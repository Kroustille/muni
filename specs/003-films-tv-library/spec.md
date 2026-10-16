# Feature Specification: Films & TV — library, catalog, and insights

**Feature directory**: `specs/003-films-tv-library/`

**Feature Branch**: `003-films-tv-library`

**Created**: 2026-10-15

**Status**: Draft (Phase A specified here; Phases B–D specified; implementation pending)

**Input**: Personal films and TV library in Muni: **catalog capture** (title search, manual add), **library richness** (tags, franchise/saga grouping, **en cours** for series, **en pause**, optional watch date when **vu**, episode-level **épisode vu**, next-episode progress and release reminders, private notes, quotes), **discovery** (mood/pace, private recommendations, filters, **where to watch**), and **insights** (annual goal, streaks, heatmap, stats, year-in-review). French UI; private-by-default; offline-first with sync.

**Depends on**: Muni v1 (`001-typed-lists-companion`) movies list and quick-add; **implement after feature 002 complete (X1)**.

## Product scope (phased)

| Phase | Theme | Status |
|-------|--------|--------|
| **A — Catalog** | Title search, manual add, dedupe/merge, Wikidata via server, director & cast from catalog | Specified; pending plan |
| **B — Library** | Tags, franchise/saga + watch order, **en cours** (series), **en pause**, watch date on **vu**, notes, quotes, **épisode vu**, next episode + reminders | Specified; pending plan |
| **C — Discovery** | Mood & pace, private recommendations, filters (tags, mood, film vs série), streaming availability | Specified; pending plan |
| **D — Insights** | Annual watch goal, streaks, activity heatmap, stats breakdowns, year-in-review | Specified; pending plan |

## Clarifications

### Session 2026-10-15

- **M1:** Prefer **keyless** catalog (e.g. **Wikidata** title search, French labels, optional `imdbId`, synopsis, rating when present). No OMDb/TMDB/official IMDb APIs requiring keys in v1; one server env key only as last resort, never in client.
- **M3:** User **picks one row** from search results (required).
- **M4:** Show **catalog score** read-only (e.g. /10); separate from personal 1–5 when **vu**.
- **M5:** Soft-deleted title with same `imdbId` → **restore** and refresh catalog metadata.
- **M6:** Merge/update **manual** entry when user picks catalog result matching title (like B4 books).
- **M7:** **Title only** required on add.
- **M8:** **All imported fields editable** on preview before save.
- **M9:** **Single title field**; French first / English fallback per field (no separate original-title column).
- **L1–L5 (locked):** Silent `imdbId` dedupe; title-only app search; no covers; FR-then-EN metadata; personal rating separate from catalog score.
- **N4:** Search on **movies list** and **movie quick-add** (films and séries).
- **X2–X4:** Server proxy; online lookup only; server cache short TTL.

**Superseded by Session 2026-10-16 (do not implement as written):**

- ~~**M2:** One list row per series only; not episodes.~~ → **Episode-level TV tracking** (see Session 2026-10-16).
- ~~**N2:** No director field in v1.~~ → **Director** from catalog, editable (see Session 2026-10-16).

### Session 2026-10-16 (product walkthrough — encoded decisions)

**Accepted for films & TV**

- Catalog: **title catalog search** (films + séries); **manual** entry offline (title-only OK); **“already in library”** indicator at catalog pick; silent **`imdbId` dedupe / merge / restore**; **director** (catalog + editable); **cast** on detail (read-only from catalog).
- Library: free-form **tags** (not custom lists); **franchise / saga grouping** with suggested **watch order**; **`en cours`** for **séries only** (actively watching — not for standalone films); **`en pause`** (set aside, may resume); **watch date** auto-set when marked **vu**, editable, **optional**; **private notes**; **quotes & memorable lines** as synced **child records** per title; **episode-level tracking** inside a série (**épisode vu** per episode); **next-episode progress** and **release reminders** as first-class.
- Discovery: **mood & pace** (or tone) metadata; **private** personalized recommendations; **discovery filters** on tags, mood, and film vs série; **streaming availability** (“where to watch”).
- Insights: **annual watch goal** (films/séries finished, private); **watch streak** + **activity heatmap** (streak private, optional — no guilt); **stats breakdowns** and **year-in-review** recap (private).

**Denied (films & TV)**

- Custom lists/collections (use tags); **one row per series only** with no episode tracking; **format flags** (cinéma / stream / disc); **rewatch count** on same row; **dated viewing diary** (multiple logs per title); **lending** for physical media; **fractional** star ratings; **public / separate reviews**; **content-warning** tags.

**Later / not in this spec**

- Letterboxd / Trakt / CSV **import** (low priority).

### Session 2026-10-16 (clarify Q&A)

- **Q:** How should TV progress work vs films? → **A:** **Films** use list status **à voir** / **vu** (and **en pause**). **Séries** add **`en cours`** while actively watching; user marks individual **épisodes vus** inside the série detail. A série row remains one library item; episode state is nested, not separate list rows per episode.
- **Q:** What replaces old “one row per series only”? → **A:** One **série** item with **per-episode** watched flags (and season/episode identity from catalog when available); films remain one row per film.
- **Q:** When is **watch date** set? → **A:** Default to “today” when user marks **vu** (film) or marks an **épisode vu** / completes série per product rules in plan; user may clear or edit date; field stays optional.
- **Q:** What counts as **watch activity** for heatmap and streaks? → **A:** A calendar day counts if the user logs **any watch progress or completion** that day: status change (e.g. to/from **en cours**, **en pause**, or **vu**), marking **épisode vu**, or marking a film **vu** — no session timer.
- **Q:** **En cours** scope? → **A:** **Séries only**; standalone films MUST NOT use **en cours** (use **à voir** / **vu** / **en pause**).

## User Scenarios & Testing *(mandatory)*

### Phase A — Catalog (specified, not yet implemented)

### User Story 1 - Search and add from catalog (Priority: P1)

User opens movies list or movie quick-add, searches by title, sees disambiguated results (films and séries), picks one row, previews metadata (title, synopsis, year, catalog rating, director, cast when present, `imdbId`), edits any field, and saves. If the title is already in the library, the UI shows **already in library** before or at pick (no duplicate flow).

**Independent Test**: Search "Dune", pick a result, save; item appears with `to_watch` default and catalog fields populated.

**Acceptance Scenarios**:

1. **Given** movies list, **When** user searches and selects a result, **Then** preview shows catalog fields (M8), including **director** when catalog provides it.
2. **Given** multiple hits, **When** results display, **Then** user must pick one (M3) — no auto-select.
3. **Given** a result already in library (same `imdbId` or merge match), **When** user views search results, **Then** **already in library** is visible on that row.
4. **Given** saved film, **When** user opens detail, **Then** **cast** is shown read-only when catalog provided it.

---

### User Story 2 - Silent dedupe, merge, restore (Priority: P1)

Same `imdbId` updates existing row or restores soft-deleted row without warning. Manual entry without `imdbId` can merge when user picks matching catalog entry (M6).

**Independent Test**: Add manual "Dune", search and pick catalog same title → one row with `imdbId`; delete and re-add via search → restored.

**Acceptance Scenarios**:

1. **Given** an active item with `imdbId` I, **When** user picks catalog row with I and confirms, **Then** the same row is updated and no second row appears.
2. **Given** soft-deleted item with `imdbId` I, **When** user picks I from search, **Then** item is restored and catalog fields refresh.

---

### User Story 3 - Catalog rating vs personal rating (Priority: P2)

When **vu**, personal integer **1–5** rating remains separate; catalog score shown as read-only metadata on detail (M4).

---

### User Story 4 - Offline and failure (Priority: P2)

Lookup requires network (X3). On failure, user can still add film or série manually with title only (M7).

---

### Phase B — Library (specified, not yet implemented)

**User Story 5 — Tags and franchise grouping (P1)**  
User assigns free-form tags; groups titles in a **franchise / saga** with optional **watch order** hints; filters list by tag or franchise.

**User Story 6 — En cours, en pause, and vu (P1)**  
For a **série**, user sets **En cours** while watching, **En pause** when set aside, or marks the série **vu** when finished. For a **film**, user uses **à voir**, **vu**, or **En pause** — never **En cours**. Optional **watch date** is set when marking **vu** (editable, may be cleared).

**User Story 7 — Episode tracking and next episode (P1)**  
Inside a série, user marks **épisode vu** per episode (season/episode from catalog when available). App surfaces **next episode** to watch and MAY notify on **release reminders** for upcoming episodes (first-class UX, details in plan).

**User Story 8 — Notes and quotes (P2)**  
User keeps private notes on the title and adds multiple **quote** records (line text, optional context), each synced as its own child of the movie item.

### Phase C — Discovery (specified, not yet implemented)

**User Story 9 — Mood, pace, filters, and where to watch (P2)**  
User sets mood/pace (or tone); filters browse by tags, mood, and **film vs série**; sees **where to watch** (streaming availability) when catalog/provider supplies it.

**User Story 10 — Private recommendations (P3)**  
App suggests titles from the user’s own library patterns (no social feed).

### Phase D — Insights (specified, not yet implemented)

**User Story 11 — Goals, streaks, and heatmap (P2)**  
User sets an annual films/séries-finished goal, sees optional private streak and activity heatmap driven by **progress or completion events** per calendar day.

**User Story 12 — Stats and year-in-review (P3)**  
User opens stats (per month, tags, directors, film vs série) and an optional private year-in-review recap.

---

### Edge Cases

- Wikidata hit without `imdbId`: still allow add; dedupe by `imdbId` only when present.
- No French label: English title per M9.
- Empty search / no results: clear empty state.
- Série with incomplete episode catalog: user can still mark episodes manually (plan defines minimal identity).
- Streaming availability unavailable for a region or title: hide or show honest empty state; MUST NOT block save.

## Requirements *(mandatory)*

### Functional Requirements

**Phase A — Catalog**

- **FR-001**: Movies list and movie quick-add MUST offer catalog search (N4).
- **FR-002**: Search MUST use server proxy only (X2).
- **FR-003**: Results MUST include **films and TV séries** (not individual episodes as separate search rows).
- **FR-004**: User MUST select exactly one result before preview (M3).
- **FR-005**: Preview MUST allow editing all imported fields (M8), including **director**.
- **FR-006**: Store `imdbId` when available; silent dedupe and restore per M5, L1.
- **FR-007**: Store optional `synopsis`, `releaseYear`, `catalogRating` (numeric /10 display), **director**, and **cast** (read-only on detail after save).
- **FR-008**: Title required; other fields optional (M7).
- **FR-009**: Metadata FR-first, EN fallback per field (M9, L4).
- **FR-010**: No cover images (L3).
- **FR-011**: Server caches search and entity payloads (X4).
- **FR-012**: Catalog pick flow MUST surface **already in library** for matching rows.
- **FR-013**: Personal integer **1–5** rating MUST remain separate from catalog score (M4, L5).

**Phase B — Library**

- **FR-B01**: Titles MUST support user-defined **tags**; MUST NOT implement custom lists/collections.
- **FR-B02**: Titles MAY belong to a **franchise / saga** with optional **watch order** metadata across members.
- **FR-B03**: **Films** MUST support statuses including **`to_watch`**, **`watched`** (UI **Vu**), and **`paused`** (UI **En pause**). Films MUST NOT use **`en cours`**.
- **FR-B04**: **Séries** MUST support **`in_progress`** (UI **En cours**), **`paused`** (**En pause**), **`to_watch`**, and **`watched`** (**Vu** when série complete per product rules).
- **FR-B05**: User MAY set optional **watch date** when marking **vu** (film or série completion); MUST be editable and clearable.
- **FR-B06**: Titles MUST support **private notes**.
- **FR-B07**: Each quote MUST be a **child entity** of a movie item (`text` required, optional context, `createdAt`); MUST sync independently.
- **FR-B08**: Each **série** MUST support **per-episode** watched state (**épisode vu**); episode identity SHOULD use catalog season/episode when available.
- **FR-B09**: App MUST expose **next episode** progress for active séries and MUST support **release reminders** for upcoming episodes (notification channel per plan).

**Phase C — Discovery**

- **FR-C01**: User MAY set **mood** and **pace** (or tone) on a title.
- **FR-C02**: User MUST be able to **filter** by mood, pace, tags, and **film vs série**.
- **FR-C03**: App MAY show **private** recommendations from the user’s data only.
- **FR-C04**: Detail or discovery surfaces MUST show **streaming availability** (“where to watch”) when provider data exists.

**Phase D — Insights**

- **FR-D01**: User MAY set an **annual watch goal** (films/séries finished in calendar year), private.
- **FR-D02**: App MUST derive **watch streak** and **activity heatmap** from **activity days**: status changes, **épisode vu**, or film **vu** — no session timer. Streak MUST be private and optional.
- **FR-D03**: App MUST provide **stats breakdowns** and optional **year-in-review**, private.

### Key Entities

- **Movie item** (extends existing `movie` type): Phase A adds `imdbId`, `synopsis`, `releaseYear`, `catalogRating`, `director`, `cast`, `mediaKind` (`film` | `series`). Phases B–D add tags, franchise grouping, statuses above, watch date, notes, quotes, episode watch state, next-episode/reminder fields, mood/pace, streaming hints, and insight aggregates — detailed in `data-model.md` after plan.
- **Movie quote** (child): passage text, optional context, timestamps; sync like book quotes.
- **Series episode progress** (nested or child): season/episode keys, **vu** flag, optional per-episode watch date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User adds a film from search in under 90 seconds with network.
- **SC-002**: Zero duplicate rows for same `imdbId` in acceptance tests.
- **SC-003**: Catalog rating never overwrites personal rating field.
- **SC-004**: User can mark at least one **épisode vu** and see **next episode** update without creating a second list row for the série.
- **SC-005**: Lookup errors never block offline manual film/série create/edit.

## Assumptions

- Wikidata coverage is sufficient for Valentin’s library; French metadata may be uneven (M1).
- Streaming availability depends on a catalog or third-party source behind the server; regional gaps are acceptable with empty states.
- Episode and air-date data may be partial; manual episode marking still works.

## Out of Scope

- Cover images; IMDb scraping; client-side Wikidata; offline lookup queue (X3).
- Custom lists; format flags (cinéma/stream/disc); rewatch counters; multi-entry viewing diary; physical lending; fractional ratings; public reviews; content-warning tags (see Session 2026-10-16).
- **One row per series with no episode tracking** (superseded M2).
- Letterboxd / Trakt / CSV import (later).
