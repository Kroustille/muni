# Feature Specification: Books — library, catalog, and insights

**Feature directory**: `specs/002-books-library/`

**Feature Branch**: `002-books-library` (historical: `002-book-barcode-scan`)

**Created**: 2026-10-15

**Status**: Draft (Phase A largely implemented on `main`; Phases B–D specified here, implementation pending)

**Input**: Personal book library in Muni: **catalog capture** (ISBN scan, title search, manual add), **library richness** (tags, series, lending, notes, quotes, **en pause**), **discovery** (mood/pace, private recommendations, filters), and **insights** (goals, streaks, heatmap, stats, year-in-review). French UI; private-by-default; offline-first with sync.

**Depends on**: Muni v1 (`001-typed-lists-companion`) books list and quick-add.

## Product scope (phased)

| Phase | Theme | Status |
|-------|--------|--------|
| **A — Catalog** | Scan, title search, manual add, dedupe/merge, Open Library via server | **Shipped** (see User Stories 1–4) |
| **B — Library** | Tags, series, editions/works grouping, **en pause** + pages read, lending, private notes, quotes | Specified; Phase B data shape **clarified** (see Q&A session) |
| **C — Discovery** | Mood & pace, private recommendations, filter/browse by those dimensions | Specified; pending plan |
| **D — Insights** | Annual reading goal, streaks, activity heatmap, stats breakdowns, year-in-review | Specified; activity rules **clarified** (see Q&A session) |

## Clarifications

### Session 2026-10-15

- **B1:** Open Library as catalog provider (no API key).
- **B2:** Barcode Detection API on Android when available; **WASM scanner always on iPhone** (do not rely on BarcodeDetector on iOS). Must work in the installed PWA on Valentin’s primary device (iPhone).
- **B3:** Continuous scan until a valid ISBN is read.
- **B4:** When scan/lookup matches an existing manual book (same ISBN or merge rules), **merge/update** the row with ISBN and catalog metadata (no duplicate).
- **B5:** Same ISBN on a **soft-deleted** book → **restore** and refresh metadata from catalog (silent, no warning).
- **B6:** On preview before save, **all imported fields are editable**.
- **B7:** **Multiple genres** (list of strings); editable on preview.
- **B8:** **Title only** required on add; author optional.
- **B9:** **Desktop:** no barcode scan and no manual ISBN lookup field — standard manual book add remains available. ISBN scan + ISBN field lookup are **mobile-only**.
- **B10:** On lookup failure (mobile): fall back to manual add with **ISBN prefilled**.
- **B11:** **Title search** in Open Library on books list and book quick-add (all devices) — user picks one result (like M3 movies); same preview, dedupe, and merge rules as ISBN lookup.
- **L1–L4 (locked):** Silent dedupe by ISBN (no warning); app search title-only; no cover images; catalog text French first, English fallback per field.
- **N1:** Show page count on book detail when catalog provides it.
- **N3:** Scan entry on **books list** and **book quick-add** (mobile).
- **X2:** All catalog lookups via **server** (no client-direct third-party calls).
- **X3:** Lookup requires network; manual add/edit works offline (no offline lookup queue).
- **X4:** Server-side cache of catalog responses (short TTL).

### Session 2026-10-16 (product walkthrough — encoded decisions)

**Accepted for books**

- Catalog: ISBN barcode scan → catalog fill (mobile); title catalog search (all devices); manual entry offline (title-only OK); “already in library” at scan/search; multiple editions / **work grouping** (one row per edition, grouped by work); free-form **tags** (not custom shelves); **series** (name + volume/order).
- Lifecycle: **`en pause`** status (set aside, may resume) — not a separate “DNF” label; **pages read** when en pause; integer **1–5 star** rating only (no fractional stars).
- Personal data: **private notes**; **quotes & highlights** as synced **child records** per book; **lending** — one active loan (borrower + optional date), no history v1.
- Discovery: **mood & pace** metadata; **private** personalized recommendations; **discovery filters** on mood, pace, tags.
- Insights: **annual reading goal** (N books/year, private); **reading streaks** (optional, no guilt); **calendar heatmap** of reading activity; **year-in-review** recap; **stats breakdowns** (charts/tables).

**Denied (books)**

- Custom shelves/collections (use tags); physical location; format (paper/ebook/audiobook); owned vs library/borrowed flags; public/separate reviews; content-warning tags; reading **session timer**; reading speed / ETA estimates; fractional star ratings.

