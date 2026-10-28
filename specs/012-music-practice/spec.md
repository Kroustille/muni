# Feature Specification: Music practice — compositions, DJ sets & instrument learning

**Feature directory**: `specs/012-music-practice/`

**Feature Branch**: `012-music-practice`

**Created**: 2026-10-28

**Status**: Specified — product decisions locked **2026-10-28** (Valentin)

**Input**: Valentin wants to **track what he does in music** through **three distinct workflows**: (1) **music composition** — creating original work with its own lifecycle; (2) **DJ sets** — logging performances with a separate lifecycle; (3) **instrument learning / apprentissage** — planning **technical exercises** (études, gammes, drills — user-named) and tracking **specific pieces or tracks being learned**, separate from the **004** listen-list and from **Workflow A** composition projects. French UI, offline-first, companion tone (**no guilt**), aligned with Muni typed-domain patterns.

**Depends on**: Muni foundation (**001**) — auth, offline-first sync, French UI, quick-add capture speed, per-user privacy.

**Relationship to music library ([004](../004-music-artists-tracks/spec.md))**: **[004](../004-music-artists-tracks/spec.md) is discovery and consumption** — artists to discover, tracks to listen to, MusicBrainz catalog, Spotify/SoundCloud deep links, `to_listen` / `listened` status. **012 is creative practice and performance logging** — compositions in progress and DJ sets performed. Same product area (music) but **different typed domains**, analogous to **[010](../010-recipe-source-book/spec.md) cookbooks vs [002](../002-books-library/spec.md) books-to-read**: no shared item type, no required cross-link; optional references only (see FR-012).

**Why feature 012 (not merge into 004)**: 004’s entities, statuses, and UX are tuned to **catalog-backed library rows** and external listening links. Composition and DJ workflows need **different states, fields, and screens** (sketch → mixdown; planned set → performed setlist). Merging would blur “track I listened to” with “track I produced” and overload 004’s `listened` semantics. A dedicated spec keeps domains authoritative per [009](../009-experiences-achievements/spec.md).

**Serves**: [009](../009-experiences-achievements/spec.md) north star — **registering creative work and performance** as personal experience and achievement, without guilt copy or social feeds.

**Future link to [011](../011-periodic-recap/spec.md)**: **011** includes **Musique** recap lines from **012** completion timestamps — **`finishedAt`** (composition **Terminé**), **`performedAt`** (set **Joué**), **`practicedAt`** on **`practice_log`** (mark **Fait** / ad-hoc). **012 v1** persists those fields; **011** implements aggregation contributors ([011 tasks](../011-periodic-recap/tasks.md) T1195–T1196). **`learning_piece` → `comfortable`** alone is **not** recap-eligible in MVP (logs only).

## Decision summary (MVP)

| Topic | Decision |
|-------|----------|
| **Three workflows** | **Separate typed lists** under one **Musique — pratique** area (hub with three top-level tabs: **Compositions**, **Sets DJ**, **Apprentissage**). **Apprentissage** is **one screen** with vertical **sections** (Aujourd’hui, Plan, Exercices, Répertoire) — **not** separate Plan/Répertoire sub-tabs (Valentin **2026-10-28**). |
| **Apprentissage vs 004** | **004** = discovery and **listening** (`to_listen` / `listened`). **Apprentissage** = **learning/practice repertoire** and exercise planning. Optional **one-way** link from a **learning piece** row to a **004** `music_track` id (“the piece I’m learning”) — **does not** change track listen status. |
| **Apprentissage vs composition** | **Composition** = original work lifecycle (Idée → Terminé). **Learning piece** = studying an existing work (score, transcription, cover) with **progress**, not production status. Same hub, **different entity types and screens**. |
| **Capture speed** | Each workflow: **title required** to save; all other fields optional on first save (constitution II). |
| **Audio** | **No in-app playback**, **no file upload/hosting** in v1 (same spirit as 004 MU-scope). Optional **external URL** (demo, recording on SoundCloud, etc.) as paste-only link. |
| **004 cross-link** | **Optional** reference from a composition row or setlist line to an existing **music_track** row (by id) — **P2** for setlist lines; **P2** for composition “inspirations”. Never required; track detail need not mirror back in v1. |
| **Composition quick-add** | Default status **`idea` (Idée)** on title-only create; **`in_progress` (En cours)** available in status picker on create or immediately after save (Valentin **2026-10-28** — both supported). |
| **À l’aise (`comfortable`)** | Optional **`learning_piece`** status meaning the user **feels at ease playing the piece** (personal progress, not platform-verified). **Does NOT** feed **[011](../011-periodic-recap/spec.md)** recap — only **`practice_log`** rows with **`practicedAt`** (mark **Fait** / ad-hoc) do, unless product replans later (locked **2026-10-28**). |
| **Tone** | French labels; celebrate progress optionally; **no** streak loss, “you haven’t composed in X days”, or comparison with others. |
| **Offline** | Full CRUD offline; sync per foundation LWW + soft delete. |

