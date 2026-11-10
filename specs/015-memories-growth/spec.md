# Feature Specification: Souvenirs & progression (memories, life timeline, goals, achievements)

**Feature directory**: `specs/015-memories-growth/`

**Feature Branch**: `015-memories-growth`

**Created**: 2026-11-10

**Status**: Planned — product decisions from Valentin **2026-11-10**; [plan](plan.md), [research](research.md), [data model](data-model.md), [contracts](contracts/) and [tasks](tasks.md) **2026-11-11** (T1501–T1584); implementation pending. Spec "Defaults proposed" are resolved in [research.md](research.md).

**Input**: Valentin wants Muni to **really be an app to not forget good memories and experiences, and that allows each user to improve themselves**. This promotes the [009](../009-experiences-achievements/spec.md) north star from vision to delivery: memories become first-class, the existing domain data (books, films, music, recipes, fitness, plants, practice) feeds a **life timeline**, past moments **resurface**, and users can set **personal goals** and earn **private achievements**.

**Depends on**: Foundation (**001**) sync and offline patterns; domain completion signals from **002–004**, **008**, **010**, **012**, **013** as already consumed by récap (**011**); récap (**011**) for period boundaries and look-back integration; Accueil card slots alongside suggestions (**014**).

**Amends**: [009](../009-experiences-achievements/spec.md) — items listed there as "out of scope / not scheduled" (fil de vie, life-moment capture, réalisations, home discovery card, post-completion prompts) are **now scoped here**. 009 stays the north star; its principles (no guilt, no social comparison, companion not coach, domains stay authoritative) are binding on this spec.

## Clarifications

### Session 2026-11-10 (Valentin — locked)

| Topic | Decision |
|--------|----------|
| **Memory content (v1)** | **Text + date, no photos.** A souvenir has a title, a date, optional free text, optional mood, optional place, optional links to existing domain items. Photos are **out of scope for v1** (would need file storage and offline caching) and may follow in a later spec. |
| **Resurfacing** | **All three** ship: **Fil de vie** (life timeline), **"Ce jour-là"** (on this day) on Accueil, and a **best moments** section in the existing **Récap** (011). |
| **Self-improvement model** | **Both goals and achievements, now** — personal goals with progress and optional reflections, and private milestones/achievements (some detected automatically). |

### Defaults proposed (to confirm in `/speckit.clarify`)

| Topic | Proposed default |
|--------|------------------|
| Constitution III (typed lists, not generic notes) | A souvenir is a **typed entity** with structured fields (date, mood, place, links), not a free-form note list. Free text is one optional field. |
| Book / film **year goals** (002/003) | Existing year goals are **surfaced as goals** in the new Objectifs view (read-through), not duplicated or migrated in v1. |
| Goal progress source | **Automatic** when the goal targets a domain signal Muni already records (books read, films watched, recipes cooked, workouts completed, practice sessions, souvenirs added); **manual check-ins** for anything else. |
| Achievement detection | **Local, deterministic rules** over domain data (e.g. 1st/10th/50th/100th book read, first recipe cooked from a cookbook, first workout of a new modality). No server-side scoring. |
| Timeline scope | Souvenirs + domain completion events already used by récap (011). **Shopping excluded.** |
| Privacy | Everything private per user. No sharing, export-to-social, or comparison in v1. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture a souvenir in seconds (Priority: P1)

The user just had a good moment (a dinner with friends, a hike, a concert, a first time doing something). They open Muni, tap **Ajouter → Souvenir**, type a title, keep today's date (or pick another), and optionally add a few words, a mood, a place, and link it to something already in Muni (the restaurant's recipe, the film they watched, the book that inspired the trip). It saves instantly, offline included.

**Why this priority**: Without capture there is nothing to remember. This is the core of "not forgetting good memories".

**Independent Test**: Add a souvenir offline with only a title; it appears immediately in the souvenirs list and, after reconnecting, on a second device.

**Acceptance Scenarios**:

1. **Given** the quick-add sheet, **When** the user picks **Souvenir**, types a title and taps **Ajouter**, **Then** the souvenir is saved with today's date and appears at the top of **Souvenirs**.
2. **Given** a souvenir form, **When** the user sets a past date, **Then** the souvenir is placed at that date in the timeline (backdating is first-class).
3. **Given** a souvenir form, **When** the user links an existing book/film/recipe/workout/plant, **Then** the souvenir detail shows the linked item and the item's detail shows "Souvenirs liés".
4. **Given** no network, **When** the user saves a souvenir, **Then** it is saved locally and synced later with the same conflict rules as other items (001).
5. **Given** a title made only of spaces, **When** the user taps **Ajouter**, **Then** a validation message appears and nothing is saved.

---

### User Story 2 - Fil de vie: one timeline of my life (Priority: P1)

The user opens **Fil de vie** and scrolls a single chronological view mixing their souvenirs with what they already logged: books finished, films and episodes watched, recipes cooked, workouts completed, practice sessions, plant milestones. They can filter by domain and jump to a month or year.

**Why this priority**: Users already record a lot in Muni; seeing it as one story is what turns inventory into memories.

**Independent Test**: With one souvenir and one finished book on different days, both appear in the right order with their domain label, and tapping each opens its detail.

**Acceptance Scenarios**:

1. **Given** souvenirs and domain events across several months, **When** the user opens Fil de vie, **Then** entries are grouped by day, newest first, each showing domain, title and date.
2. **Given** a domain filter (e.g. only Souvenirs + Livres), **When** applied, **Then** only matching entries are shown and the filter is remembered on this device.
3. **Given** a long history, **When** the user picks a year/month, **Then** the timeline jumps there without loading the whole history at once.
4. **Given** an item that was un-completed or deleted, **When** the timeline refreshes, **Then** the corresponding entry disappears (timeline is derived, not a copy).

---

### User Story 3 - Personal goals with gentle progress (Priority: P1)

The user sets a few personal intentions for a period ("Lire 12 livres en 2027", "Essayer 5 nouvelles recettes ce trimestre", "Courir 3 fois par semaine", "Apprendre à faire du pain"). Muni shows progress automatically when it can measure it from existing data, and lets the user check in manually otherwise. At the end of the period the user can write a short reflection ("Ce qui a marché, ce que je change").

**Why this priority**: This is the "improve themselves" half of the request.

**Independent Test**: Create "Lire 3 livres ce mois-ci"; mark one book as read; the goal shows 1/3 without manual input.

**Acceptance Scenarios**:

1. **Given** a measurable goal (domain + count + period), **When** a matching domain event happens, **Then** progress updates automatically.
2. **Given** a free-form goal, **When** the user adds a check-in, **Then** the check-in is dated and counted toward progress.
3. **Given** a goal whose period ended, **When** the user opens it, **Then** they can add an optional reflection; reaching or missing the target is shown neutrally ("8 sur 12 — belle année de lecture"), never as failure.
4. **Given** existing book/film year goals (002/003), **When** the user opens **Objectifs**, **Then** those goals appear there with their current progress.
5. **Given** an active goal, **When** the user archives it early, **Then** it leaves the active list without any loss/guilt messaging.

---

### User Story 4 - Ce jour-là: memories come back to me (Priority: P2)

On Accueil, when the user has souvenirs (or notable domain events) from the same calendar day in previous years, a small dismissible card shows them ("Il y a 2 ans : Concert de …").

**Why this priority**: Resurfacing is what actually prevents forgetting, but it only has value once capture (US1) exists.

**Independent Test**: Backdate a souvenir to today's date one year ago; Accueil shows it in **Ce jour-là**; dismissing hides the card for the rest of the day.

**Acceptance Scenarios**:

1. **Given** souvenirs on today's month/day in past years, **When** Accueil loads, **Then** up to 3 are shown, most recent year first.
2. **Given** nothing on this day, **When** Accueil loads, **Then** no card and no empty-state nagging.
3. **Given** the card is dismissed, **When** the user returns the same day, **Then** it stays hidden; it may reappear on another day.
4. **Given** a settings toggle, **When** the user turns **Ce jour-là** off, **Then** the card never shows.

---

### User Story 5 - Private achievements (réalisations) (Priority: P2)

