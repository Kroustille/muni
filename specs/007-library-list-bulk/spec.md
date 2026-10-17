# Feature Specification: Library list UX, search, bulk actions, and catalog multi-add

**Feature directory**: `specs/007-library-list-bulk/`

**Feature Branch**: `007-library-list-bulk`

**Created**: 2026-10-17

**Status**: Draft (specified; planning and implementation pending)

**Input**: Homogeneous **list page** experience across **shopping**, **books**, **movies**, **recipes**, **music artists**, and **music tracks**: **list-local search**, improved **sort controls**, **soft delete with undo** from list rows and **bulk delete**, **bulk assign series** (books) and **saga/franchise** (movies) with shared name and **required order**, **global search** extended for book **author** and movie **director**, and **catalog multi-add** for books and movies with one **default status** per batch. French UI; offline-first; no server full-text search in V1.

**Depends on**: Muni v1 (**001**), books (**002**), films & TV (**003**), music (**004**). **Recommended after** **006-nextjs-16** (platform upgrade); parallel development is possible but increases merge risk.

## Clarifications

### Session 2026-10-17 (locked — roadmap)

| Topic | Decision |
|--------|----------|
| Delete | **Soft delete + undo** (extend existing model to list row and bulk); **no** trash / permanent-delete UI in V1 |
| Bulk series / saga | **Yes**, including **order** in the group for every selected item |
| List-local search V1 | Books: **title + author**; movies: **title + director**; tracks: **title + artist**; artists: **name** (row label); shopping & recipes: **title** |
| Global `/search` | Extend indexing to **author** (books) and **director** (movies), in addition to title matching already supported |
| Catalog multi-add | **Same default status** for all items in one batch (`to_read` / `to_watch` as today) |
| Music lists | **In scope V1** — same search, sort UI, delete, and bulk delete as other lists; **no** series/saga on music |
| Books grouping | **Series** (`seriesName` + `seriesPosition`); French UI **série**; no franchise on books |
| Movies grouping | **Franchise / saga** (`franchiseId`, `franchiseName`, `franchiseOrder`); French UI **Saga** |
| Bulk grouping UX | Shared **combobox**: pick existing group from library-derived names or **create new**; then apply **name + order** to all selected items |
| List-local search scope | Client-side filter on items **already loaded** for that list type; not a replacement for global search |
| Sort fields V1 | Keep **date** and **rating** (where rating sort already applies); change **control pattern** only unless plan adds optional phase-2 fields |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List-local search on every list page (Priority: P1)

On any list page (shopping, books, movies, recipes, music artists, music tracks), the user types in a **search field** scoped to that list. Matching is **case- and accent-insensitive substring** on the fields defined for that type (see Clarifications). Results update without a full page reload and without requiring network.

**Why this priority**: Immediate visibility on all lists; unblocks finding items in large libraries offline.

**Independent Test**: Seed a list with known titles and metadata; type partial author/director/artist; only matching rows remain visible.

**Acceptance Scenarios**:

1. **Given** the books list with multiple titles, **When** the user searches an **author** substring, **Then** only books whose title or author matches appear.
2. **Given** the movies list, **When** the user searches a **director** substring, **Then** only movies whose title or director matches appear.
3. **Given** the music tracks list, **When** the user searches **artist** or title, **Then** matching tracks appear.
4. **Given** the music artists list, **When** the user searches by **artist name**, **Then** matching artists appear.
5. **Given** shopping or recipes list, **When** the user searches by **title**, **Then** matching items appear.
6. **Given** offline mode, **When** the user uses list-local search, **Then** search works with no network.

---

### User Story 2 - Sort: field select and single asc/desc control (Priority: P1)

On every list page that already supports sort, the user chooses a **sort field** from a **dropdown (select)** and toggles **ascending vs descending** with a **single button** (icon + accessible label) instead of separate direction chips. **Date** and **rating** (where applicable per list type) remain the available fields in V1.

