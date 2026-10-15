# Feature Specification: Muni v1 (Typed Lists Second Brain)

**Feature Branch**: `001-typed-lists-companion`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "A life companion used as a second brain to track lists of things: shopping list to prepare food, book list, movie list, recipe list. Users want to note down what someone shares (a film, a book) and improve their life by cooking and not forgetting anything. Today it is a mess of different tools or one very generic tool not adapted to specific needs. Mobile-first, synced with desktop, works offline."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture an item fast, by type (Priority: P1)

A user hears about a film or a book, or remembers they need milk. They open the app, use the quick-add control at the bottom of the screen, choose a type (book, movie, recipe, shopping), and see the fields for that type. They enter a title, optionally fill other fields such as "recommended by", and save.

**Why this priority**: Capture is the core promise. Without fast capture there is no second brain.

**Independent Test**: With a signed-in user, add one item of each of the four types and confirm each appears in its list with the entered fields.

**Acceptance Scenarios**:

1. **Given** the user is on any screen, **When** they open quick add, **Then** they are asked for a type first and then shown only the fields for that type.
2. **Given** the type is selected, **When** the user enters only a title and saves, **Then** the item is created with all other fields empty.
3. **Given** the user enters "recommended by" text, **When** they type, **Then** matching names from their past entries are suggested.
4. **Given** the user is offline, **When** they add an item, **Then** it is saved immediately and visible in the list.

---

### User Story 2 - Browse and update typed lists (Priority: P1)

A user opens a list and sees its items. They can check off shopping items, change the status of books (to read, reading, read) and movies (to watch, watched), rate finished books and movies from 1 to 5 stars, edit any field, and delete items.

**Why this priority**: Lists are only useful if the user can keep them current.

**Independent Test**: Create items in each list, change statuses, check off shopping items, edit and delete, and confirm changes persist after reloading.

**Acceptance Scenarios**:

1. **Given** a shopping list with items, **When** the user checks an item, **Then** it is shown as checked.
2. **Given** a book with status "to read", **When** the user changes it to "read", **Then** the status updates and a rating can be added.
3. **Given** a list view, **When** the user filters by status, **Then** only matching items are shown.
4. **Given** a recipe, **When** the user opens it, **Then** they see title, ingredients (quantity and name), ordered steps and notes, and can edit them.

---

### User Story 3 - Sign in and sync across devices, offline-capable (Priority: P1)

A user signs in with an email magic link or a Google account (no password). They use the app on phone and desktop. Changes made on either device, including while offline, appear on the other once connectivity returns.

**Why this priority**: Sync across phone and desktop and offline use were explicit requirements.

**Independent Test**: Sign in on two devices, switch one to offline, make edits on both, reconnect, and confirm both converge on the same data.

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they request a magic link with their email, **Then** they receive a link that signs them in.
2. **Given** a new visitor, **When** they choose Google sign-in, **Then** they are signed in with their Google account.
3. **Given** device A is offline and has edited item X, **When** it reconnects, **Then** the edit reaches device B within a few seconds.
4. **Given** both devices edited the same field of the same item while offline, **When** both sync, **Then** the most recent edit wins and both devices show the same value.
5. **Given** an item deleted on one device, **When** sync completes, **Then** it is gone on the other device.
6. **Given** two different users, **When** each uses the app, **Then** neither can see the other's data.

---

### User Story 4 - Search across all lists (Priority: P2)

From the home screen, the user searches by text and finds matching items across all four lists.

**Why this priority**: A second brain is only useful if things can be found again, but it depends on items existing.

**Independent Test**: With items across all lists, search for a word and confirm matching items from each list appear, including while offline.

**Acceptance Scenarios**:

1. **Given** items in several lists, **When** the user searches for a term in a title, **Then** matching items from all lists are shown with their type.
2. **Given** the user searches by a "recommended by" name, **When** results load, **Then** items recommended by that person are included.
3. **Given** no match, **When** the user searches, **Then** an empty state is shown.

---

### User Story 5 - Home overview and installable app (Priority: P2)

The home screen shows a card per list with item count and recently added items, and the app can be installed to a phone home screen. The interface is in French, with light and dark mode following the system setting.

**Why this priority**: It makes the app feel like a companion that is always at hand.

**Independent Test**: Install the app from a mobile browser, open it from the home screen, and confirm counts and recent items are accurate and that the theme follows the system.

**Acceptance Scenarios**:

1. **Given** items exist, **When** the user opens home, **Then** each list card shows its count and the most recent items are shown, newest first.
2. **Given** the system is in dark mode, **When** the app opens, **Then** it uses the dark theme.
3. **Given** a mobile browser, **When** the user chooses install, **Then** the app can be launched from the home screen and opens without browser chrome.