Muni recognizes meaningful milestones from the user's own data — first/10th/50th book read, first recipe cooked from a new cookbook, a new personal record in fitness, 100th practice session, first year with souvenirs every month — and records them as **réalisations**. The user can also add a manual réalisation ("Premier semi-marathon"). A short, dismissible celebration appears when a new one is earned.

**Why this priority**: Celebrating progress reinforces self-improvement without gamifying it; depends on domain data that already exists.

**Independent Test**: Mark the 10th book as read; a réalisation "10 livres lus" is created once, with the date it happened, and appears in the timeline.

**Acceptance Scenarios**:

1. **Given** a rule threshold is crossed, **When** the domain event syncs or is saved locally, **Then** exactly one réalisation is created (idempotent across devices).
2. **Given** an earned réalisation, **When** the user views **Réalisations**, **Then** it shows title, date earned, and the item(s) that triggered it.
3. **Given** the user un-marks the triggering item, **When** recomputed, **Then** the réalisation remains (achievements are never taken away) unless the user deletes it.
4. **Given** a manual réalisation, **When** saved, **Then** it behaves like an auto one (timeline, look-back).
5. **Given** no achievements yet, **When** the view opens, **Then** the empty state is encouraging, with no counters of "locked" badges.

---

### User Story 6 - Best moments in Récap (Priority: P3)

The monthly and yearly **Récap** (011) gain a **Moments forts** section: souvenirs from the period (favourites first), réalisations earned, and goals completed, plus a link to that period in Fil de vie.

**Why this priority**: Reuses existing récap; valuable but builds on US1–US5.

**Independent Test**: With one favourite souvenir in March, the March récap shows it under Moments forts.

**Acceptance Scenarios**:

1. **Given** souvenirs marked as favourites in a period, **When** viewing that period's récap, **Then** they appear first under Moments forts.
2. **Given** réalisations and completed goals in the period, **When** viewing récap, **Then** they appear under Moments forts.
3. **Given** nothing for the period, **When** viewing récap, **Then** the section is hidden (no guilt empty state).

---

### Edge Cases

- Souvenir dated in the future → allowed only up to today; future plans belong to typed lists (to-do intent), not memories.
- Souvenir linked to an item later deleted → the souvenir stays; the link shows as "élément supprimé" and is removable.
- 29 February souvenirs in non-leap years → surfaced on 28 February in **Ce jour-là**.
- Same achievement rule crossed on two offline devices → deterministic ID per (user, rule, threshold) so sync merges to one.
- Goal period changes after creation → progress recomputes; reflections kept.
- Very large history (thousands of entries) → timeline paginates by month; must stay responsive offline.
- Timezone: calendar days use the same rules as récap (011), default `Europe/Paris`.

## Requirements *(mandatory)*

### Functional Requirements

**Souvenirs**

- **FR-001**: Users MUST be able to create a souvenir with a required title and date (default today, backdatable, not in the future).
- **FR-002**: A souvenir MAY have free text, a mood (same mood set as books/films discovery), a place (free text), a favourite flag, and links to zero or more existing items of any domain except shopping.
- **FR-003**: Souvenirs MUST be capturable from global quick-add in at most three taps plus typing the title (foundation capture-speed principle).
- **FR-004**: Souvenirs MUST work offline and sync with the foundation's per-field latest-write-wins rules, including soft delete with undo.
- **FR-005**: Items linked from a souvenir MUST show a "Souvenirs liés" section on their detail screen.
- **FR-006**: Souvenirs MUST be included in global search by title (and place).

**Fil de vie**

- **FR-007**: The system MUST provide a Fil de vie view listing souvenirs, réalisations, completed goals and the domain completion events used by récap (011), newest first, grouped by day.
- **FR-008**: Fil de vie MUST be **derived** from source data (no duplicated event copies) so edits/deletions in domains are reflected.
- **FR-009**: Users MUST be able to filter Fil de vie by domain and jump to a year/month.
- **FR-010**: Fil de vie MUST be reachable from primary navigation.

**Ce jour-là**

- **FR-011**: Accueil MUST show a dismissible **Ce jour-là** card when souvenirs or réalisations exist on the same month/day in prior years (max 3 entries).
- **FR-012**: Dismissal MUST last for the current calendar day on that device; a settings toggle MUST disable the card entirely.

