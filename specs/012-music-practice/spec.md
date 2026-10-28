# Feature Specification: Music practice — compositions & DJ sets

**Feature directory**: `specs/012-music-practice/`

**Feature Branch**: `012-music-practice`

**Created**: 2026-10-28

**Status**: Draft (specification only — no implementation authorized by this document)

**Input**: Valentin wants to **track what he does in music** through **two distinct workflows**: (1) **music composition** — creating original work with its own lifecycle; (2) **DJ sets** — logging performances with a separate lifecycle. French UI, offline-first, companion tone (**no guilt**), aligned with Muni typed-domain patterns.

**Depends on**: Muni foundation (**001**) — auth, offline-first sync, French UI, quick-add capture speed, per-user privacy.

**Relationship to music library ([004](../004-music-artists-tracks/spec.md))**: **[004](../004-music-artists-tracks/spec.md) is discovery and consumption** — artists to discover, tracks to listen to, MusicBrainz catalog, Spotify/SoundCloud deep links, `to_listen` / `listened` status. **012 is creative practice and performance logging** — compositions in progress and DJ sets performed. Same product area (music) but **different typed domains**, analogous to **[010](../010-recipe-source-book/spec.md) cookbooks vs [002](../002-books-library/spec.md) books-to-read**: no shared item type, no required cross-link; optional references only (see FR-012).

**Why feature 012 (not merge into 004)**: 004’s entities, statuses, and UX are tuned to **catalog-backed library rows** and external listening links. Composition and DJ workflows need **different states, fields, and screens** (sketch → mixdown; planned set → performed setlist). Merging would blur “track I listened to” with “track I produced” and overload 004’s `listened` semantics. A dedicated spec keeps domains authoritative per [009](../009-experiences-achievements/spec.md).

**Serves**: [009](../009-experiences-achievements/spec.md) north star — **registering creative work and performance** as personal experience and achievement, without guilt copy or social feeds.

**Future link to [011](../011-periodic-recap/spec.md)**: When 011 implementation adds or extends its **domain contributor registry**, **performed DJ sets** and **composition milestones** (user-marked “terminé” or equivalent) MAY feed recap lines — **not in scope for 012 v1 delivery**; 012 MUST persist clear **completion timestamps** on domain rows so 011 can subscribe later without redesign. Do **not** expand 011 spec or tasks in this change set.

## Decision summary (MVP)

| Topic | Decision |
|-------|----------|
| **Two workflows** | **Separate typed lists** under one **Musique — pratique** area (hub with two tabs or equivalent — exact nav in planning): **Compositions** and **Sets DJ**. |
| **Capture speed** | Each workflow: **title required** to save; all other fields optional on first save (constitution II). |
| **Audio** | **No in-app playback**, **no file upload/hosting** in v1 (same spirit as 004 MU-scope). Optional **external URL** (demo, recording on SoundCloud, etc.) as paste-only link. |
| **004 cross-link** | **Optional** reference from a composition row or setlist line to an existing **music_track** row (by id) — **P2** for setlist lines; **P2** for composition “inspirations”. Never required; track detail need not mirror back in v1. |
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

**Default on create**: `idea` or `in_progress` (planning picks one; spec assumes **`idea`** for fastest capture, user can bump to **En cours** in one tap).

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

### Edge Cases

- **Duplicate titles** allowed (same venue on different dates).
- **Backdated dates** in future for performed/finished — validation rejects or warns (planning: reject future **performedAt** / **finishedAt** beyond today in user timezone).
- **Soft delete** restores composition or set with prior status and notes (foundation pattern).
- **004 track deleted** while referenced — setlist/composition shows orphaned reference gracefully (French “piste supprimée”, link cleared on next edit optional).

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
- **FR-013**: Persist **finishedAt** / **performedAt** and status transitions with timestamps suitable for a future **011** recap contributor (document only; no recap UI in 012).

### Key Entities

- **Music composition**: title, status, startedAt?, finishedAt?, lastWorkedAt?, genreStyle?, tempoBpm?, mood?, notes?, externalUrl?, sessionNotes[], linkedTrackIds? (P2).
- **DJ set**: title, status, performedAt? (required if performed), venue?, durationMinutes?, genreStyle?, bpmRange?, mood?, notes?, setlist[] (text line + optional trackId P2), externalUrl?.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can create a composition or DJ set with title only in **under 20 seconds** on a typical phone.
- **SC-002**: User can log a **Joué** set with date, venue, and three setlist lines **offline** and see them after reload.
- **SC-003**: User can move a composition from **Idée** to **Terminé** with an optional backdated **finishedAt** without entering BPM, mood, or links.
- **SC-004**: Default empty states and status copy pass **no guilt / no social comparison** review (009 bar).

## Assumptions

- Valentin is the primary user; scale stays within foundation “few thousand items” per domain.
- **Navigation**: One shell entry **Musique — pratique** (or split from existing music nav) with **Compositions** and **Sets DJ** sub-areas — exact IA deferred to planning.
- **011 recap**: Not implemented in 012; eligible events when added: **`dj_set` → `performed`** (timestamp **performedAt**), **`music_composition` → `finished`** (timestamp **finishedAt**). Planned/cancelled sets and idea/paused compositions are excluded unless product later expands.
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
- Implementing or extending **011** recap aggregation in this feature’s delivery batch.

## Future (not scheduled)

- Recap contributor for compositions finished and sets performed ([011](../011-periodic-recap/spec.md)).
- Rich setlist: BPM per track, energy curve, link to **004** artists.
- Optional “released on” platform metadata; live-sync from DJ software.
- Separate status **Répétition** for DJ practice vs public **Joué**.
