# Implementation Plan: Music practice — compositions, DJ sets & instrument learning

**Branch**: `012-music-practice` (work on `main`) | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-music-practice/spec.md`

**Depends on**: **001** foundation (auth, offline sync, French UI, search patterns). **Optional read** of **004** track rows for P2 link pickers only — no 004 schema changes in 012 v1.

**Task band**: **T1201–T1294** (see [tasks.md](tasks.md)).

**Product context**: Three typed workflows under **Musique — pratique** hub; apprentissage mirrors **008** plan/today/done pattern with **user-named** exercises ([research.md](research.md) PD-012-*). **[011 recap](../011-periodic-recap/spec.md)** reads **`finishedAt`**, **`performedAt`**, **`practicedAt`** via dedicated contributors ([011 tasks](../011-periodic-recap/tasks.md) T1195–T1196) after **012** foundation ships.

## Summary

Ship **Musique — pratique** with **Compositions** (project lifecycle + session notes), **Sets DJ** (prévu → joué + setlist), and **Apprentissage** (instrument registry, exercise library, one active **practice plan**, **today** + **mark done** → **practice logs**, **learning pieces** with optional **004** track link). **Offline-first** IndexedDB + Postgres with dedicated **`/api/sync/music-practice/*`** push/pull for all 012 entities (not `items` enum). **No audio** hosting or playback. **P2**: 004 track links on composition, setlist lines, learning pieces.

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥22, Next.js 16+ (per 006 on `main`)

**Primary Dependencies**: Existing hexagonal stack; sync patterns from **008 fitness** and **010 cookbooks**; list/detail/quick-add from library domains; `normalizeText` for local search; 004 track search adapter reuse for P2 pickers only

**Storage**:
- New tables: `music_composition`, `dj_set`, `practice_instrument`, `practice_exercise`, `practice_plan`, `practice_log`, `learning_piece` (composite PK `user_id`, `id`; soft delete + LWW jsonb per foundation)
- IndexedDB object stores mirroring each entity
- Kysely migration **`0016_music_practice_tables.ts`** (after **`0015`** cookbooks from 010 when present on branch)

**Testing**: Vitest domain validation per entity; music-practice sync isolation tests mirroring fitness; Playwright e2e per [quickstart.md](quickstart.md); `yarn verify:ci` gate

**Target Platform**: PWA mobile-first; desktop parity on forms and hub tabs

**Constraints**: Title-only quick-add (FR-003, FR-014–FR-015); French i18n only; no guilt copy (009); no audio upload (FR-008); learning **linkedTrackId** must not write 004 listen status (FR-020)

**Scale/Scope**: One user; hundreds of rows per sub-domain; P1 stories A1–A2, B1, C1–C3; P2 filters and 004 links

## Constitution Check

*GATE: Pass before Phase 0. Re-check after Phase 1.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-first | Pass | All CRUD local; sync background |
| II. Capture speed | Pass | Title/name-only create on all workflows |
| III. Typed lists | Pass | Seven entity families; not generic notes |
| IV. Simplicity | Pass | Per-field LWW; plan assignments as jsonb on plan row (008 pattern) |
| V. Privacy | Pass | Per-user tables + sync isolation tests |
| VI. Portable backend | Pass | Postgres migration + ports/adapters |
| VII. Hexagonal | Pass | Domain types + `application/music-practice/*`; UI in components only |

**Post-design**: Single sync channel for multiple entity types justified — same user session and offline queue as fitness; splitting routes per entity optional if payload size requires (OD-012-8).

## Project Structure

### Documentation (this feature)

```text
specs/012-music-practice/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
├── contracts/
│   ├── music-practice-sync-api.md
│   ├── ui-routes.md
│   ├── composition-workflow-ui.md
│   ├── dj-set-workflow-ui.md
│   ├── apprentissage-plan-ui.md
│   ├── learning-piece-ui.md
│   └── track-link-picker.md
└── tasks.md
```

### Source Code (touch map — implementation, not in this planning commit)

```text
src/domain/music-composition.ts
src/domain/dj-set.ts
src/domain/practice-instrument.ts
src/domain/practice-exercise.ts
src/domain/practice-plan.ts
src/domain/practice-log.ts
src/domain/learning-piece.ts
src/application/music-practice/
  composition-*.ts, dj-set-*.ts, practice-*.ts, learning-piece-*.ts
  music-practice-sync.ts
src/application/ports/music-practice-*-repository.ts
src/adapters/postgres/music-practice-*-repository.ts
src/adapters/indexeddb/music-practice-*-repository.ts
src/app/api/sync/music-practice/push/route.ts
src/app/api/sync/music-practice/pull/route.ts
src/composition/sync-run.ts
src/app/(app)/music-practice/
src/components/music-practice/
db/migrations/0016_music_practice_tables.ts
src/i18n/fr.json
tests/unit/music-practice/
tests/integration/music-practice-sync.test.ts
tests/e2e/music-practice.spec.ts
```

**Structure Decision**: Mirror **008** — practice entities **not** in `items` enum; **004** remains authoritative for listen status; optional FK-like ids stored as uuid strings validated client-side.

## Phased implementation outline (recommended ship order)

| Ship batch | Workflows | User stories | Outcome |
|------------|-----------|--------------|---------|
| **1 — Foundation** | — | — | Migration, domain, repos, sync channel, hub shell + i18n |
| **2 — Compositions** | A | A1, A2 | Quick-add, status, session notes, terminé + finishedAt |
| **3 — DJ sets** | B | B1, B2 | Performed/planned, setlist text, validation |
| **4 — Apprentissage core** | C | C1, C2, C3 | Instruments, exercises, plan, today, mark done, learning pieces |
| **5 — Polish** | A–C | A3, B3–B4, C4 | Filters, search, cancel/archive flows |
| **6 — P2 links** | A–C | B4, A3 links | 004 track picker shared component |

## Locked decisions (Valentin 2026-10-28)

| ID | Topic | Decision |
|----|--------|----------|
| OD-012-9 | Apprentissage IA | One screen with sections — see [ui-routes.md](contracts/ui-routes.md) |
| OD-012-10 | Composition create | Default **`idea`**; **`in_progress`** in picker |
| OD-012-11 | **`comfortable`** | Not recap-eligible; **`practice_log`** only for 011 |

## Open decisions (implementation defaults)

| ID | Topic | Default |
|----|--------|---------|
| OD-012-1 | Hub route | `/music-practice` with tab query or nested routes per [contracts/ui-routes.md](contracts/ui-routes.md) |
| OD-012-2 | Sync routes | `POST /api/sync/music-practice/push`, `GET /api/sync/music-practice/pull` |
| OD-012-3 | Plan assignments | jsonb `assignments` on `practice_plan` row |
| OD-012-4 | Session notes / setlist | jsonb arrays on composition / dj_set rows (LWW whole field) |
| OD-012-5 | Nav label | `musicPractice.nav` → « Musique — pratique » |
| OD-012-6 | Default composition status | `idea` on create |
| OD-012-7 | **011 recap** | [011 spec](../011-periodic-recap/spec.md) **Musique** lines from **`finishedAt`**, **`performedAt`**, **`practice_log.practicedAt`**; implement [011 T1195–T1196](../011-periodic-recap/tasks.md) after T1216 |
| OD-012-8 | Push payload | Single batch body with entity arrays (split later if needed) |

## Complexity Tracking

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| Dedicated tables + sync | Nested session notes, setlists, plan assignments | `items` types would overload sync and blur 004 semantics |
| Third workflow entities | Different UX from composition | Merging into composition breaks plan/mark-done model (spec Workflow C) |
| Optional 004 ids | Reference recording without listen side effects | Embedding track metadata duplicates 004 and risks status coupling |
