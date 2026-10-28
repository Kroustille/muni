# Implementation Plan: Plants & garden companion

**Branch**: `013-plants-garden` (work on `main`) | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-plants-garden/spec.md`

**Depends on**: **001** foundation (auth, offline sync, French UI, quick-add). **011 periodic recap** consumes plant events via **`plants`** contributor ([011 T1115](../011-periodic-recap/tasks.md), [011 contracts](../011-periodic-recap/contracts/recap-aggregation-service.md)) — 013 owns stores and event shapes; 011 owns aggregation UI.

**Task band**: **T1301–T1384** (see [tasks.md](tasks.md)).

**Product context**: Dedicated **Plantes** typed domain — houseplants + potager in one area; **`locationTag`** indoor/outdoor/both; care as append-only **`plant_care_event`** with calendar **`occurredAt`** (backdate, same-day dedupe for **`water`**); P2 seasonal hints and **`vegetable_culture`** milestones. **[011](../011-periodic-recap/spec.md)** heatmap segment **`plants`** (`#16a34a`, sixth domain in stable order).

## Summary

Ship **Plantes** with title-only plant quick-add, location tag, explicit **Arrosé** / **Soin** actions → **`plant_care_event`** rows; derived **Dernier arrosage**; optional P2 **seasonal hints**, **care profiles**, **vegetable culture** + milestone buttons. **Offline-first** IndexedDB + Postgres with dedicated **`/api/sync/plants-garden/*`** push/pull (mirror **008** / **012**). **No** plant ID API, **no** push reminders, **no** guilt copy (009). Recap-eligible events satisfy [research.md](research.md) § Recap signals for [011](../011-periodic-recap/research.md).

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥22, Next.js 16+ (per 006 on `main`)

**Primary Dependencies**: Existing hexagonal stack; sync patterns from **008 fitness** and **012 music-practice**; quick-add/list/detail from library domains; `normalizeText` for local plant search (P2); recipe **`cookedDates`** / **`recordRecipeCooked`** as UX reference for backdate + dedupe

**Storage**:
- New tables: `plant`, `plant_care_event`, `plant_care_profile` (P2), `vegetable_culture` (P2), `vegetable_milestone` (P2) (composite PK `user_id`, `id`; soft delete + LWW jsonb per foundation)
- `plant.seasonal_hints` jsonb on plant row OR normalized hint rows — **default: jsonb `seasonalHints` on `plant`** (008 `plannedSessions` pattern) for MVP P2
- IndexedDB object stores mirroring each entity
- Kysely migration **`0017_plants_garden_tables.ts`** (after **`0016`** music-practice from 012 when present; after **`0015`** cookbooks from 010 when present)

**Testing**: Vitest domain validation (location tag, care types, water dedupe per calendar day, last-watered max date, milestone dedupe); plants-garden sync isolation tests mirroring fitness; recap contributor fixture tests aligned with [011 T1115](../011-periodic-recap/tasks.md); Playwright e2e per [quickstart.md](quickstart.md); `yarn verify:ci` gate

**Target Platform**: PWA mobile-first; desktop parity on forms and list

**Constraints**: Title-only quick-add (FR-002); French i18n only; **`occurredAt`** not future (user TZ, default Europe/Paris); no identification API (FR-014); no overdue badges (FR-013, SC-005); deleted plant hides care from recap (011 FR-014 alignment)

**Scale/Scope**: One user; hundreds of plants/events; P1 stories US1–US3; P2 US4–US6

## Constitution Check

*GATE: Pass before Phase 0. Re-check after Phase 1.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-first | Pass | All CRUD local; sync background |
| II. Capture speed | Pass | Name-only plant create |
| III. Typed lists | Pass | Dedicated domain; not generic notes or shopping |
| IV. Simplicity | Pass | Per-field LWW; seasonal hints as jsonb; derived last-watered |
| V. Privacy | Pass | Per-user tables + sync isolation tests |
| VI. Portable backend | Pass | Postgres migration + ports/adapters |
| VII. Hexagonal | Pass | Domain types + `application/plants-garden/*`; UI in components only |

**Post-design**: Single sync channel for multiple entity types justified — same offline queue as fitness/012; see [contracts/plants-garden-sync-api.md](contracts/plants-garden-sync-api.md).

## Project Structure

### Documentation (this feature)

