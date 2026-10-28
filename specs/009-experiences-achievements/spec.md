# Feature Specification: Experiences & achievements — discovery companion

**Feature directory**: `specs/009-experiences-achievements/`

**Feature Branch**: `009-experiences-achievements`

**Created**: 2026-10-28

**Status**: Draft

**Input**: Valentin’s expanded product vision: Muni helps humans **register new experiences and achievements** because happiness and a sense of a full life come from **discovering new things** — not from replacing existing typed lists (books, films, fitness, recipes, shopping) but from **framing and extending** the life companion around novelty, milestones, and optional reflection.

**Depends on**: Muni foundation ([`001-typed-lists-companion`](../001-typed-lists-companion/spec.md)) — auth, offline-first sync, French UI, home overview patterns, search, per-user privacy, capture-speed principle. **References** (does not rewrite): [`008-fitness-training`](../008-fitness-training/spec.md) for companion tone (opt-in streaks, no guilt).

## North star (product philosophy)

The companion exists to make **discovery visible**: what was **new**, what was **tried**, what **milestone** was reached — so the user can look back and feel continuity and richness, not productivity pressure. Typed lists remain the right tools for **intent and inventory** (to read, to watch, to buy, to cook, to train). This feature adds a **horizontal layer** for **life moments** that may stand alone or **relate** to those lists without duplicating them.

## Relationship to existing and future Muni domains

| Domain | Role today | Relationship to experiences & achievements |
|--------|------------|---------------------------------------------|
| **Books, films, TV, music (002–004)** | Curated libraries; status (read/watched/listened); ratings and notes | Consuming media **is** a kind of experience. MVP keeps library rows authoritative; an **expérience** MAY optionally **reference** one library item when the moment is “I finished / discovered this title.” No automatic duplication when status changes in v1. |
| **Shopping & recipes (001)** | Lists for errands and cooking | Completing a recipe or trying a new dish CAN be logged as an expérience (manual capture or later “suggest from recipe” — out of MVP). |
| **Fitness (008)** | Training plan, logs, progression, optional non-guilt streak | **Achievements** in fitness (personal records, first pull-up, program completion) stay **in fitness**. This feature MAY **link** an achievement entry to a fitness milestone in a later phase; MVP does not merge fitness metrics into a global scoreboard. |
| **Future typed domains** (travel, restaurants, learning, etc.) | Not specified here | Same pattern: typed domain owns its fields; **expérience** can reference or summarize cross-domain “something new happened.” |

## Core concepts

- **Expérience**: Something the user **did or tried** that felt **new or noteworthy** for them (visit, activity, first time, event, media finish, social moment). Minimum capture: **title** + **date** (default: today). Optional: category, place, people, short note, link to an existing Muni item.
- **Réalisation (achievement)**: A **milestone** the user chooses to record — completed goal, personal first, meaningful finish line. Distinct from daily habit checklists. May optionally **relate** to one or more expériences or a typed-list item; MVP treats réalisations as their own records with title, date, optional note.
- **Découverte / nouveauté**: Product language emphasizes **“nouveau pour moi”** (subjective novelty), not objective world-first events. No algorithmic “discovery score” in MVP.
- **Fil de vie (timeline)**: Chronological, private view of expériences and réalisations — a **journal backbone**, not a social feed.
- **Réflexion (optional)**: Short free-text or prompted reflection after capture; always skippable; never required to “complete” a day.

## Constraints (aligned with Muni)