**Later / not in this spec**

- Goodreads / CSV **import** (low priority).
- **Reading challenges** (themed goals) — **cross-list** (books + movies + …); defer to a companion-wide feature, not book-only.

### Session 2026-10-16 (clarify Q&A)

- **Q:** When you add several editions of the same work (different ISBNs), how should they appear in the library? → **A:** **One library row per edition** (per item/ISBN), with editions **grouped under a shared work** in list and detail UI (catalog work id when available; manual link otherwise).
- **Q:** How should **en pause** be represented? → **A:** Add book status **`paused`** (French UI **En pause**); optional **pages read** while paused. Distinct from `to_read`, `reading`, and `read`; no separate DNF status.
- **Q:** How should **quotes & highlights** be stored? → **A:** **Child records** per quote (passage text, optional page, created-at), synced individually; linked to parent book item.
- **Q:** How should **lending** (“prêté à…”) work? → **A:** **One active loan** per book (borrower name, optional loan date); clearing the loan means returned. **No loan history in v1.**
- **Q:** What counts as **reading activity** for heatmap and streaks (no session timer)? → **A:** A calendar day counts if the user logs **any book progress or completion** that day: status change (e.g. to/from `reading` or `read` or `paused`), **pages read** update, or marking **read**.

## User Scenarios & Testing *(mandatory)*

### Phase A — Catalog (shipped)

### User Story 1 - Scan or search by title on phone and add from catalog (Priority: P1)

On mobile, the user opens the books list or book quick-add, then either starts **scan** (camera until a valid ISBN is read) or **Rechercher par titre** (catalog title search, pick one row). The app looks up the book via the server, shows a preview (title, author, synopsis, genres, year, publisher, page count when present), lets them edit any field, and saves to their list.

**Why this priority**: Core value of the feature — fast capture from a physical book.

**Independent Test**: Scan a known ISBN on a phone (or inject ISBN in test harness), confirm preview fields, save, and see the book in the list with status default and optional fields populated.

**Acceptance Scenarios**:

1. **Given** mobile books list, **When** user taps scan and a valid ISBN is read, **Then** lookup runs and preview is shown.
2. **Given** mobile books list, **When** user searches by title and picks a result, **Then** lookup runs (by ISBN when available) and preview is shown.
3. **Given** preview, **When** user edits synopsis and saves, **Then** the book is stored with edited values.
4. **Given** continuous scan, **When** no valid ISBN yet, **Then** scanning continues without forcing a single-shot capture.
5. **Given** lookup succeeds, **When** user cancels preview, **Then** no book is created.

---

### User Story 2 - Silent dedupe, merge, and restore (Priority: P1)

If the user already has a book with the same ISBN, or a soft-deleted book with that ISBN, or a manual book that matches per merge rules, saving from scan updates the existing row (or restores and refreshes) without a duplicate and without a blocking dialog.

**Why this priority**: Prevents list clutter; matches books/movies policy (L1).

**Independent Test**: Add book A manually, scan same ISBN, confirm one row updated; soft-delete, scan again, confirm restored with fresh metadata.

**Acceptance Scenarios**:

1. **Given** an active book with ISBN X, **When** user scans ISBN X and confirms preview, **Then** the same row is updated (metadata refreshed) and no second row appears.
2. **Given** a soft-deleted book with ISBN X, **When** user scans X and confirms, **Then** the book is restored and catalog fields refresh.
3. **Given** a manual book without ISBN that matches merge rules when ISBN X is added, **When** user confirms scan-add, **Then** the manual row gains ISBN and catalog fields per B4.

---

### User Story 3 - Lookup failure and manual ISBN (Priority: P2)

When Open Library returns no hit or the network fails during lookup, the user can still add a book manually with ISBN prefilled (mobile). Desktop users add books manually without ISBN lookup.

**Why this priority**: Resilience and desktop scope boundary (B9, B10).

**Independent Test**: Mock lookup 404; confirm manual form with ISBN prefilled. On desktop, confirm no scan/ISBN UI.

**Acceptance Scenarios**:

1. **Given** lookup failure on mobile, **When** user continues, **Then** manual add opens with ISBN prefilled and title-only required.
2. **Given** desktop books list, **When** user adds a book, **Then** only standard manual fields appear (no scan, no ISBN lookup).

