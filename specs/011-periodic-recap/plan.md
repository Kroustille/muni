# Implementation Plan: Periodic recap (daily / weekly / monthly / yearly)

**Branch**: `011-periodic-recap` (work on `main`) | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-periodic-recap/spec.md`

**Depends on**: **001–007** foundation; **008** fitness workout logs locally available; **012** music-practice entities locally available for Musique practice lines; recipe **`cookedDates`** ships as first 011 slice (see [research.md](research.md)). **Recommended after** stable **010** cookbook metadata and **012** sync if both land together — recap does not require 010 for aggregation.

**Task band**: **T1101–T1194** (see [tasks.md](tasks.md)).

**Product context**: Locked decisions in spec clarifications **2026-10-28**; completion signal inventory in [research.md](research.md).

## Summary

Ship a **read-only cross-domain Récap** at **`/recap`**: derive **`RecapAchievement`** rows and **`RecapActivityDay`** heatmap cells from **local stores only** (items + fitness logs + **012** music-practice stores) via a **registry of domain contributors** and a single **`buildRecapSnapshot`** application service. **MVP v1 (Phase A)**: **day**, ISO **week**, **calendar month**, and **calendar year** periods; **bottom-nav Récap**, optional **Accueil** weekly teaser, recipe **`cookedDates`** with **backdating**, **Musique** section (004 **écouté** + 012 **Terminé / Joué / Fait**), **desktop-only** GitHub-style **multi-domain vertical-segment** activity heatmap. **Phase B (optional)**: fitness PR subsection (FR-015); **learning_piece → comfortable** recap lines if product expands. No recap journal table, no server aggregation, no guilt copy (009 alignment).

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥22, Next.js 16+ (per 006 on `main`)

**Primary Dependencies**: Existing hexagonal stack; `LIST_TYPE_VISUAL` accents; book `reading-activity` / `book-stats` finish rules; movie `watch-activity` / episode progress; music track status; **012** composition / DJ / practice-log repositories; fitness workout repository (008); period math via `Intl` + shared **`Europe/Paris`** default timezone constant (reuse book/movie patterns until global preference)

**Storage**: **No new Postgres tables for recap**. Recipe extension: **`cookedDates: string[]`** on `items` (recipe type) as LWW json field + sync patch. All recap view models computed at read time in application layer.

**Testing**: Vitest for period boundaries, each contributor, aggregation sort/group rules, heatmap `domainsPresent`; Playwright offline `/recap` weekly + desktop heatmap visibility per [quickstart.md](quickstart.md); no-guilt copy checklist (SC-003); `yarn verify:ci` gate

**Target Platform**: PWA mobile-first; heatmap **only** at **`md` (768px)+** (`BottomNav` hidden breakpoint)

**Performance Goals**: SC-001 — 50 achievements in one month interactive within 2s offline on mid-tier mobile; design aggregation to scan items + fitness logs once per snapshot (O(n) domains)

**Constraints**: Read-only recap rows (optional deep link to detail); soft-deleted sources excluded (FR-014); shopping / artist-only / skipped workouts excluded; ISO weeks Monday-start; heatmap **no intensity scale**; max **6** segment colors per cell (OD-011-10)

**Scale/Scope**: Up to ~500 events per period (spec edge case); **6** in-scope recap domains MVP (through **Plantes**); extensibility via contributor registry (US6)

## Constitution Check

*GATE: Pass before Phase 0. Re-check after Phase 1.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-first | Pass | Recap reads IndexedDB + local fitness only |
| II. Capture speed | Pass | Cook action is explicit one-tap + optional date; no new daily obligation |
| III. Typed lists | Pass | Contributors per domain; recipe field on recipe type only |
| IV. Simplicity | Pass | Derived snapshots; `cookedDates` array not event table |
| V. Privacy | Pass | No analytics; user data only |
| VI. Portable backend | Pass | Recipe field via existing item sync |
| VII. Hexagonal | Pass | Domain types + `application/recap/*`; UI adapters consume snapshot DTO |

**Post-design**: Contributor registry adds indirection — justified in [research.md](research.md) § Extensibility; alternative monolithic switch rejected for 011+ domains.

## Project Structure

### Documentation (this feature)

```text
specs/011-periodic-recap/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── recap-aggregation-service.md
│   ├── ui-routes.md
│   ├── bottom-nav.md
│   ├── recipe-cooked-dates.md
│   └── recap-activity-heatmap.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (touch map — implementation, not in planning commit)

```text
src/domain/recap.ts                    # RecapPeriod, RecapAchievement, RecapActivityDay, DomainId order
src/domain/item-recipe.ts              # cookedDates validation (extend recipe shape)
src/application/recap/
  period.ts                            # week/month/day/year bounds, prev/next
  build-recap-snapshot.ts              # orchestrates contributors
  contributors/
    books-contributor.ts
    movies-contributor.ts
    music-tracks-contributor.ts       # 004 listened → domainId music_track
    music-practice-contributor.ts     # 012 finishedAt, performedAt, practice_log
    recipes-contributor.ts
    fitness-contributor.ts
    plants-contributor.ts
  recap-activity-days.ts               # heatmap derivation from achievements
src/application/recipes/record-cooked.ts
src/app/(app)/recap/page.tsx
src/components/recap/
  recap-page.tsx
  recap-period-controls.tsx
  recap-domain-sections.tsx
  recap-activity-heatmap.tsx           # desktop-only; multi-segment cells
  recap-home-teaser.tsx                  # optional Accueil card
src/components/nav-config.ts           # RECAP_NAV entry
src/components/BottomNav.tsx           # fifth tab slot
src/components/SidebarNav.tsx
src/i18n/fr.json
tests/unit/recap/
tests/e2e/recap.spec.ts
```

**Structure Decision**: Single **`buildRecapSnapshot`** use case returns `{ achievements, activityDays, sectionsMeta }` for both list UI and heatmap — one pass over contributors (DRY with FR-006 / User Story 7).

## Phased implementation outline (recommended ship order)

Aligned with spec **Phase A (MVP v1) → B (optional)**:

| Ship batch | Spec phase | User stories | Outcome |
|------------|------------|--------------|---------|
| **1 — Recipe signal** | A prereq | — | `cookedDates` schema, sync, record-cooked use case + recipe detail UI (backdate) |
| **2 — Aggregation core** | A | US1, US2, US4, US5, US6 | Period math (all four granularities), contributors (incl. **012** when stores exist), grouped list VM, unit tests |
| **3 — Route & nav** | A | US3 | `/recap`, bottom-nav **Récap**, optional home teaser |
| **4 — Period UI** | A | US2, US4, US5 | Semaine / Mois / Aujourd’hui (or Hier) / Cette année controls + prev/next; month labels on yearly lines |
| **5 — Desktop heatmap** | A | US7 | Multi-segment grid, legend, a11y, trailing window |
| **6 — Optional** | B | FR-015 | Fitness PR highlights subsection |

## Open decisions (defaults locked in research.md)

| ID | Topic | Default |
|----|--------|---------|
| OD-011-1 | Heatmap date window | **Fixed trailing 365 local days** ending **today** — **does not** shrink/grow when user changes week/month period (list and heatmap decoupled; less jarring than sync-to-period) |
| OD-011-2 | Heatmap breakpoint | **`md` (768px)** — match `BottomNav` `md:hidden` / sidebar `md:flex` |
| OD-011-3 | Fitness heatmap accent | **`#0d9488`** — same as app `--accent` / fitness shell (not a list-type row) |
| OD-011-4 | Default timezone | **`Europe/Paris`** — export `DEFAULT_RECAP_TIMEZONE` aliasing book/movie constants until user TZ preference |
| OD-011-5 | Stable domain order | `book` → `movie` → `music_track` → `recipe` → `fitness` → `plants` (French **Musique** = 004 + 012 events; one heatmap segment) |
| OD-011-8 | **012 gate** | Implement **`music-practice-contributor`** only after **012** Phase 2 checkpoint (repos + local stores); track contributor may ship earlier |
| OD-011-9 | Plants heatmap accent | **`#16a34a`** — plants shell token (005 extension) |
| OD-011-10 | Heatmap segment cap | **6** visible segment colors (`book`, `movie`, `music_track`, `recipe`, `fitness`, `plants`); future domains overflow to tooltip/a11y text only |
| OD-011-6 | Bottom nav layout | **Home, Search \| + \| Récap, Settings** — Récap inserted post-FAB per [contracts/bottom-nav.md](contracts/bottom-nav.md) |
| OD-011-7 | Home teaser | **Ship in MVP v1** behind simple predicate (≥0 achievements); gentle copy only |

## Complexity Tracking

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|-------------------------------------|
| Contributor registry | FR-013 / US6 extensibility | Giant `switch(type)` in UI becomes unmaintainable as domains grow |
| Separate heatmap derivation pass | Could merge into one loop | Single loop preferred in implementation — document shared `RecapAchievement[]` input to `buildActivityDays` |
| `cookedDates` array on item | Multiple cooks per period | `lastCookedAt` only loses weekly/monthly fidelity (research) |