## Workflow A — Music composition

**Intent**: Track **original music projects** from idea through personal “done”, with lightweight status and session notes — not a DAW replacement.

### Composition statuses (MVP)

| Status | French label (product) | Meaning |
|--------|------------------------|---------|
| `idea` | Idée | Captured concept; minimal or no work logged yet |
| `in_progress` | En cours | Active work |
| `paused` | En pause | Intentionally on hold (not failure) |
| `finished` | Terminé | User considers the piece **done for their goals** (release, share, or personal closure — not platform-verified) |
| `archived` | Archivé | Hidden from default list; history preserved |

**Default on create**: **`idea` (Idée)** on title-only quick-add; user MAY choose **`in_progress` (En cours)** in the create flow status picker (locked **2026-10-28**).

**Transitions**: User may move freely among non-terminal states; **`finished`** and **`archived`** remain editable (notes, links) but list filters may hide archived by default.

### Composition fields (MVP)

| Field | Required | Notes |
|-------|----------|--------|
| **title** | Yes | Quick-add minimum |
| **status** | Yes (default) | See table above |
| **startedAt** | No | Calendar date when work began (optional; default empty) |
| **finishedAt** | No | Set when entering **`finished`** (default: today; user may backdate — same pattern as 011 recipe cooked dates) |
| **lastWorkedAt** | No | Updated when user logs a **session note** or explicitly “touché aujourd’hui” (P1: manual date on session; P2: auto on save) |
| **genre / style** | No | Free text (e.g. “techno”, “ambient”) |
| **tempoBpm** | No | Optional integer BPM (single reference tempo) |
| **mood** | No | Free text or optional preset list in planning (spec: **free text** MVP) |
| **notes** | No | Longer free text on detail |
| **externalUrl** | No | Link to demo, private cloud, Bandcamp, etc. — opens externally |
| **sessionNotes** | No | **P1**: append-only list of `{ date, text }` for “what I did today” (composition journal lite) |
| **linkedTrackIds** | No | **P2** — optional ids of **004** `music_track` rows (inspiration/reference) |

**Out of scope v1**: MIDI/audio attachments, stem lists, DAW project paths, version branching, collaborator permissions.

## Workflow B — DJ sets

**Intent**: Log **DJ performances** (club, radio, home practice gig, stream) with date, context, and optional setlist — separate from “tracks I listened to” in 004.

### DJ set statuses (MVP)

| Status | French label | Meaning |
|--------|--------------|---------|
| `planned` | Prévu | Upcoming or draft plan |
| `performed` | Joué | Set happened (or user treats home mix as “performed”) |
| `cancelled` | Annulé | Did not happen; kept for history |

**Default on create**: **`planned`** for future-dated rows; user may create directly as **`performed`** with a past date (common for backfill).

### DJ set fields (MVP)

| Field | Required | Notes |
|-------|----------|--------|
| **title** | Yes | e.g. venue name, event, “Set salon 2026-03” |
| **status** | Yes (default) | See table |
| **performedAt** | Required when **`performed`** | Calendar date (and optional start time **P2**); backdating allowed |
| **venue** | No | Free text (club, festival, stream platform) |
| **durationMinutes** | No | Integer minutes |
| **genre / style** | No | Free text |
| **bpmRange** | No | Optional text (e.g. “128–132”) or min/max integers — planning chooses one control |
| **mood** | No | Free text |
| **notes** | No | Crowd, energy, what worked |
| **setlist** | No | **P1**: ordered **free-text lines** (artist — title per line); **P2**: optional link each line to **004** `music_track` id |
| **externalUrl** | No | Recording link (Mixcloud, SoundCloud, etc.) |

