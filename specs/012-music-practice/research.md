# Research: Music practice — compositions & DJ sets (012)

**Date**: 2026-10-28

**Purpose**: Compare **012** workflows to **004** music library and to each other; justify separate feature number; inform MVP fields and states.

## Why not extend 004?

| Dimension | [004 Music library](../004-music-artists-tracks/spec.md) | **012 Music practice** (this feature) |
|-----------|----------------------------------------------------------|----------------------------------------|
| **User job** | Discover artists, queue tracks to listen, mark **écouté** | Create **original compositions**; log **DJ performances** |
| **Primary entities** | `music_artist`, `music_track` | `music_composition`, `dj_set` |
| **Catalog** | MusicBrainz search, MBIDs, optional Spotify/SC URLs | **No** catalog requirement; user-authored titles |
| **Status model** | Track: `to_listen` / `listened`; artist: rating only | Composition: idea → … → terminé; DJ: prévu → joué / annulé |
| **Completion signal** | **`listened`** on a **consumption** row | **`finished`** on a **work** row; **`performed`** on an **event** row |
| **Typical fields** | Album, year, recording MBID | Session notes, setlist, venue, duration, BPM (manual) |
| **011 recap today** | Listened **tracks** included ([011 research](../011-periodic-recap/research.md)) | **Future** contributor: finished compositions + performed sets (not in 012 v1 scope) |
| **Analogy in Muni** | Books/films **library** | **[010](../010-recipe-source-book/spec.md) cookbooks** vs **[002](../002-books-library/spec.md) reading list** — same theme, different domain |

**Conclusion**: Keep **012** as a **new numbered feature**. Optional **P2** links from 012 → 004 track ids are references only, like recipe → cookbook, not a merge.

## Alignment with [009](../009-experiences-achievements/spec.md)

| 009 principle | 012 application |
|---------------|-----------------|
| Subjective novelty | “Terminé” / “Joué” mean **meaningful for Valentin**, not chart placement |
| Companion, not coach | No “days since last session” guilt; **En pause** is neutral |
| Domains stay authoritative | Compositions and DJ sets own their models; 004 unchanged |
| Capture speed | Title-only quick-add on both workflows |

## Workflow comparison (composition vs DJ set)

| Aspect | **Composition workflow** | **DJ set workflow** |
|--------|--------------------------|---------------------|
| **Unit of work** | A **project** (one piece over weeks) | An **event** (one night / one mix) |
| **MVP statuses** | Idée, En cours, En pause, Terminé, Archivé | Prévu, Joué, Annulé |
| **Required beyond title** | Nothing on create | **performedAt** when status = Joué |
| **Time model** | startedAt, finishedAt, lastWorkedAt, session note dates | performedAt (single anchor), duration optional |
| **Structured log** | Session notes (text + date) | Ordered setlist lines (text; optional track link P2) |
| **Place** | N/A (studio context in notes) | **venue** optional |
| **Tempo** | Optional single **tempoBpm** | Optional **bpmRange** (set energy) |
| **External media** | Demo URL | Recording URL |
| **Natural empty state** | “Aucune composition — une idée suffit pour commencer” | “Aucun set enregistré” |
| **Achievement moment** | User marks **Terminé** | User marks **Joué** with date |
| **Cancelled / abandoned** | **Archivé** or stay **En pause** | **Annulé** for planned gigs |

## Comparison to other Muni “practice” domains

| Domain | Spec | Parallel to 012 |
|--------|------|-----------------|
| **Fitness** | [008](../008-fitness-training/spec.md) | Planned sessions + **completed** logs — closest pattern; 012 DJ **Joué** ≈ workout **Terminé** |
| **Recipes** | 001 + [010](../010-recipe-source-book/spec.md) | **Cooked** dates (011) ≈ **performedAt**; provenance catalog ≈ optional 004 links |
| **Books** | [002](../002-books-library/spec.md) | Long-running **reading** vs single **read** finish — composition **En cours** spans time like reading |

## Field minimalism (MVP vs optional)

| Field | Composition | DJ set | Tier |
|-------|-------------|--------|------|
| title | ✓ required | ✓ required | P1 |
| status | ✓ | ✓ | P1 |
| performedAt / finishedAt | finishedAt on Terminé | performedAt on Joué | P1 |
| sessionNotes / setlist | sessionNotes[] | setlist[] text lines | P1 |
| venue | — | optional | P1 |
| durationMinutes | — | optional | P1 |
| mood, genreStyle | optional | optional | P1 |
| tempoBpm / bpmRange | optional | optional | P1 |
| externalUrl | optional | optional | P1 |
| notes (long) | optional | optional | P1 |
| linkedTrackIds / setlist trackId | optional | optional | P2 |
| startedAt, lastWorkedAt | optional | — | P1 / P2 auto |

## Explicitly rejected for v1

| Idea | Reason |
|------|--------|
| Store MP3/WAV in Muni | Hosting, bandwidth, legal — out of charter |
| Rekordbox/Ableton sync | Integration scope; YAGNI |
| Reuse `music_track` for compositions | Wrong semantics; would collide with **listened** recap |
| Single “music journal” note type | Violates typed lists principle (001 III) |
| Mandatory link 004 ↔ 012 | Discovery library stays independent |

## Open product questions (for Valentin — pre-planning)

Captured here for `/speckit-clarify`; spec uses documented defaults until answered.

1. **Navigation**: Single **Musique — pratique** hub vs two top-level nav items?
2. **011 timing**: Register recap contributor in same release as 012 implementation or follow-up?
3. **DJ rehearsal**: Is **Joué** at home enough, or need a distinct “répétition” status later?
4. **Composition default status**: **Idée** vs **En cours** on quick-add?