```text
specs/013-plants-garden/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
├── contracts/
│   ├── plants-garden-sync-api.md
│   ├── ui-routes.md
│   ├── plant-list-detail-ui.md
│   ├── plant-care-events-ui.md
│   ├── plants-recap-port.md
│   ├── seasonal-hints-ui.md
│   └── vegetable-culture-ui.md
└── tasks.md
```

### Source Code (touch map — implementation, not in this planning commit)

```text
src/domain/plant.ts
src/domain/plant-care-event.ts
src/domain/plant-care-profile.ts          # P2
src/domain/vegetable-culture.ts           # P2
src/domain/vegetable-milestone.ts         # P2
src/application/plants-garden/
  plant-*.ts, care-event-*.ts, culture-*.ts, plants-garden-sync.ts
  plants-recap-query.ts                   # port impl for 011 contributor
src/application/ports/plants-garden-*-repository.ts
src/adapters/postgres/plants-garden-*-repository.ts
src/adapters/indexeddb/plants-garden-*-repository.ts
src/app/api/sync/plants-garden/push/route.ts
src/app/api/sync/plants-garden/pull/route.ts
src/composition/sync-run.ts
src/app/(app)/plants/
src/components/plants/
db/migrations/0017_plants_garden_tables.ts
src/i18n/fr.json
tests/unit/plants-garden/
tests/unit/recap/plants-contributor.test.ts  # shared with 011 T1115
tests/integration/plants-garden-sync.test.ts
tests/e2e/plants-garden.spec.ts
```

**Structure Decision**: Mirror **012** — plant entities **not** in `items` enum; recap reads domain events only (FR-012).

## Phased implementation outline (recommended ship order)

| Ship batch | Workflows | User stories | Outcome |
|------------|-----------|--------------|---------|
| **1 — Foundation** | — | — | Migration, domain, repos, sync channel, nav shell + i18n |
| **2 — Plants capture** | List/detail | US1 | Quick-add, location tag, soft delete |
| **3 — Watering** | Care log | US2 | **Arrosé**, backdate, dedupe, **Dernier arrosage** |
| **4 — Other care** | Care menu | US3 | Fertilize/repot/prune/mist/other + recap port |
| **5 — P2 seasonal** | Hints | US4 | Seasonal hints jsonb + **Fait** → event |
| **6 — P2 potager** | Culture | US5 | Vegetable culture + milestone buttons |
| **7 — P2 list polish** | Browse | US6 | Last-watered column, location filters |
| **8 — 011 integration** | Recap | — | Wire `PlantsRecapRepository`; verify [T1115](../011-periodic-recap/tasks.md) + heatmap **`plants`** segment |

## Open decisions (defaults in research.md)

| ID | Topic | Default |
|----|--------|---------|
| OD-013-1 | Hub route | `/plants` — label **Plantes** ([contracts/ui-routes.md](contracts/ui-routes.md)) |
| OD-013-2 | Sync routes | `POST /api/sync/plants-garden/push`, `GET /api/sync/plants-garden/pull` |
| OD-013-3 | Seasonal hints storage | jsonb `seasonalHints` on `plant` row; LWW whole field |
| OD-013-4 | Potager UX | Subsection **Potager** under same route + filter `outdoor` / culture list |
| OD-013-5 | Nav label | `plants.nav` → « Plantes » |
| OD-013-6 | Default location tag | `indoor` on create (French **Intérieur**) |
| OD-013-7 | **011 recap** | Implement event recording in 013; **`plants-contributor`** in 011 [T1115](../011-periodic-recap/tasks.md) reads [plants-recap-port.md](contracts/plants-recap-port.md); heatmap segment per [011 recap-activity-heatmap](../011-periodic-recap/contracts/recap-activity-heatmap.md) |
| OD-013-8 | Push payload | Single batch `{ plants[], careEvents[], cultures[], milestones[], careProfiles[] }` |

## Complexity Tracking

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| Dedicated tables + sync | Care event log + milestones | `items` type would break dedupe and recap mapping |
| Separate `vegetable_culture` entity | Milestone UX distinct from houseplant detail | Overloading `plant` blurs potager semantics (spec US5) |
| Append-only care events + derived last-watered | Recap needs history; backdate rules | Single `lastWateredAt` field loses recap lines and audit |
| Recap query port in 013 | 011 contributor must not duplicate domain rules | Inline SQL in recap module violates hexagonal boundaries |