**Out of scope v1**: Live BPM detection, Rekordbox/Ableton/Traktor library sync, waveform analysis, automatic track identification.

## Workflow C — Instrument learning (Apprentissage)

**Intent**: **Plan and log instrument practice** — user-defined **exercises** (études, gammes, drills), a **weekly or dated plan**, and **pieces/tracks being learned** with progress. Valentin is **learning instruments**; this workflow supports **scheduling**, **marking sessions done**, and **repertoire progress** without conflating **004 listening**, **composition projects**, or in-app audio.

**UX note**: Prefer a **separate typed flow** from compositions (plan → done checkmarks, instrument name, exercise library) even though both live under **Musique — pratique**.

### Practice instrument (registry)

Simple user-scoped list of instruments the user practices (e.g. “Guitare”, “Piano”, “Basse”).

| Field | Required | Notes |
|-------|----------|--------|
| **name** | Yes | Quick-add minimum; duplicate names allowed if user wants |
| **notes** | No | Optional tuning, setup, teacher |

### Exercise library entry

User-authored **technical exercise** rows — not a shipped catalog (contrast **008** fitness catalog).

| Field | Required | Notes |
|-------|----------|--------|
| **title** | Yes | e.g. “Gamme Do majeur”, “Exercice alternate picking” |
| **instrumentId** | No | Link to practice instrument; filter library by instrument |
| **category** | No | Free text or preset in planning (e.g. **Étude**, **Gamme**, **Drill**, **Autre**) — spec MVP: **free text** optional |
| **notes** | No | Tempo target, book page, video link as text |

### Practice plan (schedule)

**Planning**: user builds a **practice plan** that assigns **exercise library entries** to **calendar dates** and/or **weekdays** (ISO Monday–Sunday), analogous in spirit to **[008](../008-fitness-training/spec.md)** weekday assignments but **user-named exercises only**.

| Field | Required | Notes |
|-------|----------|--------|
| **name** | Yes | e.g. “Semaine guitare mars” |
| **isActive** | Yes (default) | One **active** plan MVP (same pattern as 008 single active program) |
| **assignments** | No | Ordered list: `{ exerciseId, weekdays[]?, specificDates[]?, sortOrder }` — at least one of weekdays or specificDates when row is used |

**Today view (P1)**: Show exercises planned for **today** (weekday match + explicit date rows); user **marks done** → creates a **practice log** (below) without requiring duration or notes.

### Practice log (session done)

Lightweight completion record when user finishes planned or ad-hoc practice.

| Field | Required | Notes |
|-------|----------|--------|
| **practicedAt** | Yes | Calendar date (default today; **backdate** allowed — recap-friendly) |
| **instrumentId** | No | Which instrument; optional if exercise already linked |
| **exerciseIds** | No | One or more library exercises touched this session |
| **learningPieceId** | No | Optional link if session focused on a **learning piece** row |
| **durationMinutes** | No | Integer optional |
| **notes** | No | Free text |

**Ad-hoc**: User MAY log practice **without** a plan assignment (free session with optional exercise/piece picks).

### Learning piece (repertoire in progress)

**Distinct from 004 listen-list**: tracks **what Valentin is learning to play**, not what he queued to listen.

| Field | Required | Notes |
|-------|----------|--------|
| **title** | Yes | Piece name (may mirror a track title or be free text) |
| **instrumentId** | No | Primary instrument for this piece |
| **status** | Yes (default) | `learning` **En apprentissage**, `comfortable` **À l’aise** (user feels at ease playing the piece — progress marker only; **not** recap-eligible without a **`practice_log`**), `paused` **En pause**, `archived` **Archivé** (hidden from default list) |
| **linkedTrackId** | No | **P2** — optional **004** `music_track` id as reference (“the recording I’m learning from”); **does not** set **`listened`** or alter 004 status |
| **startedAt** | No | Optional calendar date |
| **lastPracticedAt** | No | Updated when user logs practice linked to this piece or taps “pratiqué aujourd’hui” (**P1** manual on log or piece detail) |
| **notes** | No | Sections, difficulty, teacher feedback |