**Independent Test**: Change field and toggle direction; list order updates and persists per existing product rules (e.g. URL query or local preference per route if already used).

**Acceptance Scenarios**:

1. **Given** a books list, **When** the user selects **Note** and taps the direction control, **Then** order toggles between ascending and descending rating sort.
2. **Given** a shopping list (no rating sort), **When** the user opens sort controls, **Then** only **date** (or equivalent) is offered.
3. **Given** any list, **When** the user activates the direction control, **Then** an **accessible name** describes current order and the action (French i18n).

---

### User Story 3 - Delete from list with undo (Priority: P1)

From a list row (without opening detail), the user can **delete** an item. Deletion is **immediate soft delete** with a short-lived **Undo** affordance (same product semantics as today’s detail delete). No confirmation dialog.

**Independent Test**: Delete one row from books list; undo restores; item syncs as active again.

**Acceptance Scenarios**:

1. **Given** a visible list row, **When** the user deletes from the row action, **Then** the row disappears and **Undo** is offered.
2. **Given** Undo visible, **When** the user taps Undo within the undo window, **Then** the item reappears as before.
3. **Given** Undo expired, **When** time passes, **Then** the item remains soft-deleted until restored by another flow (e.g. catalog re-add rules).

---

### User Story 4 - Multi-select and bulk soft delete (Priority: P1)

The user enters **selection mode** on a list (checkbox per row or equivalent mobile pattern), selects multiple items, and chooses **delete**. All selected items are soft-deleted with **one** undo affordance that restores **the whole batch** (or clearly communicates batch scope in French).

**Independent Test**: Select three recipes, bulk delete, undo once — all three return.

**Acceptance Scenarios**:

1. **Given** selection mode, **When** the user selects N items and confirms delete, **Then** all N are soft-deleted and one undo restores all N.
2. **Given** music artists or tracks list, **When** bulk delete runs, **Then** behavior matches other list types (no saga action offered).

---

### User Story 5 - Bulk assign book series (Priority: P1)

On the books list, with multiple books selected, the user chooses **assign to series** (French: série). A **combobox** lists existing **series names** from the library plus **create new**. User provides or picks **series name** and **series position (order)**; **order is required** for each bulk operation and applies to **every selected book** (same order value for all, or per-row order if product chooses one pattern — **default: one order number applied to all selected items** when user enters a single order field for the batch).

**Clarification encoded**: For bulk V1, the UI MUST collect **series name** and **one order value** applied to **all** selected books in the batch (user may run bulk again with different order if needed).

**Independent Test**: Select two books without series; assign to new series "Le Cycle" at position 1; both rows show series and position.

**Acceptance Scenarios**:

1. **Given** two books selected, **When** user picks existing series from combobox and sets order **3**, **Then** both books have that `seriesName` and `seriesPosition` 3.
2. **Given** combobox, **When** user types a new series name and confirms create, **Then** that name is available and applied to selection.
3. **Given** bulk assign without order, **When** user attempts confirm, **Then** validation blocks until order is provided.

---

### User Story 6 - Bulk assign movie saga / franchise (Priority: P1)

On the movies list, with multiple films selected, the user chooses **add to saga** (French **Saga**). Combobox picks existing **franchise names** or creates new. Applying sets shared **`franchiseName`**, stable **`franchiseId`** for the group (generated once when creating a new saga), and **`franchiseOrder`** — **order required** for the batch (same rule as books: one order value applied to all selected items in V1).

**Independent Test**: Select two films; assign to new saga; both share franchise id and order.

**Acceptance Scenarios**:

1. **Given** bulk saga assign, **When** user creates a new saga name, **Then** a shared **franchise id** is assigned to all selected movies.
2. **Given** existing saga in combobox, **When** user selects it and sets order, **Then** selected movies join that saga with the given order.
3. **Given** music or shopping lists, **When** selection mode is active, **Then** saga/series bulk action is **not** shown.

---

