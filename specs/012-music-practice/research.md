# Research: Music practice — compositions, DJ sets & instrument learning (012)

**Date**: 2026-10-28 (apprentissage extension same date)

**Purpose**: Compare **012** workflows to **004** music library and to each other; justify separate feature number and **third workflow**; inform MVP fields, states, and planning artifacts.

## Why not extend 004?

| Dimension | [004 Music library](../004-music-artists-tracks/spec.md) | **012 Music practice** (this feature) |
|-----------|----------------------------------------------------------|----------------------------------------|
| **User job** | Discover artists, queue tracks to listen, mark **écouté** | Create **original compositions**; log **DJ performances**; **plan exercises** and track **pieces being learned** |
| **Primary entities** | `music_artist`, `music_track` | `music_composition`, `dj_set`, `practice_*`, `learning_piece` |
| **Catalog** | MusicBrainz search, MBIDs, optional Spotify/SC URLs | **No** catalog requirement for practice rows; user-authored titles |
| **Status model** | Track: `to_listen` / `listened`; artist: rating only | Composition / DJ / learning-piece statuses per workflow |
| **Completion signal** | **`listened`** on a **consumption** row | **`finished`**, **`performed`**, **`practice_log.practicedAt`**, learning **status** |
| **Typical fields** | Album, year, recording MBID | Session notes, setlist, venue, exercise plan, instrument name |
| **011 recap** | Listened **tracks** + **012** practice dates in **Musique** section ([011 research](../011-periodic-recap/research.md)) | **012** persists timestamps; **011** aggregates ([tasks](../011-periodic-recap/tasks.md) T1195–T1196) |
| **Analogy in Muni** | Books/films **library** | **[010](../010-recipe-source-book/spec.md) cookbooks** vs **[002](../002-books-library/spec.md) reading list** — same theme, different domain |

**Conclusion**: Keep **012** as a **new numbered feature**. Optional **P2** links from **learning_piece** / composition / setlist → 004 track ids are references only, like recipe → cookbook, not a merge.

## Why apprentissage is not composition (Workflow C vs A)

| Aspect | **Composition (A)** | **Instrument learning (C)** |
|--------|---------------------|-----------------------------|
| **Unit** | Original **project** (one piece you write) | **Exercises** + **existing repertoire** you study |
| **Planning** | Session notes on a project | **Weekly/dated plan** + **mark done** logs |
| **Progress** | Idée → Terminé on **your** work | **En apprentissage** on **someone else’s** piece |
| **004 link** | Inspiration (P2) | “Piece I’m learning from” (P2) — still not **listened** |
| **Closest Muni pattern** | Long-running creative row | **[008](../008-fitness-training/spec.md)** plan + completion logs |

**Decision**: **Separate typed entities and screens** under the same **Musique — pratique** hub (three tabs).

## Alignment with [009](../009-experiences-achievements/spec.md)

| 009 principle | 012 application |
|---------------|-----------------|
| Subjective novelty | “Terminé” / “Joué” / “Fait” mean **meaningful for Valentin**, not chart placement |
| Companion, not coach | No “days since last session” guilt; **En pause** is neutral |
| Domains stay authoritative | Compositions, DJ sets, and apprentissage own their models; 004 unchanged |
| Capture speed | Title-only quick-add on all create flows |

## Workflow comparison (composition vs DJ set vs apprentissage)

| Aspect | **Composition** | **DJ set** | **Apprentissage** |
|--------|-----------------|------------|-------------------|
| **MVP anchor** | Project status | Event **performedAt** | **practicedAt** on logs + plan “today” |
| **Structured log** | Session notes | Setlist lines | **practice_log** + exercise library |
| **Planning** | — | Prévu → Joué | **practice_plan** weekdays/dates |
| **Achievement moment** | **Terminé** | **Joué** | **Fait** on planned item / log session |
| **Instrument** | — | — | **practice_instrument** name registry |

## Comparison to other Muni “practice” domains

| Domain | Spec | Parallel to 012 apprentissage |
|--------|------|--------------------------------|
| **Fitness** | [008](../008-fitness-training/spec.md) | Active program, weekday assignments, **completed** workout logs — **primary template** for plan + today + done |
| **Recipes** | 001 + [010](../010-recipe-source-book/spec.md) | **Cooked** dates (011) ≈ **practicedAt** |
| **Books** | [002](../002-books-library/spec.md) | **Learning piece** spans time like **reading** status, but separate entity from 004 listen |

## Field minimalism (MVP vs optional)

| Field | Composition | DJ set | Apprentissage | Tier |
|-------|-------------|--------|---------------|------|
| title / name | ✓ | ✓ | exercise + piece title | P1 |
| plan + today | — | — | ✓ | P1 |
| practicedAt | — | performedAt | ✓ on log | P1 |
| instrument link | — | — | ✓ | P1 |
| linkedTrackId | P2 | P2 setlist | P2 learning piece | P2 |

## Explicitly rejected for v1

| Idea | Reason |
|------|--------|
| Store MP3/WAV in Muni | Hosting, bandwidth, legal — out of charter |
| Rekordbox/Ableton sync | Integration scope; YAGNI |
| Reuse `music_track` for compositions or learning rows | Wrong semantics; would collide with **listened** recap |
| Merge apprentissage into composition workflow | Different UX (plan/mark done vs project status) |
| Shipped exercise catalog | Valentin wants **user-named** études/scales; unlike 008 curated catalog |
| Mandatory link 004 ↔ learning piece | Discovery library stays independent |

## Planning decisions (locked for `/speckit-plan`)

| ID | Topic | Decision |
|----|--------|----------|
| PD-012-1 | Hub IA | **Musique — pratique** with tabs **Compositions**, **Sets DJ**, **Apprentissage** |
| PD-012-2 | Sync channel | Dedicated **`/api/sync/music-practice/*`** (or split sub-routes) for all 012 persisted entities — mirror **008 fitness** + **010 cookbooks** |
| PD-012-3 | Migration band | **`0016_music_practice_tables.ts`** after **0015** cookbooks (010); compositions, dj_set, instrument entities in one migration family |
| PD-012-4 | Active plan | Exactly one **`isActive`** practice plan per user (MVP) |
| PD-012-5 | **011 integration** | [011 spec](../011-periodic-recap/spec.md) locked **2026-10-28** — **`practice_log`**, composition **Terminé**, DJ **Joué**; 012 ships data, 011 ships contributors |
| PD-012-6 | Learning default status | **`learning` (En apprentissage)** on quick-add |
| PD-012-7 | Mark done | Creates **`practice_log`**; updates **`learning_piece.lastPracticedAt`** when linked |

## Open product questions (for Valentin — optional clarify)

1. **Apprentissage sub-nav**: Single screen with sections vs two sub-tabs (Plan / Répertoire)?
2. **Comfortable status**: Should **`comfortable` (À l’aise)** ever feed 011 recap, or only **practice_log** dates?
3. **Composition default status**: **Idée** vs **En cours** on quick-add (unchanged from prior research)?
