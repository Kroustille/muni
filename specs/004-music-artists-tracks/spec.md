# Feature Specification: Music artists and tracks

**Feature Branch**: `004-music-artists-tracks`

**Created**: 2026-10-15

**Status**: Draft

**Input**: Add two typed lists — **artists** to discover and **tracks** to listen to — with optional MusicBrainz catalog search on list screens, external Spotify/SoundCloud deep links, optional platform URLs on rows, no in-app playback.

**Depends on**: Muni v1 (`001`); **implement after feature 003 complete (X1)**.

## Clarifications

### Session 2026-10-15

- **MU1:** Prefer **keyless** catalog (e.g. MusicBrainz) for in-app search metadata.
- **MU1b:** **Hybrid (C):** in-app search = keyless metadata; on catalog preview, **Spotify** and **SoundCloud** URL fields are **prefilled** with platform search URLs (title + artist for tracks); no separate search buttons (no platform API keys).
- **MU2:** Silent update/restore on same catalog id (**artist** MBID vs **track** MBID separate); no duplicate, no warning; soft-deleted → restore + refresh (like books/movies).
- **MU-scope:** **No in-app playback** — list, search, and link only.
- **MU3:** Two list types: **artist** rows and **track** rows; track has optional free-text **artist** with suggestions from artists list; **no required link** to an artist row.
- **MU4:** Catalog search on **music list screens only**; **quick-add stays manual** (title/artist fields, no catalog search).
- **MU5:** Track: **title + artist required**; album and year optional. Artist: **name** required (title field = name).
- **MU-links:** Optional **Spotify** and **SoundCloud** URLs on artist and track when available (catalog or paste on preview/edit); tap opens app/site.
- **X2–X4:** Server proxy; online lookup only; server cache short TTL.
- **L2:** App search title/name only (artist name, track title).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and manually add artists and tracks (Priority: P1)

User opens Artists or Tracks list, uses quick-add (manual only, MU4) or list add, enters required fields, saves. Track artist field suggests names from existing artists.

**Independent Test**: Add artist "Khruangbin"; add track with title + artist text; no catalog required.

**Acceptance Scenarios**:

1. **Given** quick-add track, **When** user saves without artist, **Then** validation blocks (MU5).
2. **Given** track artist field, **When** typing partial name, **Then** suggestions from artists list appear (MU3).

---

### User Story 2 - Catalog search on list (Priority: P1)

On artists list or tracks list only (MU4), user searches via server (MusicBrainz), picks a hit, previews editable fields including optional Spotify/SoundCloud URLs, saves with MBID.

---

### User Story 3 - External listen links (Priority: P1)

User opens prefilled or edited Spotify/SoundCloud URLs from the row (MU1b/MU-links). No audio inside Muni (MU-scope).

---

### User Story 4 - Track status, rating, and list sort (Priority: P2)

Tracks: to listen / listened + personal 1–5 when listened; tracks list supports **Plus récents** / **Par note** sort (same rules as books/movies). Artists: notes and recommended-by.

---

### User Story 5 - Dedupe and restore (Priority: P1)

Same artist MBID or recording MBID updates or restores soft-deleted row silently (MU2).

---

### Edge Cases

- Missing platform URLs: deep links use artist + title query.
- Catalog optional fields left blank on manual add.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Introduce typed lists for music **artist** and **track** items.
- **FR-002**: Quick-add: manual fields only, no catalog search (MU4).
- **FR-003**: Artists list and tracks list: catalog search entry (MU4).
- **FR-004**: MusicBrainz via server (MU1, X2).
- **FR-005**: Separate MBIDs for artist vs recording (MU2).
- **FR-006**: Optional `spotifyUrl`, `soundcloudUrl` (MU-links).
- **FR-007**: Deep-link search actions without API keys (MU1b).
- **FR-008**: No in-app playback (MU-scope).
- **FR-009**: Track requires title + artist; album/year optional (MU5).
- **FR-010**: FR-first metadata, EN fallback.
- **FR-011**: Server catalog cache (X4).

### Key Entities

- **Music artist**: name, notes, recommendedBy, `musicBrainzArtistId`, optional URLs.
- **Music track**: title, artist text, album?, year?, status, rating?, notes, recommendedBy, `musicBrainzRecordingId`, optional URLs.

## Success Criteria *(mandatory)*

- **SC-001**: Manual track add under 30 seconds.
- **SC-002**: Catalog search saves row with MBID without duplicates.
- **SC-003**: External Spotify/SoundCloud opens with prefilled query.

## Out of Scope

- In-app playback; Spotify/SC APIs; required artist↔track relation.
