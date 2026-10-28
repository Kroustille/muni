# Feature Specification: Recipes — source book / cookbook citation

**Feature directory**: `specs/010-recipe-source-book/`

**Feature Branch**: `010-recipe-source-book`

**Created**: 2026-10-28

**Status**: Draft

**Input**: When adding or editing a recipe, the user can record **where the recipe comes from** — a **cookbook or other source book** (title, author, page, optional ISBN). This is **not** the books-to-read library (reading status, ratings, lending, quotes). French UI; offline-first with sync.

**Depends on**: Muni foundation (`001-typed-lists-companion`) — recipe list, add/edit/detail flows, offline-first sync, French UI, per-user privacy.

**Relationship to books library (`002-books-library`)**: The **books library** tracks reading life cycle and catalog-enriched metadata. The **recipe source block** is a **standalone citation** on the recipe. Duplicating the same title in both places is allowed and expected. No automatic sync between a library book and a recipe source in MVP.

## Decision summary (MVP model)

| Topic | Decision |
|-------|----------|
| **Data model** | **Option A** — optional bibliographic fields on the recipe (title, author, page(s), optional ISBN). **No link** to books library items in MVP. |
| **Rejected for MVP** | Option B (library link only), Option C (hybrid picker + free text) — see [research.md](./research.md). |
| **Capture speed** | Recipe still requires only **type + title** to save; entire source block remains optional and may be collapsed on the add form. |
| **Search / filter** | Display and edit in P1; **filter or search recipes by source title** is **P2**. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record source when adding a recipe (Priority: P1)

A user adds a new recipe from the recipe list or quick-add. After entering the recipe title (and optionally ingredients/steps), they expand **Ouvrage source** and enter the cookbook **title**, optionally **author**, **page(s)**, and **ISBN**. They save. The recipe appears in the list with its usual fields; source data is stored on the recipe.

**Why this priority**: Core value — remember provenance at capture time.

**Independent Test**: Add a recipe with title only, save, reopen offline, confirm no source shown. Add another recipe with full source block, save offline, reopen detail, confirm all source fields visible.

**Acceptance Scenarios**:

1. **Given** the recipe add form, **When** the user saves with only a recipe title, **Then** the recipe is created and no source block is shown on detail (or an empty-state hint that source is optional).
2. **Given** the recipe add form, **When** the user fills **Titre de l’ouvrage** and saves, **Then** the recipe is created and detail shows that title under **Ouvrage source**.
3. **Given** the add form, **When** the user fills author, page(s), and ISBN in addition to source title, **Then** all provided values appear on recipe detail after save.
4. **Given** the user is offline, **When** they add a recipe with source fields, **Then** data is available immediately in the local store.
5. **Given** the user leaves all source fields blank, **When** they save, **Then** no empty labels or placeholder rows appear on detail (clean empty state).

---

### User Story 2 - Edit or clear source on an existing recipe (Priority: P1)

From recipe detail or edit, the user updates source fields (fix typo in book title, add page number) or clears the source block entirely.

**Why this priority**: Provenance changes when the user transcribes from another edition or corrects mistakes.

**Independent Test**: Edit an existing recipe’s page field offline; confirm detail updates. Clear source title and save; confirm source section hidden.

**Acceptance Scenarios**:

1. **Given** a recipe with a source title, **When** the user edits the author and saves, **Then** detail shows the new author and unchanged other source fields.
2. **Given** a recipe with source data, **When** the user clears **Titre de l’ouvrage** and saves, **Then** the entire source block is treated as absent (other source sub-fields are not shown orphaned on detail).
3. **Given** concurrent edits on two devices, **When** each device changes a **different** source sub-field, **Then** both changes appear after sync (per-field last-write-wins).
4. **Given** concurrent edits on two devices, **When** each device edits the **same** source sub-field, **Then** the value with the latest modification wins.

---

### User Story 3 - View source on recipe detail (Priority: P1)

Opening a recipe shows title, ingredients, steps, notes (existing behavior) and, when present, an **Ouvrage source** section listing title, author, page(s), and ISBN in readable French layout.

**Why this priority**: Value at cook time — user finds the page in the physical book.

**Independent Test**: Open a recipe with only page + title; confirm section order is stable (title first, then author, page, ISBN as populated).

**Acceptance Scenarios**:

1. **Given** a recipe with source title and page, **When** the user opens detail, **Then** **Ouvrage source** appears above or below notes in a consistent position (planning picks one placement; must not jump between sessions).
2. **Given** a recipe with ISBN populated, **When** detail is shown, **Then** ISBN is displayed as plain text (no requirement to open catalog or library in MVP).
3. **Given** a recipe without source data, **When** detail is shown, **Then** the source section is omitted (not an empty form).

---

### User Story 4 - Find recipes by cookbook (Priority: P2)

From recipe list or global search, the user can locate recipes whose **source book title** matches a query (accent-insensitive, substring match).

**Why this priority**: Useful once many recipes reference the same cookbook; not required for first slice.

**Independent Test**: Create three recipes, two sharing the same source title; search by that title; confirm two results.

