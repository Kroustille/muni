# Feature Specification: Recipes — source book / cookbook citation

**Feature directory**: `specs/010-recipe-source-book/`

**Feature Branch**: `010-recipe-source-book`

**Created**: 2026-10-28

**Status**: Draft

**Input**: When adding or editing a recipe, the user can record **where the recipe comes from** by selecting or creating a **cookbook** in a single control, plus optional **page(s)** on the recipe. Cookbooks live in a **user-scoped catalog** (not the books-to-read library). French UI; offline-first with sync.

**Depends on**: Muni foundation (`001-typed-lists-companion`) — recipe list, add/edit/detail flows, offline-first sync, French UI, per-user privacy.

**Relationship to books library (`002-books-library`)**: The **books library** tracks reading life cycle and catalog-enriched metadata. **Cookbooks** are a separate user-owned catalog seeded only when the user picks or creates one from the recipe form. No shared item type, no reading status, and no automatic link between a library book and a cookbook row. Duplicating the same title in both places is allowed and expected.

## Decision summary (MVP model)

| Topic | Decision |
|-------|----------|
| **Data model** | **User-scoped cookbook catalog** + recipe reference: each **Cookbook** has display **title**, optional **author**, optional **ISBN**; each **Recipe** optionally stores **`cookbookId`** and optional **page(s)** text. |
| **UX** | **Single combobox** on recipe add/edit: search existing cookbooks **or** create a new cookbook in the same control (autocomplete-with-create). **Manual input/select only** — no picker from books-to-read, no catalog scan on the recipe form in MVP. |
| **Rejected for MVP** | Pure inline bibliographic fields only on the recipe (legacy Option A); library link only (Option B); hybrid library picker + free text (Option C). See [research.md](./research.md). |
| **Capture speed** | Recipe still requires only **type + title** to save; cookbook + page remain optional and may be collapsed on the add form. |
| **Search / filter** | Display and edit in P1; **filter or search recipes by cookbook title** is **P2** (via cookbook catalog or denormalized title). |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick or create a cookbook when adding a recipe (Priority: P1)

A user adds a new recipe. In **Ouvrage source**, they use one field to **search among cookbooks they already added** or **type a new cookbook title and confirm create**. They optionally enter **page(s)** on the recipe. They save. The recipe detail shows the cookbook title (and author/ISBN if set on the cookbook) plus page.

**Why this priority**: Core value — provenance at capture time with reuse across recipes.

**Independent Test**: Add a recipe with title only, save, reopen offline, confirm no source shown. Add another recipe, create cookbook “Grand Livre de Cuisine” in the combobox, add page “42”, save offline, reopen detail, confirm cookbook and page visible.

**Acceptance Scenarios**:

1. **Given** the recipe add form, **When** the user saves with only a recipe title, **Then** the recipe is created with no `cookbookId` and no source block on detail.
2. **Given** the add form, **When** the user selects an existing cookbook from the combobox and saves, **Then** the recipe stores that `cookbookId` and detail shows the cookbook’s display fields under **Ouvrage source**.
3. **Given** the add form, **When** the user types a new cookbook title not in the list and confirms create, **Then** a new cookbook row is created in the user catalog, the recipe references it, and both appear after save (offline-first).
4. **Given** the add form, **When** the user sets a cookbook and **Page(s)**, **Then** detail shows page on the recipe and cookbook metadata from the catalog row.
5. **Given** the user leaves cookbook unset, **When** they save, **Then** no empty labels or placeholder rows appear on detail (clean empty state).

---

### User Story 2 - Reuse the same cookbook on multiple recipes (Priority: P1)

A user has already created “Desserts faciles” as a cookbook from an earlier recipe. When adding another recipe, they search the combobox, pick the same cookbook, and enter a different page number.

**Why this priority**: Avoid retyping the same book; consistent spelling across recipes.

**Independent Test**: Create two recipes referencing the same `cookbookId` with different pages; edit the cookbook author once; confirm both recipe details show the updated author.

**Acceptance Scenarios**:

1. **Given** at least one cookbook in the user catalog, **When** the user opens the combobox on a new recipe, **Then** existing cookbooks appear in search results (accent-insensitive substring match on title, and author if present).
2. **Given** two recipes share a `cookbookId`, **When** the user updates the cookbook’s title or author (via recipe edit flow or dedicated cookbook edit if exposed), **Then** both recipes’ detail views reflect the updated cookbook fields after save/sync.
3. **Given** a cookbook referenced by recipes, **When** the user creates a **new** cookbook with a similar but different title, **Then** the system treats it as a separate catalog row (no auto-merge in MVP).

