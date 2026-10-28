# Implementation Plan: Fitness — séance library, session logging, progression

**Branch**: `008-fitness-training` (work on `main`) | **Date**: 2026-10-19 (session-first realignment **2026-10-28**) | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-fitness-training/spec.md`

**Depends on**: **001–007** foundation (auth, offline sync, French UI, home patterns, list UX norms). No dependency on external fitness APIs.

**Task band**: **T801–T8xx** (see [tasks.md](tasks.md) — **regenerate or amend** when implementing session-first migration; not in scope for this spec-only update).

**Product context**: Locked decisions in spec § Constraints & decisions + **Clarifications 2026-10-28 (session-first)**; exercise seed in [exercises.catalog.json](exercises.catalog.json) + [muscles.catalog.json](muscles.catalog.json).

## Summary

Add a **typed fitness domain**: a **library of séance templates** (catalog-based exercises); **do now** (**Démarrer** any séance anytime); optional **planifier** on explicit calendar dates; **workout logs** with optional set-level precision (reps, charge, duration, RPE); **history and progression** with PR highlights; Phase **D** adds recovery check-in, adherence streak, and home card. **Offline-first** via IndexedDB + dedicated Postgres tables and sync routes (Kysely migrations). **French-only** UI. **Bundled exercise catalog** (versioned seed, no Health/Garmin).

**2026-10-28 note**: Spec de-emphasizes **one active weekly program with weekday slots**. Code on `main` may still follow the earlier program editor shape until a migration task lands ([research.md](research.md) §11).

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥22, Next.js 16+ (per 006 on `main`)

**Primary Dependencies**: Existing hexagonal stack; `normalizeText` for catalog search; `UndoDeleteProvider`; sync engine patterns from items and book quotes

**Storage (target shape)**: New tables `fitness_user_settings`, **`fitness_seance_template`**, **`fitness_scheduled_seance`**, `fitness_workout_log`, `fitness_skip_record` (see [data-model.md](data-model.md)); client IndexedDB mirrors + catalog store; Kysely migration `0014_*` (tentative id). **Legacy**: `fitness_program` + jsonb `plannedSessions` with `weekdays[]` may exist on `main` — reconcile in implementation.

**Testing**: Vitest for domain validation, PR derivation, week adherence; repository + sync isolation tests; Playwright e2e per [quickstart.md](quickstart.md); `node specs/008-fitness-training/validate-catalog.mjs` in gate

**Target Platform**: PWA mobile-first; desktop usable for séance library editing

**Constraints**: No custom exercises (FR-028); no wearable APIs; catalog offline-only; one in-progress workout; soft delete + undo; charge kg internally; duration seconds internally

**Scale/Scope**: Single-user thousands of logs; ~121 catalog exercises; Phases A–C MVP (~8 user stories), D deferred in tasks

## Constitution Check

*GATE: Pass before Phase 0. Re-check after Phase 1.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-first | Pass | All fitness CRUD local; catalog bundled |
| II. Capture speed | Pass | Terminé without full set detail allowed |
| III. Typed lists | Pass | Dedicated domain, not generic notes |
| IV. Simplicity | Pass | LWW jsonb arrays; derived PRs; no CRDT |
| V. Privacy | Pass | Per-user tables + isolation tests |
| VI. Portable backend | Pass | Postgres + ports/adapters |
| VII. Hexagonal | Pass | Use cases in `application/fitness/*` |

**Post-design**: Separate fitness sync routes mirror quotes pattern — justified complexity in [research.md](research.md) §1.

## Project Structure

### Documentation (this feature)

```text
specs/008-fitness-training/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── exercises.catalog.json
├── muscles.catalog.json
├── validate-catalog.mjs
├── contracts/
│   ├── ui-routes.md
│   ├── exercise-catalog.md
│   ├── fitness-sync-api.md
│   ├── program-editor.md          # rename/amend → séance library in implement task
│   ├── workout-log-ui.md
│   └── progression.md
└── tasks.md
```

### Source Code (touch map — implementation, not in this PR)

```text
src/domain/fitness/
  seance-template.ts, scheduled-seance.ts, workout-log.ts, catalog.ts, progression.ts, adherence.ts
src/application/fitness/
  seance-*, schedule-*, workout-*, skip-*, catalog-seed.ts, progression-*
src/application/ports/fitness-*-repository.ts
src/adapters/postgres/fitness-*-repository.ts
src/adapters/indexeddb/fitness-*-repository.ts
src/app/api/sync/fitness/
src/app/(app)/fitness/
src/components/fitness/
public/fitness/exercises.catalog.json   # copied from spec seed at build
db/migrations/0014_fitness_tables.ts
src/i18n/fr.json
tests/unit/fitness/
tests/e2e/fitness/
```

**Structure Decision**: Mirror **book quotes** split: fitness entities **not** added to `items` enum; catalog is **client static seed** only.

## Phased implementation outline (recommended ship order)

Aligned with spec product phases **A → B → C → D**:

| Ship batch | Spec phase | User stories | Outcome |
|------------|------------|--------------|---------|
| **1 — Foundation** | — | — | Migrations, repos, sync, catalog seed, nav shell, i18n |
| **2 — Library & today** | A | US1, US2 | Séance library, **planifier**, fitness home, start/skip/libre |
| **3 — Log & precision** | B | US3, US4 | Set logging, picker + recent, duplicate template |
| **4 — Progression** | C | US5, US6 | History, progression, week strip |
| **5 — Companion** | D | US7, US8 | Recovery, streak, home card |

## Open decisions (defaults in research.md)

| ID | Topic | Default |
|----|--------|---------|
| OD-008-1 | Sync route shape | Single push/pull pair under `/api/sync/fitness/*` |
| OD-008-2 | Template storage | One row per **séance template**; `templateExercises` jsonb; **scheduled séances** as separate rows (preferred over weekdays on template) |
| OD-008-3 | Nav label | i18n key `fitness.nav` → “Entraînement”; library → “Mes séances” (tentative) |
| OD-008-4 | Build copy of catalog | `public/fitness/` static file + import in seed use case |
| OD-008-5 | Phase D schema | Nullable `recovery` on workout log in migration 0014; UI in D tasks |
| OD-008-6 | Legacy `fitness_program` | See research.md §11 — migration TBD in implement task |

## Complexity Tracking

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| Dedicated fitness tables + sync | Nested logs and template structure | `items` type would break field constraints and sync size |
| jsonb `loggedExercises` | Many sets per workout | Normalized sets table = more sync entities for MVP |
| Bundled catalog + IndexedDB | FR-027 offline gym | Runtime API conflicts with offline mandate |
| `fitness_scheduled_seance` rows | Explicit-date **planifier** without recurrence engine | Weekday arrays on templates recreate rejected UX |