### User Story 7 - Global search: author and director (Priority: P2)

On the global **Search** page (`/search`), queries match **title** as today **and** **author** for books **and** **director** for movies. Matching rules remain case- and accent-insensitive substring unless otherwise documented in 001.

**Independent Test**: Add book with unique author string; global search finds by author not in title.

**Acceptance Scenarios**:

1. **Given** a book whose title does not contain "Hugo", **When** user searches author "Hugo" globally, **Then** the book appears in results.
2. **Given** a movie, **When** user searches director name globally, **Then** the movie appears.
3. **Given** offline local index, **When** user searches, **Then** results come from local data without server full-text.

---

### User Story 8 - Catalog multi-add for books and movies (Priority: P2)

From **book** or **movie** catalog search flows, the user **selects multiple** search results (checkboxes), then **adds all** to the library in one action. Every item in the batch receives the **same default status** (`to_read` / `to_watch`). Existing silent dedupe, merge, and restore rules per **002** / **003** still apply per item.

**Independent Test**: Select three catalog books; add batch; three library rows with default status; duplicates by ISBN/imdb still merge.

**Acceptance Scenarios**:

1. **Given** catalog results, **When** user selects 3 rows and confirms add, **Then** 3 items appear (or fewer if dedupe merges).
2. **Given** batch add, **When** complete, **Then** all new items share the same default unread/unwatched status.
3. **Given** partial failure (e.g. one invalid row), **When** batch completes, **Then** user sees which items succeeded and which failed (French messaging); successful items remain saved.

---

### Edge Cases

- **Empty search query**: List shows full list (or current filter set); no error.
- **No matches**: Clear empty state in French for list-local search.
- **Selection + search**: Selection applies to **visible** (filtered) rows or entire list — **default: bulk actions affect only currently selected rows**, selection cleared when leaving list or changing type filter if applicable.
- **Bulk delete + undo** while sync pending: Restored items MUST return to active state locally and sync like single undo.
- **Bulk series/saga on items already in another group**: Overwrite group fields with new assignment (V1); no “remove from saga only” bulk action required in V1.
- **Catalog multi-add duplicates**: Same ISBN/imdb in one batch → one row per dedupe rules, no duplicate rows.
- **Rating sort** on lists without ratings: Rating field hidden or disabled in sort select (shopping, recipes).
- **Long bulk batch**: Progress or disabled confirm while processing; user MUST NOT lose partial success silently.

## Requirements *(mandatory)*

### Functional Requirements

**List coverage**

- **FR-001**: List-local search MUST be available on **shopping**, **books**, **movies**, **recipes**, **music artists**, and **music tracks** list pages.
- **FR-002**: List-local search MUST filter only items of that list’s type already available to the list view (client-side); MUST NOT require network.

**List-local search fields**

- **FR-003**: Books MUST match query against **title** and **author**.
- **FR-004**: Movies MUST match query against **title** and **director**.
- **FR-005**: Music tracks MUST match against **title** and **artist** (free-text artist field).
- **FR-006**: Music artists MUST match against **name** (title field).
- **FR-007**: Shopping and recipes MUST match against **title** (reasonable default).

**Sort UI**

- **FR-008**: All list pages that support sort today MUST use a **select** for sort **field** and a **single control** that toggles **ascending / descending** order.
- **FR-009**: Sort fields in V1 MUST remain **date** and **rating** where rating is already supported for that type; shopping and recipes MUST NOT expose rating sort.
- **FR-010**: Sort controls MUST meet accessibility expectations (labeled select, direction control with French `aria-label`).

**Delete**

- **FR-011**: Users MUST be able to soft-delete from the **list row** with **undo**, consistent with detail-panel delete semantics (no confirmation dialog).
- **FR-012**: Users MUST be able to **bulk soft-delete** selected rows with **batch undo** (one undo restores the batch deleted together).

**Bulk selection**