---

### User Story 3 - Edit or clear source on an existing recipe (Priority: P1)

From recipe detail or edit, the user changes the selected cookbook, updates page(s), or clears the source (clears `cookbookId` and page).

**Why this priority**: Provenance changes when transcribing from another edition or correcting mistakes.

**Independent Test**: Edit page offline; confirm detail updates. Clear cookbook selection and save; confirm source section hidden.

**Acceptance Scenarios**:

1. **Given** a recipe with a cookbook and page, **When** the user changes only the page and saves, **Then** detail shows the new page and unchanged cookbook.
2. **Given** a recipe with a cookbook, **When** the user clears the combobox selection and saves, **Then** `cookbookId` and page are cleared and the source section is omitted on detail.
3. **Given** concurrent edits on two devices, **When** each device changes **different** fields (one page, one cookbook selection), **Then** both changes merge per-field last-write-wins after sync.
4. **Given** concurrent edits on two devices, **When** each device sets a **different** cookbook on the same recipe, **Then** the latest modification to `cookbookId` wins.

---

### User Story 4 - View source on recipe detail (Priority: P1)

Opening a recipe shows title, ingredients, steps, notes (existing behavior) and, when a cookbook is set, an **Ouvrage source** section with cookbook **title**, optional **author**, optional **ISBN** (from the catalog row), and recipe **page(s)** when present.

**Why this priority**: Value at cook time — user finds the page in the physical book.

**Independent Test**: Open a recipe with cookbook + page only; confirm stable section order (title first, then author, page, ISBN as populated).

**Acceptance Scenarios**:

1. **Given** a recipe with `cookbookId` and page, **When** the user opens detail, **Then** **Ouvrage source** appears in a consistent position relative to notes (planning picks one placement).
2. **Given** a cookbook with ISBN, **When** detail is shown, **Then** ISBN is displayed as plain text (no requirement to open catalog or library in MVP).
3. **Given** a recipe without a cookbook, **When** detail is shown, **Then** the source section is omitted.

---

### User Story 5 - Sync cookbooks and recipe references offline and online (Priority: P1)

Cookbook rows and recipe `cookbookId` / page behave like other user items: saved locally immediately, included in outbound sync, merged on pull with per-field timestamps. Orphan cookbooks (no referencing recipes) may remain in the catalog in MVP.

**Why this priority**: Constitution offline-first; recipes are already synced items.

**Independent Test**: Create cookbook + recipe on device A offline; sync; open recipe on device B and confirm cookbook fields and page. Edit cookbook author on B; sync; confirm A’s recipe detail updates.

**Acceptance Scenarios**:

1. **Given** device A offline, **When** the user creates a new cookbook via the combobox and saves the recipe, **Then** both cookbook and recipe exist locally and replicate after sync.
2. **Given** device A offline, **When** the user changes recipe page and sync runs after reconnect, **Then** device B shows the same page after pull.
3. **Given** a soft-deleted recipe restored via sync, **When** detail opens, **Then** `cookbookId` and page match the pre-delete state; referenced cookbook still exists if not deleted.

---

### User Story 6 - Find recipes by cookbook (Priority: P2)

From recipe list or global search, the user can locate recipes whose **cookbook title** matches a query (accent-insensitive, substring match).

**Why this priority**: Useful once many recipes reference the same cookbook; not required for first slice.

**Independent Test**: Create three recipes, two sharing the same cookbook; search by that cookbook title; confirm two results.

**Acceptance Scenarios**:

1. **Given** several recipes with cookbooks, **When** the user searches using a substring of a cookbook title, **Then** matching recipes appear ranked consistently with existing search behavior.
2. **Given** a recipe with a user-created cookbook (not a library book), **When** the user searches that title, **Then** the recipe is found.

---

### Edge Cases