| Topic | Decision |
|-------|----------|
| **French UI** | All labels, empty states, and help text in **French**, consistent with 001 (`fr.json` / `t(key)`). |
| **Offline-first** | Capture, edit, browse timeline, and search within this module MUST work offline; sync follows foundation per-field last-write-wins and soft deletes. |
| **Privacy** | Private per user only; no sharing, followers, or public profiles in this feature. |
| **Capture speed** | Adding an expérience MUST require at most **title + save**; everything else optional (constitution Principle II). |
| **Companion tone** | Celebrate optionally; never shame. See [Anti-patterns](#anti-patterns-non-goals). |

## Product scope (phased)

| Phase | Theme | Intent |
|-------|--------|--------|
| **A — Register** | Fast capture of **expériences**; list + simple filters | User can record “something new” in seconds |
| **B — Milestones** | **Réalisations**; optional link to expérience or Muni item | User names achievements without gamification |
| **C — Fil de vie** | Unified **timeline** (expériences + réalisations); month/year browse; in-module search | User sees life richness over time |
| **D — Gentle companion** | Optional reflection prompt; home card summary; **suggest link** when marking media read/watched (non-blocking) | Extends companion framing without replacing libraries |

Phases **A–C** are the **MVP product** for this feature. Phase **D** ships after A–C are usable end-to-end, unless a trivial slice (e.g. home card count) is explicitly pulled into the same delivery batch in planning.

## Anti-patterns (non-goals)

The product MUST NOT:

- Use **guilt copy** (“You haven’t tried anything new in 14 days”, “You’re falling behind”).
- Show **streak loss** or **broken chain** visuals for novelty or experience frequency (contrast: fitness 008 allows **opt-in, week-based, hideable** assiduity — experiences feature has **no parallel streak** in MVP).
- Enable **social comparison**, leaderboards, likes, or shared feeds.
- Imply **mandatory journaling** or daily quotas for a “good” user.
- Replace typed lists: users MUST still manage books, films, training, etc. in their existing domains.

Optional **positive** feedback (Phase D only): private, dismissible messages (e.g. “Belle découverte enregistrée”) — never tied to punishment or loss.

## User Scenarios & Testing *(mandatory)*

### Phase A — Register

### User Story 1 - Capture a new experience quickly (Priority: P1)

A signed-in user wants to remember that they tried something new (for example a new café, a museum visit, or finishing a film that mattered). They open the experiences area, tap **Ajouter une expérience**, enter a **title**, optionally adjust the **date**, and save. The entry appears immediately in their list.

**Why this priority**: Without fast capture, the north star (“register new experiences”) fails.

**Independent Test**: Add three expériences with title only, one with a past date and one with a note; reopen offline and confirm all persist.

**Acceptance Scenarios**:

1. **Given** the experiences list, **When** the user saves with only a title, **Then** the expérience is created with **date = today** (device calendar).
2. **Given** the add form, **When** the user sets an earlier date and saves, **Then** the entry sorts correctly by that date in list/timeline views.
3. **Given** optional fields (category, lieu, note courte), **When** left empty, **Then** save still succeeds.
4. **Given** the user is offline, **When** they add an expérience, **Then** it is visible immediately without network.
5. **Given** an empty title or whitespace-only title, **When** the user saves, **Then** a clear French error is shown and nothing is saved.

---

### User Story 2 - Browse and maintain experiences (Priority: P1)

The user opens their expériences list, filters by **period** or **category** (if categories exist), edits fields, or deletes an entry. Deletion is immediate with short-lived **Annuler**, consistent with 001.

**Why this priority**: Registered experiences must remain trustworthy and editable.

**Independent Test**: Create items, filter, edit title, delete with undo window, confirm sync to second device after reconnect.

**Acceptance Scenarios**:

1. **Given** several expériences, **When** the user filters by current month, **Then** only matching dates appear.
2. **Given** an expérience, **When** the user edits the note and saves, **Then** the update persists offline and syncs.
3. **Given** an expérience, **When** the user deletes it, **Then** **Annuler** restores it within the same undo window as shopping/items in 001.
4. **Given** duplicate titles on the same day, **When** saved, **Then** both are allowed (no forced deduplication).

---

### Phase B — Milestones

### User Story 3 - Record an achievement (Priority: P1)

The user records a **réalisation** (for example “Premier 5 km couru en continu”, “Terminé les Misérables”, “Premier pain au levain réussi”) with title, date, and optional note. They MAY optionally link it to an existing **expérience** or to a **typed-list item** (book, film, etc.) by reference, not by copying library metadata.

**Why this priority**: Achievements are the second pillar of Valentin’s vision alongside experiences.

**Independent Test**: Create a réalisation with and without links; confirm linked item still opens in its home domain.

**Acceptance Scenarios**:

1. **Given** the réalisations area, **When** the user saves with title only, **Then** a réalisation is stored with date defaulting to today.
2. **Given** an optional link picker, **When** the user attaches a book item, **Then** the réalisation stores a stable reference to that item and displays a readable French label (snapshot or live title — planning decision).
3. **Given** a linked library item is deleted, **When** the user opens the réalisation, **Then** the link shows as unavailable without deleting the réalisation.
4. **Given** fitness personal records, **When** the user uses this feature, **Then** fitness PRs remain in fitness unless the user manually creates a linked réalisation (no auto-import in MVP).

---

### Phase C — Fil de vie

### User Story 4 - See life timeline (Priority: P1)

The user opens **Fil de vie** and sees expériences and réalisations in **reverse chronological** order, grouped by month (French month labels). They can scroll across months and open any entry for detail.

**Why this priority**: The timeline is the emotional payoff — seeing discovery over time.

**Independent Test**: Seed entries across two months; confirm order, grouping, and offline load under 2 seconds for hundreds of entries (per success criteria).

**Acceptance Scenarios**:

1. **Given** mixed expériences and réalisations, **When** the user opens the timeline, **Then** entries appear newest-first within each month.
2. **Given** an entry, **When** opened from the timeline, **Then** the user sees type (expérience vs réalisation), date, fields, and links.
3. **Given** in-module search, **When** the user searches a substring of a title, **Then** matching entries appear (case- and accent-insensitive), including offline.

---

### Phase D — Gentle companion (Priority: P2)

### User Story 5 - Optional reflection and home awareness (Priority: P2)

After saving an expérience, the user MAY see an **optional** one-line reflection prompt (“Qu’est-ce qui t’a marqué ?”) they can dismiss or fill. The Muni **home** MAY show a small card: count of expériences this month and last réalisation — without targets or red badges.

**Why this priority**: Supports philosophy without blocking MVP A–C.

**Independent Test**: Dismiss prompt and confirm no nag on next capture; enable home card and confirm counts match data.

**Acceptance Scenarios**:

1. **Given** reflection prompts enabled, **When** the user dismisses, **Then** the expérience is already saved and no retry is forced.
2. **Given** home card enabled, **When** the user has zero entries, **Then** empty state is inviting, not guilt-inducing.
3. **Given** a book marked **lu** in the library, **When** Phase D is active, **Then** the app MAY offer once a non-blocking action to create a linked expérience; declining leaves library unchanged.

---

### Edge Cases

- User backdates many entries in one session: timeline and filters remain consistent; sync order uses field timestamps per foundation.
- User links a réalisation to an item on another device before sync: last-write-wins on the link field; broken links handled gracefully.
- Very long titles or notes: reasonable length limits with French validation message (exact limits in planning).
- First launch with no entries: empty state explains **Ajouter une expérience** in one sentence tied to discovery, not productivity.
- Search in MVP matches **titles** (and réalisation titles) only; notes search may come later (same pattern as 001 search evolution).
- User disables home card or reflection in settings: surfaces hide completely.

## Requirements *(mandatory)*

### Functional Requirements

**Navigation & module**

- **FR-001**: The app MUST expose a dedicated **Expériences & réalisations** area with primary navigation prominence comparable to other typed domains (exact label and icon for planning).
- **FR-002**: Phase A MUST ship before Phase B/C dependencies: réalisations and timeline MUST NOT block basic expérience capture.

**Expériences (Phase A)**

- **FR-010**: Users MUST create an **expérience** with required **titre** and optional **date** (default today), **catégorie** (from a small fixed French list — see assumptions), **lieu** (free text), **note courte**, and optional **lien** toward a Muni typed item (book, film, music, recipe — picker by type).
- **FR-011**: Users MUST list, edit, and delete expériences with immediate delete and short-lived **Annuler**, consistent with 001.
- **FR-012**: List view MUST support filter by **période** (at minimum: ce mois, cette année, tout) and by **catégorie** when set.

**Réalisations (Phase B)**

- **FR-020**: Users MUST create a **réalisation** with required **titre**, optional **date** (default today), **note**, optional link to one **expérience**, and optional link to one **typed-list item** (single reference).
- **FR-021**: Réalisations MUST be listable and editable separately from expériences; deleting a réalisation MUST NOT delete linked expériences or library items.

**Fil de vie (Phase C)**

- **FR-030**: **Fil de vie** MUST show expériences and réalisations on one timeline, reverse chronological, grouped by calendar month with French labels.
- **FR-031**: In-module search MUST match **titre** on expériences and réalisations with case- and accent-insensitive substring matching, offline-capable.

**Companion (Phase D)**

- **FR-040**: Optional post-save **réflexion** MUST be skippable in one gesture; disabling in settings MUST turn off prompts globally.
- **FR-041**: Optional home **carte Découvertes** MUST show factual counts only (e.g. expériences ce mois, dernière réalisation); MUST NOT show streaks, targets, or comparison to past self framed as failure.
- **FR-042**: Optional suggestion after marking media **lu / vu / écouté** MUST be dismissible and MUST NOT repeat for the same item after decline.

**Cross-cutting**

- **FR-050**: All entities in this feature MUST sync per foundation constitution (per-field last-write-wins, soft deletes, offline queue).
- **FR-051**: Global Muni search MAY include expérience/réalisation titles in a later iteration; MVP requires in-module search only (FR-031).
- **FR-052**: The feature MUST NOT add analytics or third-party tracking beyond 001’s prohibition.

### Out of Scope (this feature)

- Social feeds, sharing, comments, or multi-user visibility.
- Gamification: points, levels, badges with loss, novelty **streaks**, or leaderboards.
- Automatic creation of expériences on every library status change (Phase D suggestion only, opt-in per action).
- Import from Instagram, calendar, GPS traces, or health platforms.
- AI summarization, prompts generated from external data, or “discovery recommendations” engine.
- Replacing or merging **008** fitness logs, programs, or PRs into réalisations.
- Generic free-form daily diary unrelated to “something new / milestone” (no blank daily page requirement).
- Photo attachments and rich media gallery (may be considered later).
- Multiple languages beyond French in this module.

### Key Entities

- **Expérience**: User-owned; titre; date; optional catégorie, lieu, note; optional typed-item reference (type + id); created/updated metadata; soft-delete marker.
- **Réalisation**: User-owned; titre; date; optional note; optional reference to one expérience; optional reference to one typed-list item; metadata; soft-delete.
- **Catégorie (enum, MVP)**: Closed list for filtering — e.g. **Sortie**, **Culture**, **Bien-être**, **Social**, **Apprentissage**, **Maison & cuisine**, **Autre** (final list in planning; French labels only).
- **Fil de vie entry (view)**: Derived presentation of expériences and réalisations for timeline UX — not a separate persisted entity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-in user can create an expérience with **title only** in no more than **3 taps** plus typing, online or offline.
- **SC-002**: With **500** combined expériences and réalisations, timeline loads and scrolls without user-perceived stall (interactive within **2 seconds** on a mid-range phone, offline).
- **SC-003**: In-module search returns matches within **1 second** for **500** entries, offline.
- **SC-004**: Changes made offline on one device appear on a second signed-in device within **10 seconds** of reconnect (same bar as 001).
- **SC-005**: In isolation testing with two accounts, **0** experience or achievement records from one account are visible to another.
- **SC-006**: Qualitative UX review: no default screen copy in this module uses guilt, streak-break, or social-comparison framing (checklist for QA/French copy review before ship).

## Assumptions

- **Subjective novelty**: “New” means new **for the user**, not globally unique events.
- **Categories** start as a small fixed enum; user-defined tags are out of MVP (may revisit like 001’s deferred tags).
- **Links** to library items are references only; canonical metadata stays in 002–004 domains.
- **Fitness achievements** remain in 008 unless the user explicitly records a réalisation that references a fitness milestone in a later planned link type.
- Scale matches foundation: one user, up to a few thousand combined entries.
- Phase D “suggest expérience from library” is **off by default** until Valentin confirms companion aggressiveness (see open questions in planning/clarify, not blocking spec draft).

## Open product questions (for Valentin — not blocking draft)

These are captured for `/speckit-clarify` rather than as unresolved spec markers:

1. Should **finishing media** (book/film/album) remain **library-only** unless the user opts into Phase D suggestions, or should MVP include a manual “Enregistrer comme expérience” button on library detail screens (Phase B/C)?
2. Should **réalisations** and **expériences** share one capture flow with a type toggle, or stay two distinct entry points?
3. What **category list** best matches Valentin’s mental model (keep proposed enum vs align to future travel/food domains)?
4. Should the timeline include **fitness completed workouts** as read-only rows (cross-domain timeline) in Phase C or stay experiences-only until a later feature?
5. How visible should the **home card** be by default (on vs opt-in)?