**Objectifs (goals)**

- **FR-013**: Users MUST be able to create a goal with a title, a period (week, month, quarter, year, or custom dates), and either a **measurable target** (domain signal + count) or a **manual target** (count of check-ins, or done/not done).
- **FR-014**: Measurable goals MUST compute progress automatically from local domain data for: books read, films/episodes watched, recipes cooked, workouts completed, music practice sessions, souvenirs added.
- **FR-015**: Users MUST be able to add dated check-ins (with optional note) to manual goals.
- **FR-016**: Users MUST be able to add a reflection to a goal at any time, prompted (dismissibly) when its period ends.
- **FR-017**: Existing book/film year goals (002/003) MUST appear in Objectifs with their progress, without data migration in v1.
- **FR-018**: Goals MUST be archivable and deletable; copy MUST never frame unmet goals as failure.

**Réalisations (achievements)**

- **FR-019**: The system MUST evaluate a fixed, versioned set of local achievement rules over domain data and create réalisations when thresholds are crossed.
- **FR-020**: Auto réalisations MUST have deterministic identities so the same achievement is never duplicated across devices.
- **FR-021**: Earned réalisations MUST NOT be revoked automatically.
- **FR-022**: Users MUST be able to add manual réalisations (title, date, optional text and links) and delete any réalisation.
- **FR-023**: A newly earned réalisation MUST show a short, dismissible celebration; no locked-badge grids, points, or levels.

**Récap integration**

- **FR-024**: Monthly and yearly récap (011) MUST include a **Moments forts** section with favourite souvenirs first, then other souvenirs, réalisations and completed goals for the period; hidden when empty.

**Tone & privacy**

- **FR-025**: All copy MUST pass the 009 no-guilt / no-comparison review (no streak loss, no "you haven't…", no leaderboards).
- **FR-026**: All data MUST be private to the user; no sharing features in v1.

### Key Entities

- **Souvenir**: a remembered moment owned by a user — title, date, optional text, mood, place, favourite flag, links to items; synced and soft-deletable like other items.
- **Lien de souvenir**: association between a souvenir and an existing item (any domain except shopping).
- **Objectif**: a personal goal — title, period, target type (measurable domain signal + count, check-in count, or done/not done), status (active/archived/completed), optional reflection.
- **Check-in**: a dated manual progress entry for an objectif, with optional note.
- **Réalisation**: an achievement — origin (auto rule id + threshold, or manual), title, date earned, optional text, links to triggering items.
- **Timeline entry** *(derived, not stored)*: a projection over souvenirs, réalisations, goals and domain completion events.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can capture a souvenir (title only) in under 10 seconds from any screen, offline included.
- **SC-002**: Fil de vie opens and shows the current month in under 1 second with 5 years of mixed history on a mid-range phone, offline.
- **SC-003**: 100% of measurable goal types update progress within 1 second of the matching domain change, without manual input.
- **SC-004**: Zero duplicate réalisations after concurrent offline completion on two devices (verified by e2e sync scenario).
- **SC-005**: All new user-facing copy passes the 009 tone checklist (no guilt, no comparison) before release.

## Assumptions

- Photos/attachments, sharing, export, and notifications are out of scope for v1.
- Achievement rules ship as code (versioned list); user-defined rules are out of scope.
- Récap (011) completion signals are the source of truth for domain events in the timeline; any domain not covered by récap is not in the timeline either.
- French-first UI; terms: **Souvenir(s)**, **Fil de vie**, **Ce jour-là**, **Objectifs**, **Réalisations**, **Moments forts**.

## Out of Scope (v1)

- Photos, audio, or file attachments on souvenirs
- Social features, sharing, public profiles, comparisons
- Push/email notifications and reminders
- Coaching plans, AI-generated advice, or habit streaks outside fitness's opt-in assiduity (008)
- Migrating book/film year goals into the new goal model

## References

- [009 — north star](../009-experiences-achievements/spec.md)
- [011 — periodic récap](../011-periodic-recap/spec.md)
- [014 — activity suggestions](../014-activity-suggestions/spec.md)
- [Constitution](../../.specify/memory/constitution.md)