- **Page without cookbook**: User fills **Page(s)** but clears or never selects a cookbook — on save, **do not persist orphan page**; page is stored only when `cookbookId` is set.
- **Whitespace-only** cookbook title on create rejected or trimmed to empty (no orphan cookbook row).
- **Very long titles**: allow long text on cookbook; list view unchanged (source not required in list row in MVP).
- **Same physical book, library + cookbook**: no indicator or link in MVP; help text clarifies distinction from books-to-read.
- **ISBN format**: free text on cookbook in MVP; optional normalization is planning detail.
- **Deleting cookbooks**: MVP default — allow catalog rows to remain even if unreferenced; hard delete of cookbooks referenced by recipes is out of scope unless planning defines cascade (prefer **no delete** in MVP UI).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST maintain a **user-scoped cookbook catalog** (distinct from books library items) with at minimum **display title**, optional **author**, optional **ISBN**.
- **FR-002**: The system MUST allow optional **recipe source** via **`cookbookId`** reference and optional **page(s)** text on the recipe; page MUST NOT persist without a selected cookbook.
- **FR-003**: Recipe **add** and **edit** MUST expose **one combobox control** to search existing cookbooks or create a new cookbook (same field), plus optional **Page(s)**; French labels per Decision summary; help text stating this is **not** the reading list.
- **FR-004**: Saving a recipe MUST NOT require a cookbook; recipe title remains the only required name field for recipes.
- **FR-005**: Creating a cookbook MUST occur only through this combobox (or equivalent manual create in the same control) in MVP — **not** by importing books-to-read rows or catalog scan on the recipe form.
- **FR-006**: The system MUST persist cookbooks and recipe references in **offline-first** local storage and **multi-device sync** with **per-field last-write-wins** on cookbook fields and recipe `cookbookId` / page, consistent with foundation rules.
- **FR-007**: Recipe **detail** MUST display **Ouvrage source** when `cookbookId` is set, showing cookbook title, optional author, optional ISBN, and non-empty page(s).
- **FR-008**: Clearing cookbook selection on edit MUST remove `cookbookId` and page from persistence and hide the source block on detail.
- **FR-009**: The system MUST NOT create, update, or link **books library** items when the user selects or creates a cookbook for a recipe.
- **FR-010**: The system MUST NOT apply reading status, ratings, lending, or quotes from `002` to cookbooks or recipe source.
- **FR-011** (P2): Recipe search MUST match **cookbook title** (via join or denormalized index) in addition to recipe title and existing searchable recipe fields.

### Key Entities

- **Cookbook** (new, user-scoped catalog): Stable id, **title** (display name), optional **author**, optional **ISBN**; synced per user; seeded only by user create-through-combobox (and later edit if exposed). **Not** a books-to-read item; **no** reading status.
- **Recipe item** (existing): User-owned list item with title, ingredients, steps, notes; extended with optional **`cookbookId`** and optional **page(s)** text. Bibliographic display on detail is resolved from the referenced **Cookbook** row.
- **Books library item** (existing, `002`): Separate type with reading lifecycle — **no shared type or id** with Cookbook in MVP.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In moderated testing, **95%** of participants can add a recipe with a cookbook (pick or create) and page in **under 2 minutes** without using the books library flow.
- **SC-002**: After sync, **100%** of cookbook creates/edits and recipe source edits performed offline appear identically on a second device in automated sync tests (per-field LWW cases covered).
- **SC-003**: **Zero** automatic creations of library book rows occur in acceptance tests when users only use recipe source combobox flows.
- **SC-004**: **100%** of recipes sharing a cookbook show the same author/title on detail after a single cookbook author edit and sync.
- **SC-005** (P2): Searching for a known cookbook title returns all recipes citing that cookbook in **under 3 seconds** on a library of **500** recipes on a mid-tier phone (user-perceived instant).

## Assumptions

- Users cite **physical or digital cookbooks**; cookbook catalog is **manual** in MVP (no Open Library fill on recipe form).
- **Page(s)** is **short text** on the recipe (ranges and “p.” prefixes), not a structured interval type.
- List rows for recipes **need not** show source in MVP (detail-first).
- Global i18n remains **French-only** for v1; field labels listed in research are normative for UX copy.
- Privacy: cookbooks and source data are **private** per user like all items; no sharing surface in MVP.

## Out of Scope (MVP)

- Picking source from **books-to-read** / books library (Option B/C paths).
- Promoting recipe source to “add to reading list” or auto-deduping cookbook against library ISBN.
- Cover images for cookbooks on recipe detail.
- Aggregated view “all recipes from this cookbook” beyond P2 search.
- Barcode/ISBN scan on the recipe form (stay on books catalog flows for library).
- Bulk import of cookbooks from external catalogs.
- Adding recipe ingredients to shopping list (already out of scope in 001 v2).

## References

- [research.md](./research.md) — Model options and rejected alternatives.
- [001 recipes baseline](../001-typed-lists-companion/spec.md) — ingredients, steps, notes, sync.
- [002 books library](../002-books-library/spec.md) — reading lifecycle (orthogonal type).