**Out of scope v1**: Sheet music PDF upload, automatic progress from MIDI, metronome, audio playback, mandatory MusicBrainz link.

## User Scenarios & Testing *(mandatory)*

### Workflow A — Composition

### User Story A1 - Capture a composition idea quickly (Priority: P1)

A user opens **Compositions**, uses quick-add with **title only**, saves offline. The row appears with status **Idée**. They open detail later to add genre, BPM, or a session note.

**Why this priority**: Without fast capture, creative intent is lost (009 + constitution II).

**Independent Test**: Add “Pad dub march”, airplane mode, kill app, reopen — row persists.

**Acceptance Scenarios**:

1. **Given** quick-add with title, **When** user saves, **Then** a composition exists with status **Idée** and no guilt empty-state copy.
2. **Given** a composition, **When** user sets status **En cours**, **Then** list and detail show updated French label without requiring other fields.
3. **Given** a composition, **When** user adds a session note with date and text, **Then** it appears in chronological order on detail.

---

### User Story A2 - Mark a composition finished (Priority: P1)

When a piece reaches personal completion, the user sets status **Terminé**, optionally sets **finishedAt** (default today, backdate allowed), and optionally adds **externalUrl** to a published demo.

**Why this priority**: Closure is the main achievement signal for 009 and future 011.

**Independent Test**: Move one composition to **Terminé** with backdated **finishedAt**; filter list by status.

**Acceptance Scenarios**:

1. **Given** status **En cours**, **When** user selects **Terminé**, **Then** **finishedAt** defaults to today and is editable.
2. **Given** **Terminé**, **When** user archives, **Then** row moves to **Archivé** and is hidden from default list but still searchable.

---

### User Story A3 - Browse and filter compositions (Priority: P2)

User filters by status, sorts by last worked or title, searches by title locally.

**Independent Test**: Seed three statuses; filter **En cours** only.

---

### Workflow B — DJ sets

### User Story B1 - Log a performed DJ set (Priority: P1)

After a gig, user creates a set with **title**, sets status **Joué**, **performedAt** (today or backdated), optional **venue**, **duration**, and **setlist** as free-text lines.

**Why this priority**: Core performance memory for Valentin’s DJ practice.

**Independent Test**: Log set with three setlist lines offline; reopen detail.

**Acceptance Scenarios**:

1. **Given** add form, **When** user saves with title and **Joué** without date, **Then** validation prompts for **performedAt** (French message).
2. **Given** a performed set, **When** user adds **externalUrl**, **Then** detail shows tap-to-open link (no in-app player).

---

### User Story B2 - Plan an upcoming set (Priority: P2)

User creates **Prévu** with title and optional venue; after the event, changes to **Joué** and fills date and setlist.

**Independent Test**: Transition planned → performed preserves title and notes.

---

### User Story B3 - Cancel a planned set (Priority: P2)

User marks **Annulé** with optional note; row remains in history, not counted as performed.

---

### User Story B4 - Link setlist lines to library tracks (Priority: P2)

On set detail, user optionally attaches a **004** track to a setlist line via search picker; line still shows free-text if link removed.

**Independent Test**: Link one line to existing track; unlink — text remains.

---

### Workflow C — Instrument learning

### User Story C1 - Maintain an exercise library (Priority: P1)

User quick-adds exercises with **title only**, optionally assigns **instrument** and **category**, offline. Library list supports local search on title.

**Why this priority**: Named exercises are the vocabulary for planning (constitution III — typed list, not generic notes).

**Independent Test**: Add “Gamme pentatonique”, airplane mode, reopen — row persists.

**Acceptance Scenarios**:

1. **Given** quick-add with title, **When** user saves, **Then** exercise appears in library with no guilt empty-state copy.
2. **Given** an exercise, **When** user sets **instrument**, **Then** list filter by instrument shows only matching rows.

---

### User Story C2 - Plan exercises for the week (Priority: P1)

User creates an **active plan**, assigns exercises to **weekdays** (and optionally specific dates), opens **today** view, and sees what is scheduled.

**Why this priority**: Valentin asked to **plan** technical work, not only log ad hoc.

**Independent Test**: Assign Monday + Wednesday exercises; fix “today” in test harness; verify today list.

**Acceptance Scenarios**:

