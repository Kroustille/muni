# Feature Specification: Fitness — séance library, session logging, and progression

**Feature directory**: `specs/008-fitness-training/`

**Feature Branch**: `008-fitness-training` (spec branch: `feature/fitness-spec`)

**Created**: 2026-10-19

**Status**: Draft

**Input**: Valentin wants a **fitness-focused slice** of the Muni life companion: maintain a **library of reusable séances** (session templates), **start any séance anytime** (“do now”), optionally **planifier** a séance on a **specific calendar date**, log workouts with **precise detail** (exercises from a **curated catalog**, sets, reps, weight, duration, RPE — exact MVP fields TBD), see **progression over time**, and sensible **holistic companion** touches (recovery, habits, motivation) without over-scoping the first release.

**Depends on**: Muni foundation (`001-typed-lists-companion`) — auth, offline-first sync, French UI, home overview patterns, search, and per-user privacy.

**Relationship to Muni**: Fitness is a **new typed domain** alongside books, films, recipes, and shopping — not a generic notes app. It reuses companion principles (fast capture, optional fields, private data, sync) but has its own entities and interactions tuned to training.

## Constraints & decisions (2026-10-19)

Decisions from Valentin (locked). MVP product defaults below were **validated in production** — Valentin **2026-10-28**.

### Locked

