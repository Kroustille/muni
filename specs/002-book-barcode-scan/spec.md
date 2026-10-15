# Feature Specification: Book barcode scan and catalog lookup

**Feature Branch**: `002-book-barcode-scan`

**Created**: 2026-10-15

**Status**: Draft

**Input**: Extend the books list so mobile users can scan an ISBN barcode, look up metadata through the server, preview and confirm, or add manually with ISBN prefilled when lookup fails. Desktop keeps manual book add only (no scan or ISBN lookup UI).

**Depends on**: Muni v1 (`001-typed-lists-companion`) books list and quick-add.

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
- **B9:** **Desktop:** no scan, no manual ISBN field, no catalog lookup flow — standard manual book add only. ISBN scan + lookup is **mobile-only**.
- **B10:** On lookup failure (mobile): fall back to manual add with **ISBN prefilled**.
- **B11:** **Mobile title search** in Open Library — user picks one result (like M3 movies); same preview, dedupe, and merge rules as ISBN lookup; **desktop still no catalog** (B9). Entry on books list and book quick-add (N3).
- **L1–L4 (locked):** Silent dedupe by ISBN (no warning); app search title-only; no cover images; catalog text French first, English fallback per field.
- **N1:** Show page count on book detail when catalog provides it.
- **N3:** Scan entry on **books list** and **book quick-add** (mobile).
- **X2:** All catalog lookups via **server** (no client-direct third-party calls).
- **X3:** Lookup requires network; manual add/edit works offline (no offline lookup queue).
- **X4:** Server-side cache of catalog responses (short TTL).

## User Scenarios & Testing *(mandatory)*

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

### Edge Cases

- Invalid or non-ISBN barcode: keep scanning (B3); do not call lookup until ISBN-valid.
- User offline during lookup: show clear message; offer manual add without blocking offline edits elsewhere.
- Open Library returns partial metadata: save what is present; title required, others optional.
- Duplicate ISBN on two different manual rows: prefer updating the row that already has that ISBN; merge heuristics for no-ISBN manual rows documented in plan (title + author normalization).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Mobile MUST offer barcode scan on books list and book quick-add (N3).
- **FR-002**: Scan UX MUST be continuous until a valid ISBN is read (B3).
- **FR-003**: System MUST validate ISBN format before lookup.
- **FR-004**: Catalog lookup MUST go through the authenticated server proxy only (X2).
- **FR-005**: Server MUST cache lookup responses per ISBN with short TTL (X4).
- **FR-006**: Preview MUST allow editing all imported fields before save (B6).
- **FR-007**: Saved books MUST store ISBN and catalog fields: synopsis, genres (array), publication year, publisher, page count when available.
- **FR-008**: Dedupe MUST be silent by ISBN (and merge rules for manual rows) per B4, B5, L1.
- **FR-009**: Metadata language MUST prefer French labels, English fallback per field (L4).
- **FR-010**: Desktop MUST NOT expose scan, ISBN lookup, or manual ISBN catalog flow (B9).
- **FR-011**: Lookup failure on mobile MUST offer manual add with ISBN prefilled (B10).
- **FR-012**: Title MUST be required on add; author MAY be empty (B8).
- **FR-013**: Search index MUST remain title-only (L2); new fields are not searched in v1.
- **FR-014**: No cover images (L3).

### Key Entities

- **Book item** (extends existing `book` type): adds `isbn`, `synopsis`, `genres[]`, `publicationYear`, `publisher`, `pageCount` (optional/nullable per catalog).

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

- Cover images; Google Books fallback; offline lookup queue (X3); desktop ISBN flows (B9).