1. **Given** active plan with Monday assignment, **When** user opens apprentissage on a Monday, **Then** planned exercises appear in stable order.
2. **Given** planned exercise for today, **When** user marks **Fait**, **Then** a **practice log** exists with **practicedAt** today and linked **exerciseId**.

---

### User Story C3 - Track a piece being learned (Priority: P1)

User adds a **learning piece** with title and instrument, updates **status** and **lastPracticedAt** via practice log or explicit action.

**Why this priority**: Repertoire progress is separate from 004 **écouté** and composition **Terminé**.

**Independent Test**: Create piece, log linked practice with backdated date, filter **En apprentissage**.

**Acceptance Scenarios**:

1. **Given** learning piece **En apprentissage**, **When** user logs practice linked to it with backdated **practicedAt**, **Then** **lastPracticedAt** reflects that date.
2. **Given** piece with optional **004** link (**P2**), **When** user views detail, **Then** link opens track detail or external listen link per 004 — **listened** status unchanged.

---

### User Story C4 - Browse apprentissage and filter (Priority: P2)

User filters exercises by instrument, pieces by status, sorts by last practiced or title; searches locally.

**Independent Test**: Seed mixed statuses; filter **En apprentissage** only.

---

### Edge Cases

- **Duplicate titles** allowed (same venue on different dates).
- **Backdated dates** in future for performed/finished — validation rejects or warns (planning: reject future **performedAt** / **finishedAt** beyond today in user timezone).
- **Soft delete** restores composition or set with prior status and notes (foundation pattern).
- **004 track deleted** while referenced — setlist/composition shows orphaned reference gracefully (French “piste supprimée”, link cleared on next edit optional).
- **Learning piece linkedTrackId orphaned** — same graceful copy as composition/setlist P2 links.
- **Plan change** — past **practice logs** retain what was done; future “today” uses new assignments (008 pattern).
- **Mark done without plan** — ad-hoc **practice log** allowed with **practicedAt** only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Introduce typed domain **music_composition** with statuses `idea`, `in_progress`, `paused`, `finished`, `archived` and French UI labels.
- **FR-002**: Introduce typed domain **dj_set** with statuses `planned`, `performed`, `cancelled` and French UI labels.
- **FR-003**: Quick-add for each workflow MUST require only **title**; save succeeds offline immediately.
- **FR-004**: Composition session notes MUST support append of `{ date, text }` with local ordering (P1).
- **FR-005**: When **dj_set** status is **`performed`**, **performedAt** MUST be required; user MAY backdate to past calendar days.
- **FR-006**: When **music_composition** status is **`finished`**, **finishedAt** SHOULD be set (default today; backdating allowed).
- **FR-007**: Optional **externalUrl** on both entities; tap opens system browser / external app — **no** embedded player (FR-008).
- **FR-008**: **No** audio file upload, hosting, or streaming API integration in v1.
- **FR-009**: **Setlist** on **dj_set** MUST support ordered free-text lines in v1 (P1).
- **FR-010**: List screens MUST support local search on title and filter by status (P1 compositions + DJ performed/planned at minimum).
- **FR-011**: All strings user-facing in **French**; no guilt or streak-loss copy on these screens.
- **FR-012**: Optional reference to **004** `music_track` ids on composition (**P2**) and setlist lines (**P2**) — one-way; no change to 004 track schema required in 012 v1.
- **FR-013**: Persist **finishedAt** / **performedAt** / **practicedAt** and status transitions with timestamps suitable for a future **011** recap contributor (document only; no recap UI in 012).
- **FR-014**: Introduce **practice_instrument** registry with **name** required; quick-add offline (Workflow C).
- **FR-015**: Introduce **practice_exercise** library rows (title required; optional instrument, category, notes).
- **FR-016**: Introduce **practice_plan** with one **active** plan MVP and assignments to weekdays and/or specific dates referencing **practice_exercise** ids.
- **FR-017**: Introduce **practice_log** with required **practicedAt** (backdating allowed); optional links to exercises, instrument, **learning_piece**; ad-hoc logs without plan (**P1**).
- **FR-018**: Introduce **learning_piece** with statuses `learning`, `comfortable`, `paused`, `archived` and French labels; **title** required on create.
- **FR-019**: **Today** apprentissage view MUST list planned exercises for the current calendar day and allow **mark done** → **practice_log** (**P1**).
- **FR-020**: Optional **linkedTrackId** on **learning_piece** (**P2**) — one-way to **004**; MUST NOT mutate 004 listen status.
- **FR-021**: Apprentissage list screens MUST support local search (exercise + piece titles) and status/instrument filters (**P1** minimum on pieces by status).