---

### Edge Cases

- A user adds an item with an empty or whitespace-only title: it is rejected with a clear message.
- A device stays offline for a long time and syncs many changes at once.
- A magic link is expired or already used.
- The user's session expires while offline: local data stays usable and sync resumes after re-authentication.
- An item is edited on one device and deleted on another: the most recent action wins.
- Duplicate titles in the same list are allowed.
- First launch with no items shows an empty state that explains how to add the first item.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide four list types: shopping, books, movies and recipes.
- **FR-002**: Users MUST be able to add an item by choosing a type first, then filling the fields for that type; only the title (or name for shopping) is required.
- **FR-003**: Quick add MUST be available at the bottom of the main screens.
- **FR-004**: Book items MUST support title, author, status (to read, reading, read), recommended by, optional rating (1 to 5, once read) and notes.
- **FR-005**: Movie items MUST support title, status (to watch, watched), recommended by, optional rating (1 to 5, once watched) and notes.
- **FR-006**: Recipe items MUST support title, a list of ingredients (quantity and name), ordered steps and notes.
- **FR-007**: Shopping items MUST support name, quantity and a checked state. In v1 there is a single shopping list.
- **FR-008**: Every item MUST store its creation date.
- **FR-009**: "Recommended by" MUST be free text with suggestions drawn from the user's previous entries.
- **FR-010**: Users MUST be able to edit and delete any item.
- **FR-011**: List views MUST allow filtering by status where a status exists.
- **FR-012**: Users MUST be able to search by text across all lists, matching titles and "recommended by".
- **FR-013**: The home screen MUST show a card per list with its item count and a list of recently added items.
- **FR-014**: All functionality (add, edit, delete, check off, filter, search) MUST work with no network connection.
- **FR-015**: Changes made offline MUST be synced automatically when connectivity returns, and on app open and periodically while online.
- **FR-016**: When the same field of an item is modified on two devices, the most recent modification MUST win, per field.
- **FR-017**: Deletions MUST propagate across devices.
- **FR-018**: Users MUST be able to sign in with an email magic link or a Google account. Passwords MUST NOT be offered.
- **FR-019**: Each user MUST only be able to read and write their own data.
- **FR-020**: Users MUST be able to sign out from settings.
- **FR-021**: The app MUST be installable on a mobile device home screen and usable on desktop browsers.
- **FR-022**: The interface MUST be in French, with all user-facing text separated from the code so more languages can be added later.
- **FR-023**: The interface MUST support light and dark themes following the system setting.
- **FR-024**: The system MUST NOT use analytics or third-party tracking.

### Out of Scope (v1)

- Adding a recipe's ingredients to the shopping list (planned for v2).
- ISBN scanning (planned for later).
- Data export or import.
- Multiple shopping lists, tags, a people list for "recommended by", and a generic notes list type.
- Sharing between users, real-time live sync, notifications, meal planning, AI features, and metadata lookups such as covers.
- Languages other than French.

### Key Entities

- **User**: A person with an account, identified by email or Google account, who owns all their items.
- **Item**: A record belonging to one user, with a type (shopping, book, movie, recipe), a title or name, a creation date, a last-modified time per field and a deleted marker for sync.
- **Book / Movie attributes**: status, recommended by, rating, notes, and author for books.
- **Recipe attributes**: ordered ingredients (quantity and name), ordered steps, notes.
- **Shopping attributes**: quantity, checked state.
- **Recommender name**: A free-text name remembered from past entries to power suggestions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can sign in on a phone and on a desktop browser using either a magic link or Google.
- **SC-002**: A user can add a new item in no more than 3 taps plus typing the title.
- **SC-003**: With no network, a user can add, edit, check off, delete and search items, and all changes reach other signed-in devices within 10 seconds of reconnecting.
- **SC-004**: When two devices edit the same field offline, 100% of the time both end on the same value after syncing.
- **SC-005**: In testing with two accounts, 0 items from one account are ever visible to the other.
- **SC-006**: Search results appear within 1 second for a user with up to 5,000 items.
- **SC-007**: The app can be installed to a phone home screen and launched from it.
- **SC-008**: The app loads and is usable within 2 seconds on a mid-range phone after the first visit, with or without network.

## Assumptions

- The user is a single person using their own account across their own devices.
- Scale is one user's data, up to a few thousand items.
- Sync runs on app open, on reconnect and periodically, not as live push.
- The French interface is the only language at launch, with an i18n layer in place.
- A hosted backend is used for v1, with self-hosting planned once the app has grown.
- Technology choices (Next.js, TypeScript, Tailwind, IndexedDB, Postgres via Supabase) are recorded in the constitution and detailed in the plan, not here.