---

### User Story 4 - Manual ISBN entry on mobile (Priority: P2)

On mobile, the user can type or paste an ISBN instead of scanning, then run the same lookup → preview → confirm flow.

**Independent Test**: Enter ISBN manually on mobile, complete flow without camera.

**Acceptance Scenarios**:

1. **Given** mobile add flow, **When** user enters a valid ISBN and requests lookup, **Then** preview behaves like scan success.

---

### Phase B — Library (specified, not yet implemented)

**User Story 5 — Organize with tags and series (P1)**  
User assigns free-form tags and optional series name + volume/order; filters list by tag or series.

**User Story 6 — Editions grouped by work (P1)**  
User keeps **one book item per edition** (typically one ISBN each). List and detail views **group editions under the same work** (Open Library work id when present; user may link manual rows). Scanning a second ISBN for the same work adds or updates that edition’s row, not a duplicate work.

**User Story 7 — En pause and lending (P1)**  
User sets status to **En pause** (`paused`, optional pages read), or records that it is **prêté à** someone, and can resume to `reading` or `read` later.

**User Story 8 — Notes and quotes (P2)**  
User keeps private notes on the book and adds multiple **quote** records (passage text, optional page), each synced as its own child of the book item.

### Phase C — Discovery (specified, not yet implemented)

**User Story 9 — Mood, pace, and filters (P2)**  
After reading, user sets mood/pace (or tags); list and browse views filter by those dimensions.

**User Story 10 — Private recommendations (P3)**  
App suggests books from the user’s own library patterns (no social feed).

### Phase D — Insights (specified, not yet implemented)

**User Story 11 — Goals, streaks, and heatmap (P2)**  
User sets an annual books-finished goal, sees optional streak and a private activity heatmap driven by **progress or completion events** (status, pages read, or finished) per calendar day—no session timer.

**User Story 12 — Stats and year-in-review (P3)**  
User opens stats (per month, tags/genres, authors, pages) and an optional year-in-review recap.

---

### Edge Cases

- Invalid or non-ISBN barcode: keep scanning (B3); do not call lookup until ISBN-valid.
- User offline during lookup: show clear message; offer manual add without blocking offline edits elsewhere.
- Open Library returns partial metadata: save what is present; title required, others optional.
- Duplicate ISBN on two different manual rows: prefer updating the row that already has that ISBN; merge heuristics for no-ISBN manual rows documented in plan (title + author normalization).

### Session 2026-10-28 (catalog coverage)

| Topic | Decision |
|--------|----------|
| **Primary provider** | **Open Library** (unchanged) — server proxy, cache, no client keys |
| **Fallback provider (P2)** | **Google Books API** when OL returns no acceptable hit on title or ISBN lookup — server-side key only; same preview/merge UX |
| **public-apis repo** | **Not** a dependency — reference list only |
| **Offline** | Manual add unchanged; no offline catalog queue (X3) |
| **Phasing** | **P1** search normalization + empty-state manual path; **P2** fallback adapter chain |

## Requirements *(mandatory)*

### Functional Requirements

**Catalog search improvements (2026-10-28 — cross-phase)**

- **FR-CAT01**: Title and ISBN catalog search MUST remain a **single** French UI entry point; results MUST still require user preview before save (Phase A rules).
- **FR-CAT02**: When the primary provider returns **no** results, the app MUST offer **manual add** with clear copy (existing B10) without blocking the user.
- **FR-CAT03 (P2)**: Server-side lookup MAY chain a **secondary provider** (Google Books) before declaring not found; merged hits MUST map to the same preview fields as Open Library.
- **FR-CAT04**: All catalog HTTP calls MUST stay **server-side** (X2); API keys MUST NOT ship to the client.
- **FR-CAT05**: Cached responses MUST respect TTL and provider attribution in server logs only (no user-visible provider branding required).