| Topic | Decision |
|-------|----------|
| **Apple Health / Garmin** | **Not mandatory.** Optional future integration only. No HealthKit, Google Fit, Garmin Connect, or other wearable APIs in MVP (Phases A–C) or Phase D unless explicitly replanned. |
| **French-only UI** | **Confirmed.** All fitness labels, help text, and empty states are in **French**, consistent with Muni’s norm (`fr.json` / `t(key)`). No separate i18n or English UI for this module beyond what 001 already requires. **Exercise display names** come from the curated catalog (`nameFr`); English names are **search aliases only**, not shown in the UI. |
| **Offline mobile** | **Mandatory.** Fitness MUST follow the same **offline-first + sync** model as other Muni typed lists: local persistence (IndexedDB), outbound sync queue while offline, background push/pull when online, per-field last-write-wins and soft deletes per foundation constitution — not a online-only submodule. |
| **Exercise catalog (MVP)** | **Curated list only** — no user-defined custom exercise names in Phases A–C. Planning and logging **pick from the shipped catalog** (versioned seed; see [Exercise catalog](#exercise-catalog-mvp)). Users cannot create ad-hoc exercise strings in MVP. |

### Locked product defaults (2026-10-28 — confirmed shipped)

| # | Topic | Default encoded in this spec |
|---|--------|------------------------------|
| 1 | **MVP precision floor** | **Strength**: each logged set MAY include reps and charge when the user wants precision; neither is required to save. **Timed work**: duration on the set is the primary field. User MAY mark a workout **Terminé** without logging every set or every planned exercise (habit completion without full detail). |
| 2 | **Cardio** | No separate cardio app or session type in Phases A–B. Cardio fits the **generic set model**: duration required for meaningful cardio rows; optional **distance note** (free text, e.g. “5 km”) on the set or exercise row — not a dedicated GPS/map feature. |
| 3 | **Séance seed** | **Manual entry only** for MVP (user builds séance templates in-app). A one-time **starter séance template** pack (static seed) is **out of MVP** — defer to Phase D or an explicit plan/tasks item. |
| 4 | **Navigation** | Fitness is a **typed domain with a dedicated primary navigation entry**, same prominence pattern as books/recipes in 001 (reachable from the main app shell without burying under Settings). Exact route label and icon are for planning (`ui-routes` contract). |
| 5 | **Exercise selection** | **Catalog picker** with search on French labels and English aliases (FR-026). **Recently used** exercises surface first. Catalog updates ship with app releases (`catalogVersion` bump); historical logs keep their stored `exerciseId` + display snapshot. |

## Clarifications 2026-10-28 (session-first)

Valentin **changed product direction** (2026-10-28). The spec below reflects the **session-first** model; it **replaces** the earlier default UX of “one active weekly program with weekday slot assignments” as the primary anchor (former User Story 1).

| Topic | Decision |
|-------|----------|
| **Primary object** | User **creates séances** (session templates): **title** + ordered **catalog exercises** (optional default sets/reps/notes). Séances live in a **personal library** — not tied to Monday/Wednesday recurring slots. |
| **Do now** | User picks **any** séance from the library → **Démarrer** → optional in-session logging → **Terminé** (same precision floor as locked defaults: completion without full set detail remains valid). |
| **Optional schedule** | User **may** attach **one specific séance** to **one specific calendar date** they choose (**planifier** — one-off or explicit date). This is **not** “assign this séance to every Wednesday”. |
| **Rejected as default UX** | One **active training program** with **multiple planned sessions on weekdays of the week** (legacy Phase A / US1). No requirement for a single “active program” container in MVP. |
| **Séance libre** | Unplanned workouts merge into **“start any séance anytime”**: ad-hoc start without a saved template remains supported (French label **Séance libre** or equivalent). |
| **Shipped code on `main`** | Implementation may still expose weekly-program UI from an earlier batch; **this spec is the target**. Migration intent is documented in [research.md](./research.md) §11. |

**French UI terms (locked for this module)**: **séance** (template and live workout context), **bibliothèque** or **Mes séances** (library surface — exact nav copy in planning), **planifier** (attach to a date), **Démarrer**, **Terminé**, **Passer** (skip a **scheduled** séance for that date).

## Product scope (phased)

| Phase | Theme | Intent |
|-------|--------|--------|
| **A — Library & today** | Séance template library, **do now** (start any séance), optional **planifier** on a chosen date, today’s scheduled séance(s), Terminé / Passer | MVP core: user can train immediately and optionally see what they chose for today |
| **B — Log & precision** | In-session logging: catalog exercises, sets, reps, load, optional duration and RPE | Delivers “precise training” with a consistent exercise vocabulary |
| **C — Progression** | History, per-exercise trends, personal records | Answers “am I getting stronger/fitter?” |
| **D — Companion** | Recovery check-in, adherence streak (no guilt), home card, light motivation | Holistic life companion angle; small, optional surfaces |

Phases **A–C** are the **MVP product** for this feature. Phase **D** ships only after A–C are usable end-to-end, unless a slice of D is trivial (e.g. home card count) and explicitly pulled into the same delivery batch in planning.

## User Scenarios & Testing *(mandatory)*

### Phase A — Library & today

### User Story 1 - Build a library of séance templates (Priority: P1)

A signed-in user **creates and maintains séances** in a personal library. Each **séance template** has a **title** and an ordered list of **template exercises** (each row references a **catalog exercise**; optional default sets/reps/notes). Séances are **reusable** and **not** bound to weekdays. The user can edit, reorder, duplicate, or delete templates; **past completed workout logs** are never deleted when templates change.

**Why this priority**: Without reusable séances, “do now” and optional **planifier** have nothing to point at.

**Independent Test**: Create three séance templates with catalog exercises, reopen the app offline, and confirm the library persists and opens for edit.

**Acceptance Scenarios**:

1. **Given** no séances yet, **When** the user creates a séance with a title and at least one catalog exercise (manual entry; no template import in MVP), **Then** it appears in **Mes séances** (or equivalent French library label).
2. **Given** a séance template, **When** the user adds an exercise from the catalog picker, **Then** it appears in that séance’s list in order with the French display name.
3. **Given** multiple séances, **When** the user reorders them in the library (if supported) or reorders exercises within one séance, **Then** order is stable after save.
4. **Given** the user edits a template (rename, reorder exercises, change default hints), **When** they save, **Then** future starts use the updated template and **past logged workouts** still show what was actually performed.
5. **Given** the user is offline, **When** they create or edit séance templates, **Then** changes are saved locally immediately.

---

### User Story 2 - Start a séance, complete or skip scheduled (Priority: P1)

The user opens the fitness area and can **Démarrer** training in three ways: (**a**) pick **any séance** from the library (**do now**), (**b**) start from a **séance planifiée** for **today** (if they attached one to this calendar date), or (**c**) start a **Séance libre** (no saved template). In-session behavior and **Terminé** rules match Phase B precision defaults. For a **planifiée** séance on today’s date only, the user may **Passer** with an optional short note instead of starting. Completed and skipped instances appear in **recent activity**.

**Why this priority**: Immediate follow-through (“I’m at the gym now”) is the primary habit loop; optional scheduling supports planning without recurring weekday programs.

**Independent Test**: Create a séance, **Démarrer** from the library without a scheduled date, mark **Terminé** without logging sets, and see it in history as completed; separately **planifier** the same séance on a test date and **Passer** from today’s view.

**Acceptance Scenarios**:

1. **Given** a séance **planifiée** for today’s calendar date, **When** the user opens fitness home, **Then** that séance is highlighted as **À faire** (or equivalent French label).
2. **Given** a séance template (scheduled or not), **When** the user taps **Démarrer**, **Then** a workout log opens pre-filled with the template’s catalog exercises in order (title defaults from template).
3. **Given** an in-progress workout, **When** the user marks the workout **Terminé** (with or without per-set reps/charge/duration logged), **Then** it is stored with completion timestamp and shown in history.
4. **Given** today’s **planifiée** séance, **When** the user chooses **Passer** with an optional note, **Then** the date is recorded as skipped without a full log (linked to the scheduled instance / template id).
5. **Given** no séance **planifiée** for today, **When** the user opens fitness home, **Then** they see a helpful empty state and can **Démarrer** any library séance or a **Séance libre** from clear entry points.
6. **Given** the library, **When** the user **planifier** a séance on a future date they pick, **Then** only that date shows the scheduled item (not a recurring weekday rule).

### Phase B — Log & precision

### User Story 3 - Log sets, reps, load, duration, and RPE (Priority: P1)

During or after a workout, the user records **per-exercise** work: one or more **sets**, each with optional **repetitions**, **charge** (weight), **durée** (for timed or cardio work), optional **note de distance** (free text, e.g. kilometres), and **RPE** (1–10 scale). For strength, reps and charge are encouraged when precision matters but are not required on every set. For cardio, duration is the primary field; distance is optional text, not GPS. Each logged exercise row MUST reference a **catalog exercise** (`exerciseId`); set details remain optional to respect capture speed. The user can add **other catalog exercises** not in the plan mid-workout.

**Why this priority**: “Precise training” is the differentiator from a simple checklist.

**Independent Test**: Log one exercise with three sets (varying reps and weight), one timed exercise with duration only, save offline, reload, and confirm values.

**Acceptance Scenarios**:

1. **Given** a workout log, **When** the user adds a set with reps and charge, **Then** the set is stored and displayed in order under that exercise.
2. **Given** a workout log, **When** the user adds a set with only duration, **Then** reps/charge may remain empty without blocking save.
3. **Given** a workout log, **When** the user sets RPE on a set, **Then** only values 1–10 are accepted (integer).
4. **Given** template exercises were pre-filled, **When** the user deletes an exercise or adds a new one, **Then** the log reflects the actual session, not the original template snapshot only (template is a starting point; log is truth for that day).
5. **Given** the user is offline, **When** they log sets, **Then** all data is available immediately and syncs when online.

---

### User Story 4 - Find exercises quickly and reuse sessions (Priority: P2)

When adding an exercise to a **séance template** or log, the user opens a **catalog picker** with search (French labels and English aliases, case- and accent-insensitive) and filters (muscle category, equipment, modality). **Recently used** catalog exercises appear at the top. They can duplicate a **previous workout** as a starting point for today’s session or save it as a new séance template.

**Why this priority**: Fast selection during training without free-text typos; aligns with Muni capture-speed principle.

**Independent Test**: Log “Squat à la barre” once; on a new workout, search “squat” and pick from catalog; duplicate last week’s workout and confirm exercises copy by `exerciseId`.

**Acceptance Scenarios**:

1. **Given** the catalog contains “Soulevé de terre”, **When** the user searches “deadlift” or “soul”, **Then** the matching catalog entry is offered and selectable.
2. **Given** prior logs using “Soulevé de terre”, **When** the user opens the picker without typing, **Then** that exercise appears in **Récemment utilisés** (or equivalent French label).
3. **Given** a completed workout in history, **When** the user chooses **Dupliquer comme modèle**, **Then** a new draft log or **séance template** is created with the same catalog exercises and optional default set counts, not linked as the same historical record.
4. **Given** the user attempts to add an exercise, **When** they cannot find a match in the catalog, **Then** there is **no** free-text “create exercise” path in MVP (empty state explains the fixed list; future feedback channel is out of scope).

---

### Phase C — Progression

### User Story 5 - View history and progression per exercise (Priority: P1)

The user browses **past workouts** (by date, newest first) and opens any session to see full detail. For a given **catalog exercise** (`exerciseId`), they open a **progression** view showing recent sessions (for example last 8 occurrences): best set volume or max charge, and simple trend cues (e.g. “charge max en hausse” when last max exceeds previous). **Records personnels** (PR) for max charge and max reps at a given charge are highlighted when a new best is logged. Display uses the current catalog French name when the id still exists; otherwise the **name snapshot** stored on the log.

**Why this priority**: Progression over time was an explicit goal.

**Independent Test**: Log the same exercise across three workouts with increasing weight; open progression and confirm max charge updates and PR badge on the third.

**Acceptance Scenarios**:

1. **Given** multiple completed workouts, **When** the user opens history, **Then** workouts are listed by date with session title and duration or exercise count summary.
2. **Given** an exercise logged at least twice, **When** the user opens progression for that name, **Then** they see a chronological list of sessions with key metrics per visit.
3. **Given** a new set exceeds previous max charge for that exercise, **When** the workout is saved, **Then** the UI indicates a new PR (non-blocking, no share).
4. **Given** the catalog French label changes in a later app version, **When** viewing progression for an `exerciseId`, **Then** the UI shows the **current** catalog label while historical log rows may show the snapshot taken at log time on detail views.

---

### User Story 6 - Weekly adherence overview (Priority: P2)

The user sees a **calendar or week strip** for the current week: **planifiée** séances (explicit dates) vs completed vs skipped vs **libre** completions. This is informational only — no punitive notifications.

**Why this priority**: Supports “how often did I train this week?” at a glance without a recurring weekday program engine.

**Independent Test**: **Planifier** four séances on four distinct dates in a week, complete two, skip one; week view shows correct states.

**Acceptance Scenarios**:

1. **Given** séances **planifiées** on dates in the current week, **When** the user opens the week view, **Then** each scheduled date shows status (à faire, fait, passé, or libre for unplanned completions).
2. **Given** a skipped scheduled séance, **When** shown in the week view, **Then** it is visually distinct from completed.

---

### Phase D — Companion (holistic, minimal)

### User Story 7 - Optional recovery check-in (Priority: P3)

After marking a workout complete (or from fitness settings), the user may record a **optional recovery check-in**: sleep quality (1–5), energy (1–5), muscle soreness (1–5), and a short note. Entries appear on the workout detail and in a simple **7-day recovery strip** — not medical advice.

**Why this priority**: Life-companion angle without scope of a health platform.

**Independent Test**: Complete a workout, add recovery scores, see them on detail and on a week strip.

**Acceptance Scenarios**:

1. **Given** a completed workout, **When** the user adds recovery fields, **Then** values are optional and savable offline.
2. **Given** recovery entries exist, **When** the user views the workout, **Then** scores and note are visible.

---

### User Story 8 - Training streak and home overview (Priority: P3)

If the user enables **Suivi d’assiduité** in fitness settings, the app shows a **non-guilt** streak: consecutive calendar weeks with at least one completed workout (configurable minimum, default 1). The Muni **home** screen gains a fitness card with this week’s completed count and the **next planifiée séance** (by date) when one exists.

**Why this priority**: Motivation and discoverability from the rest of the companion app.

**Independent Test**: Enable streak; complete one workout per week for two weeks; streak shows 2; disable streak and confirm it hides.

**Acceptance Scenarios**:

1. **Given** streak disabled by default, **When** the user enables it, **Then** streak is calculated only from completed workouts, not skipped days.
2. **Given** items on home, **When** the user has at least one séance or log, **Then** the fitness card shows sessions completed this week and the next upcoming **planifiée** séance title and date (if any).

---

### Edge Cases

- User changes timezone or travels: workout timestamps store **local calendar date** the user saw when logging, plus UTC instant for ordering/sync (**planifier** uses explicit calendar dates, not weekday recurrence).
- Two devices log different workouts offline on the same day: both logs persist; “today” may show multiple in-progress unless product limits one in-progress per day (default: **allow one in-progress**; starting a new one prompts to finish or abandon the other).
- Catalog exercise removed in a later version: logs retain `exerciseId` + snapshot; progression remains keyed by id; UI shows “exercice archivé” or snapshot name (exact copy in séance templates).
- User requests an exercise not in the catalog: **no custom exercise** in MVP; product may add a feedback link later, not in this spec.
- User deletes a completed workout: **soft delete** with undo (same as other lists).
- Séance template has zero exercises: user can still **Démarrer** and add exercises ad hoc.
- Extremely long workouts (50+ sets): UI remains usable; no hard cap in spec beyond reasonable performance (see success criteria).
- Skipped and completed for the same **planifiée** slot on the same day: last explicit action wins for week status display.
- Strength vs cardio in one session: supported via per-set duration and optional exercise **type** label (force, cardio, mobilité) — all optional.

## Requirements *(mandatory)*

### Functional Requirements

**Foundation (inherits 001 — stated for fitness context)**

- **FR-001**: Fitness data MUST obey the same offline-first rules as 001: all fitness reads and writes go through the local store (IndexedDB); changes queue for sync while offline; sync runs in the background when online; merge and soft-delete semantics match the foundation; expired session MUST NOT block local fitness data.
- **FR-002**: Fitness data MUST be private per user with the same isolation guarantees as other lists.
- **FR-003**: User-facing fitness strings MUST be in French only, via the same i18n layer as the rest of Muni (`fr.json`); no additional locales for this module in MVP.
- **FR-004**: Fitness MUST be reachable from a **dedicated primary navigation entry** in the app shell (same class of prominence as typed list destinations such as books and recipes in 001).

**Séance library & scheduling**

- **FR-010**: The system MUST allow users to create, edit, reorder, and soft-delete **séance templates** in a personal library. There is **no** requirement for exactly one “active program” container in MVP.
- **FR-011**: Each **séance template** MUST have a title and an ordered list of **template exercises**; each row MUST reference a valid **`exerciseId`** from the active catalog version. Templates MUST **not** embed recurring weekday rules (no “every Monday” on the template itself).
- **FR-012**: Each template exercise row MUST reference **`exerciseId`**; optional template hints (default set count, target reps, notes) are allowed.
- **FR-013**: Users MUST be able to edit or delete séance templates and template exercises without deleting historical workout logs.
- **FR-014**: Users MUST be able to **planifier** optionally: attach **one séance template** to **one explicit calendar date** (one scheduled instance per user-chosen date; multiple séances on the same date allowed in stable order). Scheduling MUST NOT create implicit weekly recurrence.

**Daily use & logs**

- **FR-020**: The fitness home MUST surface (**1**) any séance **planifiée** for **today’s** calendar date with actions to **Démarrer** or **Passer**, (**2**) clear access to **Démarrer** any library séance (**do now**), and (**3**) **Séance libre** when the user wants no template.
- **FR-021**: Starting from a séance template (scheduled or from library) MUST create a **workout log** linked to the **séance template id** and calendar date; **Séance libre** logs have no template link.
- **FR-022**: A workout log MUST support status: **en cours**, **terminé**, or **abandonné** (abandoned logs do not count as completed for adherence).
- **FR-023**: **Passer** on a **planifiée** séance for a given calendar date MUST record a **skip** entry with date, reference to the scheduled instance (or template + date), and optional note.
- **FR-024**: Workout logs MUST contain ordered **logged exercises**, each with ordered **sets** supporting optional fields: repetitions (non-negative integer), charge (non-negative number with user’s preferred unit), durée (seconds or minutes — single convention in UI), optional distance **note** (free text for cardio), RPE (integer 1–10). Marking a workout **terminé** MUST NOT require every planned exercise to have at least one fully detailed set.
- **FR-025**: Users MUST be able to add, edit, reorder, and remove exercises and sets during a workout.
- **FR-026**: Adding an exercise MUST use a **catalog picker**: search matches **`nameFr`** and **`nameEn`** (case- and accent-insensitive substring); optional filters by **category**, **equipment**, and **modality**; **recently used** `exerciseId`s MUST be surfaced first when the search box is empty.
- **FR-027**: The app MUST ship the MVP catalog **offline** (bundled seed or local store populated on first launch — see data model); users MUST NOT depend on network to list or search exercises.
- **FR-028**: **Custom exercises** (user-defined names outside the catalog) MUST NOT be creatable in MVP; missing exercises are handled via a future catalog release, not free text.

**Progression & history**

- **FR-030**: Users MUST browse completed and skipped activity in reverse chronological order.
- **FR-031**: Users MUST open a **progression** view per **`exerciseId`** showing metrics from historical logs.
- **FR-032**: The system MUST detect and surface **personal records** for max charge and max reps at a given charge per **`exerciseId`** when a new log is saved (informational only).

**Companion (Phase D)**

- **FR-040**: Optional post-workout **recovery check-in** MUST support sleep, energy, and soreness (1–5) and optional note.
- **FR-041**: Optional **assiduity streak** MUST be opt-in, week-based, and hideable; it MUST NOT send push notifications in this feature.
- **FR-042**: Home overview MUST include a fitness summary card when the user has ever created a séance template or workout log.

**Cross-cutting**

- **FR-050**: Deleting a workout, séance template, or scheduled instance MUST use immediate delete with short-lived **Annuler** undo, consistent with 001.
- **FR-051**: Fitness entities MUST participate in sync with per-field last-write-wins semantics and soft deletes, consistent with the constitution.
- **FR-052**: Text search across Muni MAY include fitness session titles and exercise names in a later iteration; not required for MVP if fitness has its own history search (MVP: **in-fitness search** on exercise names and session titles).

### Out of Scope (this feature)

- Public social feeds, sharing workouts, or coach/client multi-user accounts.
- Built-in video library, animated form guides, or **live** third-party exercise APIs during workouts (MVP uses a **bundled** catalog file, not runtime database calls).
- **User-defined custom exercises** or community-submitted exercise libraries in MVP.
- Automatic program generation, AI coaching, or **wearable / health platform import** (Apple Health, HealthKit, Google Fit, **Garmin Connect**, etc.) — optional future integration only; not MVP.
- Static **starter program templates** or import-from-file for the first séance (MVP is manual séance entry; bundled templates deferred to Phase D or planning).
- **Weekly program-first UX**: one active **training program** with **multiple sessions assigned to weekdays** as the default onboarding or primary navigation anchor (superseded 2026-10-28; see Clarifications). Recurring “every Tuesday” rules without explicit dates are out of scope for MVP.
- Nutrition tracking, body-composition analysis, or medical diagnoses.
- Rest timers, audio cues, and live GPS running maps (may be considered later).
- Multiple simultaneously active **programs**, mesocycle periodization engines, or RPE-based auto-regulation algorithms.
- Push notifications and calendar app integration (export may be considered later).
- Imperial/metric per-exercise mixing (user picks one global preference; see assumptions).

### Key Entities

- **Séance template** (session template): User-owned library item: title, ordered template exercises, created/updated metadata, soft-delete marker. **Not** tied to weekdays.
- **Template exercise**: Belongs to séance template; `exerciseId` (required); optional default set count, target reps, notes.
- **Scheduled séance** (optional calendar link): User-chosen **calendar date** + reference to one **séance template**; may include sort order when multiple on same date. **Not** a recurring weekday rule.
- **Exercise catalog entry** (read-only, versioned): Stable `id` (kebab-case slug); `nameFr` (UI); `nameEn` (search alias); `category` (primary muscle or intent); `equipment[]`; `modality` (`strength` | `cardio` | `mobility`); optional `tags[]` (movement pattern). Source file: `exercises.catalog.json` in this feature directory; implementation copies into local store with `catalogVersion`.
- **Workout log**: A concrete instance on a calendar date; optional link to **séance template id** (and optional scheduled instance id when started from **planifiée**); status; start/end timestamps; optional recovery check-in; `catalogVersion` at creation (for audit).
- **Logged exercise**: `exerciseId` (required); `nameFrSnapshot` (required at save — display if catalog label changes); optional type tag derived from catalog `modality`; ordered sets.
- **Set**: Optional reps, charge, duration, optional distance note (text), RPE; order index.
- **Skip record**: Calendar date, reference to scheduled séance / template, optional note.
- **Personal record (derived)**: Per `exerciseId`, cached or computed bests for display (not a separate user-edited entity).

**Legacy naming (implementation on `main`)**: Earlier specs and code may use **training program**, **planned session**, and **weekdays[]** on sessions. New work SHOULD align with **séance template** + **scheduled séance**; migration notes in [research.md](./research.md) §11.

## Exercise catalog (MVP)

Valentin requested a **finished exercise list** (not free-text-only). MVP ships a **curated, versioned catalog** the user picks from when building **séance templates** or logging sets.

### Artifact

- **File**: [`exercises.catalog.json`](./exercises.catalog.json) — canonical seed for planning; **121** exercises at `version: 1` (2026-10-19).
- **Schema** (each item): `id`, `nameFr`, `nameEn`, `category`, `equipment[]`, `modality`, optional `tags[]` (e.g. `push`, `pull`, `squat`, `hinge`, `core`, `cardio`).
- **Categories** (`category`): `pectoraux`, `dos`, `épaules`, `biceps`, `triceps`, `avant-bras`, `quadriceps`, `ischio-jambiers`, `fessiers`, `mollets`, `abdominaux`, `corps entier`, `cardio`, `mobilité`.
- **Equipment** values (closed enum for MVP): `poids du corps`, `barre`, `haltères`, `machine`, `câble`, `kettlebell`, `banc`, `bande élastique`, `vélo`, `rameur`, `tapis`, `accessoire`, `aucun`.
- **Implementation note** (for planning only): load catalog into IndexedDB (or equivalent) on upgrade when `catalogVersion` increases; do not fetch exercises from the network at runtime.

### Custom exercises

**Not allowed in MVP.** Users cannot type a new exercise name. Expanding the list is a **product/data release** (bump `version`, migration/seed), not an in-app create flow.

### Research sources (names + coverage, not verbatim DB copy)

The list was composed for gym + bodyweight + common machines + cardio/mobility staples, cross-checked against public references:

| Source | URL | Use in this catalog | License / notes |
|--------|-----|---------------------|-----------------|
| Wikipedia — *List of weight training exercises* | https://en.wikipedia.org/wiki/List_of_weight_training_exercises | Movement coverage table (push/pull/legs/core staples) | CC BY-SA 4.0 — article text not copied wholesale; exercise **names** are common fitness vocabulary |
| U.S. CDC — *What counts as physical activity* | https://www.cdc.gov/physical-activity-basics/adding-adults/what-counts.html | Cardio modality names (walking, running, swimming, cycling, etc.) | U.S. government public domain / CDC site terms |
| HHS — *Physical Activity Guidelines for Americans*, 2nd ed. (via CDC PDF) | https://www.cdc.gov/physical-activity/media/pdfs/Physical_Activity_Guidelines_2nd_edition.pdf | Aerobic + muscle-strengthening activity examples | U.S. government work |
| wger Workout Manager (reference only) | https://wger.de/ | Cross-check of common strength exercise naming; **not** imported as a bulk dataset | Per-exercise CC BY-SA 3.0/4.0 or CC0 on wger — **this repo file is an original curated subset**, not a wger dump |

**Licensing caveat for Valentin**: Muni’s catalog is a **small original seed** inspired by public lists and common gym terminology. It is **not** a scrape of wger, ExerciseDB, or commercial apps. If we later import third-party exercise *descriptions*, images, or large datasets, each source’s attribution and share-alike terms must be reviewed separately. French display strings were authored for Muni; English strings aid search only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create **three séance templates** and **Démarrer** one from the library in **under 2 minutes** on first use (guided empty states).
- **SC-002**: A user can **Démarrer** a séance and mark a workout **terminé** in **under 90 seconds** after opening the log (excluding actual gym time), either with quick detail (e.g. one exercise and one set) or with **no sets logged** (completion-only path per User Story 2).
- **SC-003**: With no network, a user can complete a full log with five exercises and fifteen sets; after reconnect, **100%** of fields appear on a second device within 10 seconds under normal test conditions.
- **SC-004**: Progression view loads recent history for an exercise with **20 past sessions** in **under 1 second** on a mid-range phone.
- **SC-005**: In isolation testing, **0** fitness records are visible across two user accounts.
- **SC-006**: At least **80%** of pilot users (self-use + one friendly tester) report they can **train when they want** and see **planifiée** séances for today without using another tool.

## Assumptions

- Primary user is Valentin (or same persona as Muni): self-coached, reusable séances, mobile-first logging between sets.
- **Session-first**: library of séance templates is the planning primitive; **planifier** is optional and date-specific.
- **Charge** is stored as a number with a user-level preference **kg** (default) or **lb**, set in fitness or global settings; display uses one unit throughout.
- **Duration** is stored in seconds internally; UI may show minutes for entries over 60s.
- **RPE** uses the common 1–10 integer scale; help text is brief and in French.
- Week starts **Monday** for adherence views (align with French locale convention); configurable week start is out of scope unless trivial in implementation planning.
- Fitness appears as a **dedicated primary navigation entry** (locked 2026-10-19); route and label are defined in planning, mirroring how 001 exposes typed lists.
- First séances are **created manually** in MVP; no bundled template seed.
- Cardio is modeled with **duration + optional distance note** on sets, not a separate product surface.
- Historical analytics are **descriptive**, not prescriptive (no “you failed your program” messaging).
- Constitution technology constraints apply; this spec does not prescribe schema or routes.

## Dependencies

- `001-typed-lists-companion`: authentication, sync, undo delete, French UI, home cards pattern.
- **Bundled exercise catalog** (`exercises.catalog.json`) — no third-party fitness API at runtime for MVP.