**Acceptance Scenarios**:

1. **Given** several recipes with source titles, **When** the user searches using a substring of one source title, **Then** matching recipes appear in results ranked consistently with existing search behavior.
2. **Given** a recipe with source title only on the recipe (no library book), **When** the user searches that title, **Then** the recipe is found.

---

### User Story 5 - Sync source fields offline and online (Priority: P1)

Source fields behave like other recipe fields: saved locally immediately, included in outbound sync, merged on pull with per-field timestamps, and preserved across soft-delete restore rules for the parent recipe.

**Why this priority**: Constitution offline-first; recipes are already synced items.

**Independent Test**: Edit source on device A offline; sync; open on device B and confirm values.

**Acceptance Scenarios**:

1. **Given** device A offline, **When** the user sets source page and sync runs after reconnect, **Then** device B shows the same page after pull.
2. **Given** a soft-deleted recipe restored via sync, **When** detail opens, **Then** source fields match the pre-delete state.

---

### Edge Cases

- **Partial source**: User fills **Page(s)** without **Titre de l’ouvrage** — on save, either prompt to add a title or discard orphan page/author/ISBN (MVP default: **do not save orphan sub-fields**; only persist source block when title is non-empty after trim).
- **Whitespace-only** inputs treated as empty.
- **Very long titles** (cookbook names): allow long text; list view unchanged (source not required in list row in MVP).
- **Same cookbook, many recipes**: each recipe holds its own citation; no grouping view in MVP.
- **User also has the book in library**: no indicator or link in MVP; optional help text clarifies the distinction.
- **ISBN format**: accept free text in MVP; optional normalization (hyphens) is planning detail, not user-blocking validation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow optional **recipe source citation** fields distinct from the books library: **source book title**, **source book author**, **source page(s)**, **source ISBN** (semantic names; French labels per Decision summary).
- **FR-002**: Saving a recipe MUST NOT require any source field; recipe title remains the only required name field for recipes.
- **FR-003**: The system MUST persist source fields on the recipe item and include them in **offline-first** local storage and **multi-device sync** with **per-field last-write-wins** merge semantics consistent with foundation rules.
- **FR-004**: Recipe **add** and **edit** flows MUST expose the source block (collapsible or secondary section acceptable) with French labels and help text stating it is **not** the reading list.
- **FR-005**: Recipe **detail** MUST display **Ouvrage source** when **source book title** is non-empty, showing all other non-empty source sub-fields.
- **FR-006**: Clearing **source book title** MUST remove the source block from persistence and detail (orphan sub-fields MUST NOT remain stored).
- **FR-007**: The system MUST NOT create, update, or link **books library** items when the user fills recipe source fields.
- **FR-008**: The system MUST NOT change reading status, ratings, lending, or quotes on library books as a side effect of recipe source data.
- **FR-009** (P2): Recipe search (list-local and/or global, per existing search scope) MUST match **source book title** in addition to recipe title and existing recipe searchable fields.

### Key Entities

- **Recipe item** (existing): User-owned list item with title, ingredients, steps, notes; extended with optional **source citation** scalars (title, author, page(s), ISBN).
- **Books library item** (existing, `002`): Separate type with reading lifecycle and catalog metadata — **no relationship** to recipe source in MVP.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In moderated testing, **95%** of participants can add a recipe with a source book title and page in **under 2 minutes** without using the books library flow.
- **SC-002**: After sync, **100%** of recipe source field edits performed offline appear identically on a second device in automated sync tests (per-field LWW cases covered).
- **SC-003**: **Zero** automatic creations of library book rows occur in acceptance tests when users only edit recipe source fields.
- **SC-004** (P2): Searching for a known source book title returns all recipes citing that title in **under 3 seconds** on a library of **500** recipes on a mid-tier phone (user-perceived instant).

## Assumptions

- Users cite **physical or digital cookbooks** and occasionally other books (magazine, blog collected as book title text); no separate “URL source” field in this spec.
- **Page(s)** is a **short text** field (supports ranges and “p.” prefixes), not a structured page interval type.
- List rows for recipes **need not** show source in MVP (detail-first).
- Global i18n remains **French-only** for v1; field labels listed in research are normative for UX copy.
- Privacy: source data is **private** per user like all items; no sharing surface in MVP.

## Out of Scope (MVP)

- Linking a recipe to a **books library** row (Option B) or **picker + free-text hybrid** (Option C).
- Promoting recipe source to “add to reading list” or auto-deduping against library ISBN.
- Cover images for source books on recipe detail.
- Aggregated view “all recipes from this cookbook” beyond P2 search.
- Barcode/ISBN scan on the recipe form (stay on books catalog flows).
- Adding recipe ingredients to shopping list (already out of scope in 001 v2).

## References

- [research.md](./research.md) — Options A/B/C analysis and rejected alternatives.
- [001 recipes baseline](../001-typed-lists-companion/spec.md) — ingredients, steps, notes, sync.
- [002 books library](../002-books-library/spec.md) — reading lifecycle (orthogonal).