- **FR-013**: Lists MUST support **multi-select mode** with visible selection state and a contextual action bar for bulk operations.
- **FR-014**: Bulk delete MUST be available on all six list types in FR-001.

**Bulk series (books)**

- **FR-015**: Bulk action MUST assign **seriesName** and **seriesPosition** to all selected books.
- **FR-016**: UI MUST use a **combobox** of existing series names (from library) plus **create new**.
- **FR-017**: **seriesPosition** (order) MUST be **required** before confirm; omission MUST block submit.

**Bulk saga (movies)**

- **FR-018**: Bulk action MUST assign **franchiseName**, **franchiseId**, and **franchiseOrder** to all selected movies.
- **FR-019**: UI MUST use the same combobox pattern as books (existing saga names + create new); French label **Saga**.
- **FR-020**: **franchiseOrder** MUST be **required** before confirm; new saga MUST receive a generated shared **franchiseId** for the batch.

**Music**

- **FR-021**: Music artists and tracks MUST have list-local search, sort UI (FR-008–FR-010), row delete, and bulk delete; MUST NOT offer series/saga bulk actions.

**Global search**

- **FR-022**: Global search MUST index and match **author** on book items.
- **FR-023**: Global search MUST index and match **director** on movie items.
- **FR-024**: Title matching behavior MUST remain consistent with existing global search rules.

**Catalog multi-add**

- **FR-025**: Book catalog flow MUST allow **multi-select** on search results and **add N to library** in one action.
- **FR-026**: Movie catalog flow MUST allow the same multi-select batch add.
- **FR-027**: All items in a catalog batch MUST receive the **same default status** for that type.
- **FR-028**: Per-item dedupe, merge, and soft-delete restore rules from **002** / **003** MUST still apply during batch add.

**Non-goals**

- **FR-029**: Server-side Postgres full-text search MUST NOT be introduced in V1.
- **FR-030**: Trash folder or permanent delete UI MUST NOT be introduced in V1.
- **FR-031**: Bulk “remove from saga/series only” without new assignment is out of V1 unless needed for parity — **out of scope** for V1.

### Key Entities

- **List view state**: Search query, sort field/order, selection set, undo payload for last delete operation(s).
- **Book item**: `seriesName`, `seriesPosition` (bulk writable).
- **Movie item**: `franchiseId`, `franchiseName`, `franchiseOrder` (bulk writable).
- **Search index (local)**: Extended entries for book `author` and movie `director` for global search.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On each of the **six** list types, a user can find a known item via list-local search in **under 10 seconds** (offline, library of at least 50 items of that type in test data).
- **SC-002**: **100%** of list types with sort today use the new select + toggle pattern in acceptance UI review.
- **SC-003**: Bulk delete of **10** items completes with a single undo restoring all **10** in automated or manual acceptance test.
- **SC-004**: Bulk assign series/saga with order succeeds for **≥2** items in one action on books and movies respectively.
- **SC-005**: Global search finds a book by **author-only** query and a movie by **director-only** query in acceptance tests.
- **SC-006**: Catalog multi-add of **3** distinct results creates **3** library entries (or fewer when dedupe applies) with identical default status.
- **SC-007**: No regression to offline list load or sync isolation tests from **001**.

## Assumptions

- Existing soft-delete and undo timing window from detail delete applies to list and bulk delete unless plan specifies a longer window for bulk.
- Franchise/series name lists for combobox are derived from existing library values (same approach as today’s filters).
- Implementation may ship in internal order (search + sort before bulk before catalog multi-add) as long as all FRs are met before feature complete.
- Feature **006** lands first in the recommended sequence; if not, integration testing covers combined risk.

## Out of Scope

- Phase-2 sort fields (title, author, franchise name, read/watch dates) unless explicitly added in a later spec amendment.
- Rich list-local search (tags, notes, franchise name) in V1.
- Dedicated `Franchise` entity table (V2 in roadmap).
- Per-item status pick during catalog multi-add.
- Bulk saga/series on music.
- Permanent delete or trash UI.
