# Research: Periodic recap (011)

**Date**: 2026-10-28

**Purpose**: Inventory existing **completion signals** in domain specs and propose gaps (especially recipes) for read-only periodic recap aggregation.

## Alignment with 009 (north star)

[009](../009-experiences-achievements/spec.md) frames discovery and achievement across domains but **does not ship** timelines or recap UI. **011** is the first **delivery** spec for a cross-domain, **read-only** reflection surface — companion tone, no guilt, no social feed, French UI, offline-first derivation from local data.

## Completion signals by domain (authoritative sources)

| Domain | Spec | Recap-eligible signal | Event timestamp source | Notes for recap |
|--------|------|----------------------|------------------------|-----------------|
| **Books** | [002](../002-books-library/spec.md) | Status → **`read`** | `fieldsUpdatedAt.status` when entering `read`; year goals use **first** `read` in calendar year | Exclude `reading` / `paused` / `to_read` as “finished” |
| **Films** | [003](../003-films-tv-library/spec.md) | Status → **`watched`** (film) | `watchedAt` if set, else status transition day | One finish per film row per transition |
| **Séries** | 003 | Episode marked in **`episodeProgress`** | `watchedAt` on episode key `S{n}E{m}` | **One recap line per episode** in period (locked 2026-10-28); no weekly roll-up |
| **Séries (whole)** | 003 | Status → **`watched`** | Same as films | Distinct from per-episode lines |
| **Music tracks** | [004](../004-music-artists-tracks/spec.md) | Status → **`listened`** | `fieldsUpdatedAt.status` when entering `listened` | **Music artists** have rating only — **no** `listened` status → **exclude artists** from recap counts unless product adds status later |
| **Music practice — composition** | [012](../012-music-practice/spec.md) | Status → **`finished`** (**Terminé**) | **`finishedAt`** (calendar date; backdate allowed) | Exclude `idea`, `in_progress`, `paused`, `archived` without finished signal; session notes alone do not count |
| **Music practice — DJ set** | 012 | Status → **`performed`** (**Joué**) | **`performedAt`** | Exclude `planned`, `cancelled` |
| **Music practice — apprentissage** | 012 | **`practice_log`** row (mark **Fait** or ad-hoc) | **`practicedAt`** | **One recap line per log** in period; **`learning_piece` → `comfortable`** alone **excluded** in MVP (logs only). Plan rows without log excluded |
| **Recipes** | [001](../001-typed-lists-companion/spec.md) | **None today** | — | Requires new explicit signal (see below) |
| **Fitness workouts** | [008](../008-fitness-training/spec.md) | Workout log **`completed`** | `completedAt` (fallback `calendarDate` at local day granularity if missing) | Exclude `abandoned`, `in_progress`; **skipped** planned sessions are **not** achievements |
| **Fitness PRs** | 008 | New personal record on save | Derived at save time from log | **Optional post-v1** recap highlight (subsection), not MVP blocker |
| **Shopping** | 001 | `checked` on items | — | **Out of recap** — errands, not life milestones (009 table) |
| **Quotes** (book/movie) | 002/003 | Quote created | `createdAt` | **Out of recap MVP** — capture, not “finished” experience |

## Timezone and calendar boundaries

- Reuse domain precedent: **local calendar day** in user timezone (default **`Europe/Paris`** until a global user timezone preference exists — same as 002/003 activity rules).
- **Week**: ISO week (Monday start) unless product later adds locale-specific week; document in spec as ISO for consistency with fitness week views.
- **Month / year**: calendar month and calendar year in user timezone.

## Recipe “cooked” — proposed signal (011 dependency on recipe domain)

**Problem**: Recipe items have ingredients/steps only; creating or editing a recipe is not “having cooked it.”

**Proposed (MVP)**:

1. Add an explicit user action on recipe detail: **« Cuisiné »** with default **today**, plus **date picker** (or equivalent) to **backdate** to any past calendar day in **v1**.
2. Persist **`cookedDates`**: ordered array of **ISO calendar dates** (`YYYY-MM-DD`) on the recipe item — **one LWW JSON field** on `items` (constitution-aligned with `ingredients` / `steps`), append semantics in the use case (each confirmed action appends the chosen date unless already present for that day — **same-day dedupe** avoids double-tap inflation).
3. Recap counts **one achievement per date entry** in the period (same recipe cooked twice on two days → two lines).
4. **Not** inferred from shopping check-offs or ingredient edits.

**Alternative rejected for recap accuracy**: single `lastCookedAt` only — cannot count multiple cooks in one week.

