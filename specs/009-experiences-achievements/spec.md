# Product vision / North star: Experiences & achievements

**Feature directory**: `specs/009-experiences-achievements/`

**Branch (documentation)**: `009-experiences-achievements`

**Created**: 2026-10-28

**Status**: Vision (stable framing — not a delivery spec)

**Document role**: This folder holds Muni’s **product north star**. It explains *why* the life companion exists and how ongoing work in typed domains serves that goal. It does **not** authorize or schedule new app modules, screens, entities, or sync tables.

**Input**: Valentin’s product vision — Muni helps humans **register new experiences and achievements** because happiness and a sense of a full life come from **discovering new things**. Existing typed lists (books, films, fitness, recipes, shopping) **continue**; this document **frames** them rather than replacing them.

**References** (implementation lives elsewhere): [`001-typed-lists-companion`](../001-typed-lists-companion/spec.md) (foundation), [`002`–`004`](../002-books-library/spec.md) (libraries), [`008-fitness-training`](../008-fitness-training/spec.md) (embodied achievement, opt-in streaks).

---

## North star

Muni is a **life companion** that makes **discovery and milestones visible over time** — what was **new for me**, what was **tried**, what **finish line** mattered — so the user can look back and feel continuity and richness, not productivity pressure.

Typed lists remain the right tools for **intent and inventory** (to read, to watch, to buy, to cook, to train). The north star is the **horizontal story** those domains contribute to: a full, personal life of novelty and accomplishment.

---

## Principles

| Principle | Meaning for Muni |
|-----------|------------------|
| **Subjective novelty** | “New” means **new for the user** (`nouveau pour moi`), not world-first events or algorithmic discovery scores. |
| **Companion, not coach** | Celebrate optionally; never shame. No guilt copy, no mandatory journaling, no daily quotas for a “good” user. |
| **Domains stay authoritative** | Books, films, music, fitness, recipes, shopping keep their own models and UX. The vision **connects** them narratively; it does not merge them into one replacement module. |
| **Privacy** | Private per user; no social feeds, followers, leaderboards, or comparison with others. |
| **Capture speed (where we build)** | When a domain adds capture, it should stay fast (aligned with foundation Principle II). This vision doc does not add new capture flows by itself. |
| **French companion** | Product tone and UI remain French-first, consistent with 001. |
| **Offline-first (where we build)** | Features that ship continue foundation sync and offline patterns; the vision does not prescribe new sync entities here. |

---

## What success looks like

Success is **felt and longitudinal**, not a single feature checkbox:

- The user **remembers and recognizes** moments of discovery and achievement across months and years, using tools they already trust (libraries, fitness log, recipes).
- Completing a book, a film, a workout PR, or a new recipe **feels like part of a coherent life story**, not isolated checklist ticks.
- The product **never** nudges with loss, broken chains, or “you’re falling behind” framing for life novelty (contrast: fitness may offer **opt-in, hideable** assiduity per 008 — that stays in fitness).
- New work on **002–008, 010, …** can be judged against this north star: *Does it help register or reflect experience and achievement without replacing typed domains?*

Qualitative bar: default copy and empty states across Muni should pass a **no guilt / no social comparison** review when touching discovery-adjacent UX.

---

## How existing features serve the vision

| Domain | Role today | How it serves experiences & achievements |
|--------|------------|------------------------------------------|
| **Books, films, TV, music (002–004)** | Curated libraries; status (read/watched/listened); ratings and notes | **Cultural discovery** — finishing or deeply engaging with media is a core form of “something new happened.” Library rows stay authoritative; the vision treats consumption as meaningful life experience, not just inventory. |
| **Fitness (008)** | Training plan, logs, progression, optional non-guilt streak | **Embodied achievement** — personal records, program completion, and “first time I …” belong in fitness. The north star links them **conceptually** to a full life; it does not require a global scoreboard or merged timeline in app. |
| **Recipes (001 / 010)** | Lists and cooking flows; optional source citation (010) | **Experience through making** — trying a new dish or mastering a recipe is registering an experience; recipe domains own the data. |
| **Shopping (001)** | Errands and lists | Supports **intent** (ingredients, gear, books to buy) that enables future experiences; not a journal. |
| **Future typed domains** (travel, restaurants, learning, …) | Not specified here | Same pattern: each domain owns its fields; the north star explains why new domains may appear over time. |

**Optional future registration** (not scheduled, not in scope for this document): cross-domain “life moment” capture, unified timelines, home summaries, or gentle prompts after marking media complete. Those would be **separate** specs/plans if Valentin ever prioritizes them.

---

## Anti-patterns (vision non-goals)

The product direction MUST NOT:

- Use **guilt copy** (“You haven’t tried anything new in 14 days”, “You’re falling behind”).
- Show **streak loss** or **broken chain** visuals for novelty or experience frequency outside opt-in fitness assiduity.
- Enable **social comparison**, leaderboards, likes, or shared feeds.
- Imply **mandatory journaling** or daily quotas.
- **Replace** typed lists with a single “experiences app” inside Muni.

Optional **positive** feedback in future work: private, dismissible messages (e.g. “Belle découverte enregistrée”) — never tied to punishment or loss.

---

## Out of scope for this document

The following are **explicitly not current delivery** and are **not implied** by maintaining this vision folder:

- New navigation entries, modules, or primary screens for “Expériences & réalisations”
- New persisted entities (`Expérience`, `Réalisation`, categories, link tables) or sync migrations
- **Fil de vie** / unified timeline UI
- Home **carte Découvertes** or monthly counters
- Post-save reflection prompts or library “record as experience” suggestions
- Global search extensions for experience titles
- Phased MVP plans (A–D), user stories, functional requirements, or success criteria tied to implementation

Implementation continues in **domain specs** (002–008, 010, …) and foundation **001**. When/if dedicated experience-layer product is scoped, it would get a **new** spec or a explicit delivery amendment — not this vision doc alone.

---

## Future directions (not scheduled)

Illustrative directions only — **no commitment, no task list**:

- Lightweight **life moment** capture that references library items without duplicating metadata
- **Réalisations** as named milestones optionally linked to domain items
- Private **chronological journal** view combining selected domain events (not a social feed)
- Gentle, dismissible **companion prompts** after media completion or personal firsts
- Cross-domain **read-only timeline** slices (e.g. show completed workouts alongside cultural finishes) — only if it serves reflection without gamification

---

## Assumptions (vision)

- Valentin clarified (2026-10-28): **009 is north star only** — no 009 implementation planned; existing domains continue.
- Links between “life story” and domain data remain **conceptual** until a future feature spec defines references.
- Fitness achievements stay in **008** unless a future cross-link product is explicitly scoped.

## Open questions (product, not blocking vision)

For future prioritization — not `[NEEDS CLARIFICATION]` on this doc:

1. Should finishing media stay **library-only** indefinitely, or someday offer an optional “remember this moment” affordance?
2. If a cross-domain journal ever ships, should fitness workouts appear as read-only timeline rows or stay fitness-only?
3. How visible should any future home “discovery” summary be (opt-in vs default)?