- **FR-001**: Mobile MUST offer barcode scan on books list and book quick-add (N3).
- **FR-002**: Scan UX MUST be continuous until a valid ISBN is read (B3).
- **FR-003**: System MUST validate ISBN format before lookup.
- **FR-004**: Catalog lookup MUST go through the authenticated server proxy only (X2).
- **FR-005**: Server MUST cache lookup responses per ISBN with short TTL (X4).
- **FR-006**: Preview MUST allow editing all imported fields before save (B6).
- **FR-007**: Saved books MUST store ISBN and catalog fields: synopsis, genres (array), publication year, publisher, page count when available.
- **FR-008**: Dedupe MUST be silent by ISBN (and merge rules for manual rows) per B4, B5, L1.
- **FR-009**: Metadata language MUST prefer French labels, English fallback per field (L4).
- **FR-010**: Desktop MUST NOT expose barcode scan or manual ISBN catalog lookup (B9); title catalog search (B11) is allowed on desktop.
- **FR-011**: Lookup failure on mobile MUST offer manual add with ISBN prefilled (B10).
- **FR-012**: Title MUST be required on add; author MAY be empty (B8).
- **FR-013**: Search index MUST remain title-only (L2); new fields are not searched in v1.
- **FR-014**: No cover images (L3).

**Phase B — Library (draft; refine after clarify / plan)**

- **FR-B01**: Books MUST support user-defined **tags** (many per book); MUST NOT implement custom shelves/collections.
- **FR-B02**: Books MAY belong to a **series** with optional volume/order.
- **FR-B03**: Book status enum MUST include **`paused`** (UI **En pause**) alongside `to_read`, `reading`, `read`. User MAY set optional **pages read** on `paused`. MUST NOT expose a separate “DNF” status.
- **FR-B04**: A book MAY have **at most one active loan**: `loanedTo` (text, borrower name) and optional `loanedAt` (date). User MUST be able to clear the loan (returned). MUST NOT store loan history in v1.
- **FR-B05**: Books MUST support **private notes** (existing field scope may extend).
- **FR-B06**: Each quote MUST be a **child entity** of a book item (`text` required, `page` optional, `createdAt`); MUST sync independently; book detail MUST list/add/edit/delete quotes.
- **FR-B07**: Each **edition** MUST be a distinct book **item** (ISBN dedupe unchanged). Items MUST be linkable to a shared **work** (catalog work id or user-defined work key). UI MUST **group editions by work** in browse/detail; MUST NOT collapse editions into a single row.

**Phase C — Discovery (draft)**

- **FR-C01**: User MAY set **mood** and **pace** on a book (post-read or anytime).
- **FR-C02**: User MUST be able to **filter** books by mood, pace, and tags.
- **FR-C03**: App MAY show **private** recommendations derived only from the user’s data.

**Phase D — Insights (draft)**

- **FR-D01**: User MAY set an **annual reading goal** (books finished in calendar year).
- **FR-D02**: App MUST derive **reading streak** and **activity heatmap** from **activity days**: a UTC/local calendar day (user locale TBD in plan) counts when the user records book **progress or completion**—status change among book statuses, **pages read** change, or transition to **`read`**. Session timer MUST NOT be required.
- **FR-D03**: App MUST provide **stats breakdowns** and optional **year-in-review** from the user’s library data.

### Key Entities

- **Book item** (extends existing `book` type): Phase A adds `isbn`, `synopsis`, `genres[]`, `publicationYear`, `publisher`, `pageCount` (optional/nullable per catalog). Phases B–D add tags, series, pause/lending, notes, quotes, mood/pace, and insight aggregates — detailed in `data-model.md` after plan.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On iPhone PWA, user can scan a common paperback ISBN and save a book in under 60 seconds with network available.
- **SC-002**: 100% of duplicate ISBN scan-adds result in a single list row (no duplicates in acceptance tests).
- **SC-003**: Desktop regression: book add flow unchanged (no new required fields beyond title).
- **SC-004**: Lookup errors never block offline manual book create/edit.

## Assumptions

- Open Library coverage is sufficient for Valentin’s library; French metadata may be uneven (B1).
- WASM barcode library bundle size is acceptable for mobile PWA.
- Merge without ISBN uses normalized title + optional author match (plan defines threshold).

## Out of Scope

- Cover images; offline lookup queue (X3); desktop ISBN barcode / manual ISBN lookup (B9).
- Importing the [public-apis](https://github.com/public-apis/public-apis) repository as a runtime dependency.
- Custom shelves; physical shelf location; format flags; owned/borrowed library flags; public reviews; content-warning catalog; reading session timer; pages/hour or ETA; fractional ratings (see Session 2026-10-16).
- Goodreads/CSV import (later); cross-list reading challenges (later, not book-only).