**Alternative rejected for scope**: append-only **`recipe_cook_events`** sync table — valid if scale demands, but YAGNI at “few thousand items”; array on item matches 001 patterns.

**Relation to 010**: Cookbook **source** (`cookbookId`, page) is metadata; it does **not** imply the recipe was cooked. Recap uses **`cookedDates` only**.

## Overlap with domain “insights” (002/003 Phase D)

Books and movies already define **activity days**, streaks, and **year goals** on domain screens. Recap **does not replace** those; it **aggregates across domains** with a single companion narrative in **`/recap`**. Yearly recap is **standalone** (no tie-in to book/movie goal screens). Copy MUST avoid duplicating guilt-prone streak loss patterns from fitness (008 assiduity stays opt-in and fitness-local).

## Activity tracker (heatmap) — recap desktop

**Product ask (Valentin 2026-10-28)**: GitHub-style grid at top of **`/recap`** on **desktop only**; hidden on mobile/narrow viewports (dense grid poor tap/read UX; list + bottom nav suffice).

**Correction (Valentin 2026-10-28)**: Day cells MUST support **multiple domain accents** when several recap domains had eligible activity on the **same calendar day** — not a single global accent for “any activity.”

| Concept | Rule |
|---------|------|
| **Active day** | Local calendar day with **≥ 1** recap-eligible event (union of FR-006 / table above). **Musique**: any 004 **`listened`** or 012 **`finishedAt` / `performedAt` / `practicedAt`** counts toward **one** Musique segment |
| **Visual MVP** | **Vertical micro-segments** inside each day cell: one equal-width column per **domain present** that day, left → right in **stable recap domain order** (Livres, Films & séries, Musique, Recettes, Entraînement). **Single-domain** day = full-cell fill in that domain’s accent. **No** intensity scale by event count in v1. |
| **Domain colors** | Map each segment to the domain’s **design-system accent token**: book, movie, music_track, recipe list-type accents from 005 / `list-type-visual`; **Entraînement** uses fitness accent token (planning). Shopping and other out-of-recap domains never appear. |
| **Segment cap** | Max **5** visible segment colors per cell (matches in-scope recap domains). If extensibility adds more contributors later, overflow domains appear in **tooltip + accessible name only** — not as extra strip colors beyond cap. |
| **Accessibility** | **French legend** (label + swatch per domain); per-cell **tooltip/focus** lists domains (and optional `eventCount`); accessible name includes **date + domain names** — not color alone. |
| **Range** | Default trailing **12 months** ending today unless plan ties range to selected period — spec allows either; plan must pick one |
| **Data** | Derived at read time from same aggregation as recap lists — **no new persisted heatmap table**; each day exposes `domainsPresent[]` ordered like list sections |

**Rejected for MVP**: binary single-accent “on/off” cells (superseded by multi-domain segments); multi-hue **intensity** by event count (adds legend burden); showing heatmap on phone (Valentin: out of scope).

## Extensibility

Recap aggregation MUST be driven by a **registry of domain contributors** (conceptual): each contributor declares event type, French label template, sort key, and how to read timestamps from local store. New domains (travel, restaurants, …) add a contributor without redesigning recap UI.

## Planning decisions (2026-10-28 — locked in plan)

| Topic | Decision |
|--------|----------|
| MVP v1 periods | **Day, week, month, year** — all four in v1 (Valentin **2026-10-28**); fitness PR highlights optional post-v1 |
| Heatmap window | **Trailing 365 local calendar days** ending today; **independent** of recap period switcher (OD-011-1) |
| Heatmap breakpoint | **`md` (768px)** — hidden below, visible at sidebar layout widths |
| Fitness segment color | **`#0d9488`** (app accent / fitness shell) |
| Domain order | Livres → Films & séries → Musique (004 + 012) → Recettes → Entraînement (`book`, `movie`, `music_track`, `recipe`, `fitness`) |
| **012 dependency** | Music-practice recap lines require **012** stores on device; ship **012 foundation** before or with music-practice contributor tasks ([011 tasks](tasks.md) T1195–T1196; [012 plan](../012-music-practice/plan.md)) |
| Bottom nav | **Récap** tab after FAB: Home, Search \| + \| Récap, Settings |
| Aggregation API | Single `buildRecapSnapshot({ period, timeZone, deps })` in application layer; see [contracts/recap-aggregation-service.md](contracts/recap-aggregation-service.md) |

## References

- Foundation: [001 spec](../001-typed-lists-companion/spec.md), [001 data-model](../001-typed-lists-companion/data-model.md)
- Vision: [009 spec](../009-experiences-achievements/spec.md)
