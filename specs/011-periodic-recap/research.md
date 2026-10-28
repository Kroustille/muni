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
| **Séries** | 003 | Episode marked in **`episodeProgress`** | `watchedAt` on episode key `S{n}E{m}` | Each episode date is its own recap line (not a separate journal table) |
| **Séries (whole)** | 003 | Status → **`watched`** | Same as films | Distinct from per-episode lines |
| **Music tracks** | [004](../004-music-artists-tracks/spec.md) | Status → **`listened`** | `fieldsUpdatedAt.status` when entering `listened` | **Music artists** have rating only — **no** `listened` status → **exclude artists** from recap counts unless product adds status later |
| **Recipes** | [001](../001-typed-lists-companion/spec.md) | **None today** | — | Requires new explicit signal (see below) |
| **Fitness workouts** | [008](../008-fitness-training/spec.md) | Workout log **`completed`** | `completedAt` (fallback `calendarDate` at local day granularity if missing) | Exclude `abandoned`, `in_progress`; **skipped** planned sessions are **not** achievements |
| **Fitness PRs** | 008 | New personal record on save | Derived at save time from log | **Phase B** recap highlight (optional subsection), not MVP blocker |
| **Shopping** | 001 | `checked` on items | — | **Out of recap** — errands, not life milestones (009 table) |
| **Quotes** (book/movie) | 002/003 | Quote created | `createdAt` | **Out of recap MVP** — capture, not “finished” experience |

## Timezone and calendar boundaries

- Reuse domain precedent: **local calendar day** in user timezone (default **`Europe/Paris`** until a global user timezone preference exists — same as 002/003 activity rules).
- **Week**: ISO week (Monday start) unless product later adds locale-specific week; document in spec as ISO for consistency with fitness week views.
- **Month / year**: calendar month and calendar year in user timezone.

## Recipe “cooked” — proposed signal (011 dependency on recipe domain)

**Problem**: Recipe items have ingredients/steps only; creating or editing a recipe is not “having cooked it.”

**Proposed (MVP)**:

1. Add an optional, explicit user action on recipe detail: **« Cuisiné aujourd’hui »** (or **« Marquer comme cuisinée »** with default today).
2. Persist **`cookedDates`**: ordered array of **ISO calendar dates** (`YYYY-MM-DD`) on the recipe item — **one LWW JSON field** on `items` (constitution-aligned with `ingredients` / `steps`), append-only semantics in the use case (each tap appends today unless already present for that day — **same-day dedupe** avoids double-tap inflation).
3. Recap counts **one achievement per date entry** in the period (same recipe cooked twice on two days → two lines or count 2).
4. **Optional later**: allow picking another date (backfill) — **out of MVP** unless Valentin wants it in first slice.
5. **Not** inferred from shopping check-offs or ingredient edits.

**Alternative rejected for recap accuracy**: single `lastCookedAt` only — cannot count multiple cooks in one week.

**Alternative rejected for scope**: append-only **`recipe_cook_events`** sync table — valid if scale demands, but YAGNI at “few thousand items”; array on item matches 001 patterns.

**Relation to 010**: Cookbook **source** (`cookbookId`, page) is metadata; it does **not** imply the recipe was cooked. Recap uses **`cookedDates` only**.

## Overlap with domain “insights” (002/003 Phase D)

Books and movies already define **activity days**, streaks, and **year goals** on domain screens. Recap **does not replace** those; it **aggregates across domains** with a single companion narrative. Copy MUST avoid duplicating guilt-prone streak loss patterns from fitness (008 assiduity stays opt-in and fitness-local).

## Extensibility

Recap aggregation MUST be driven by a **registry of domain contributors** (conceptual): each contributor declares event type, French label template, sort key, and how to read timestamps from local store. New domains (travel, restaurants, …) add a contributor without redesigning recap UI.

## References

- Foundation: [001 spec](../001-typed-lists-companion/spec.md), [001 data-model](../001-typed-lists-companion/data-model.md)
- Vision: [009 spec](../009-experiences-achievements/spec.md)