### Key Entities

- **Music composition**: title, status, startedAt?, finishedAt?, lastWorkedAt?, genreStyle?, tempoBpm?, mood?, notes?, externalUrl?, sessionNotes[], linkedTrackIds? (P2).
- **DJ set**: title, status, performedAt? (required if performed), venue?, durationMinutes?, genreStyle?, bpmRange?, mood?, notes?, setlist[] (text line + optional trackId P2), externalUrl?.
- **Practice instrument**: name, notes?.
- **Practice exercise**: title, instrumentId?, category?, notes?.
- **Practice plan**: name, isActive, assignments[] (exerciseId, weekdays?, specificDates?, sortOrder).
- **Practice log**: practicedAt, instrumentId?, exerciseIds[], learningPieceId?, durationMinutes?, notes?.
- **Learning piece**: title, instrumentId?, status, linkedTrackId? (P2), startedAt?, lastPracticedAt?, notes?.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can create a composition or DJ set with title only in **under 20 seconds** on a typical phone.
- **SC-002**: User can log a **Joué** set with date, venue, and three setlist lines **offline** and see them after reload.
- **SC-003**: User can move a composition from **Idée** to **Terminé** with an optional backdated **finishedAt** without entering BPM, mood, or links.
- **SC-004**: Default empty states and status copy pass **no guilt / no social comparison** review (009 bar).
- **SC-005**: User can add an exercise and a learning piece with **title only**, mark **today’s** planned exercise **Fait** offline, and see **practice log** + updated **lastPracticedAt** on the piece after reload.

## Assumptions

- Valentin is the primary user; scale stays within foundation “few thousand items” per domain.
- **Navigation**: One shell entry **Musique — pratique** with top-level tabs **Compositions**, **Sets DJ**, **Apprentissage**. **Apprentissage** = **one scrollable screen** with sections (Aujourd’hui, Plan, Exercices, Répertoire) per [ui-routes contract](contracts/ui-routes.md).
- **011 recap**: Spec’d in [011](../011-periodic-recap/spec.md) — **`dj_set` → `performed`** (**`performedAt`**), **`music_composition` → `finished`** (**`finishedAt`**), **`practice_log`** with **`practicedAt`**. Planned/cancelled sets, idea/paused compositions, and archived pieces excluded. **`learning_piece` → `comfortable`** alone excluded in MVP (practice logs only). **012** persists timestamps; **011** implements contributors ([T1195–T1196](../011-periodic-recap/tasks.md)).
- BPM fields are **manual** user entry, not detected from audio.
- DJ “home practice” counts as **`performed`** when the user says so — no separate “rehearsal” status in v1.

## Out of Scope (v1)

- In-app audio playback or waveform UI.
- Uploading or hosting audio files on Muni servers.
- Spotify, SoundCloud, MusicBrainz **APIs** beyond optional pasted URLs (004 already covers catalog for **listening** library).
- **Ableton Live, Rekordbox, Traktor, Serato** sync, crate import, or set export.
- MIDI/project file storage, stem tracking, multi-version mix history.
- Social sharing, public profiles, or audience stats.
- Merging 012 into **004** or reusing `music_track` rows as composition proxies.
- Implementing **011** recap aggregation UI or contributors inside **012** delivery (see [011 tasks](../011-periodic-recap/tasks.md) T1195–T1196).
- Exercise **catalog seed** or MusicBrainz-backed exercise types (user library only in v1).
- Changing **004** `music_track` schema or listen status when linking from **learning_piece**.

## Future (not scheduled)

- **`learning_piece` → `comfortable`** as its own recap line (if product expands beyond **`practice_log`** dates).
- Rich setlist: BPM per track, energy curve, link to **004** artists.
- Optional “released on” platform metadata; live-sync from DJ software.
- Separate status **Répétition** for DJ practice vs public **Joué**.
