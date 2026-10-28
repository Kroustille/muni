# Tasks: Plants & garden companion (013)

**Input**: `/specs/013-plants-garden/`

**Prerequisites**: Feature **001** on `main`. Design docs: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md). Cross-ref: [011 tasks](../011-periodic-recap/tasks.md) **T1115** (plants contributor), **T1114** (heatmap **`plants`** segment).

**Task IDs**: **T1301–T1384** (feature 013 band).

---

## Phase 1: Setup

- [X] T1301 [P] Add `plants.*` i18n keys (nav, location tags, care labels, potager, empty states, dedupe toast) in `src/i18n/fr.json` per [contracts/ui-routes.md](contracts/ui-routes.md) and [plant-care-events-ui.md](contracts/plant-care-events-ui.md)
- [X] T1302 [P] Scaffold domain modules `src/domain/plant.ts` and `src/domain/plant-care-event.ts` stubs per [data-model.md](data-model.md)
- [X] T1303 [P] Create `tests/unit/plants-garden/` directory and fixture builders for plants + care events

---

## Phase 2: Foundational

**Purpose**: Migration, repositories, sync — blocks all user stories.

- [X] T1304 Unit tests plant validation (`title` trimmed length **1–500**, `locationTag` **`indoor`** \| **`outdoor`** \| **`both`**) in `tests/unit/plants-garden/plant-domain.test.ts`
- [X] T1305 Unit tests care event validation (`eventType` enum, `occurredAt` not future, notes max **2000**) in `tests/unit/plants-garden/care-event-domain.test.ts`
- [X] T1306 Unit tests water dedupe at most **one `water` event per plant per calendar day** in `tests/unit/plants-garden/water-dedupe.test.ts`
- [X] T1307 Unit tests **Dernier arrosage** = max `occurredAt` among `water` events in `tests/unit/plants-garden/last-watered.test.ts`
- [X] T1308 Implement `src/domain/plant.ts` and `src/domain/plant-care-event.ts` (depends on T1304, T1305)
- [X] T1309 Migration `db/migrations/0017_plants_garden_tables.ts` (`plant`, `plant_care_event` P1 columns) + register in `db/migrations/index.ts`
- [X] T1310 [P] Ports `src/application/ports/plants-garden-plant-repository.ts` and `plants-garden-care-event-repository.ts`
- [X] T1311 Postgres adapters `src/adapters/postgres/plants-garden-*-repository.ts` with user scoping and pullSince
- [X] T1312 IndexedDB adapters + store version bump in `src/adapters/indexeddb/db.ts`
- [X] T1313 Integration tests push/pull + isolation in `tests/integration/plants-garden-sync.test.ts`
- [X] T1314 Implement `src/application/plants-garden-sync.ts` and routes `src/app/api/sync/plants-garden/push/route.ts`, `pull/route.ts` per [contracts/plants-garden-sync-api.md](contracts/plants-garden-sync-api.md) (depends on T1313)
- [X] T1315 Register plants-garden sync channel in `src/composition/sync-run.ts` and client composition
- [X] T1316 Application use cases: plant list/upsert/softDelete and care event append in `src/application/plants-garden/`
- [X] T1317 Wire repositories into `src/composition/client.ts` and `src/composition/server.ts`
- [X] T1318 Layout shell `src/app/(app)/plants/layout.tsx` and nav entry per [contracts/ui-routes.md](contracts/ui-routes.md)

**Checkpoint**: Migration applies; push/pull green; `/plants` shell reachable.

---

## Phase 3: User Story 1 — Add a plant quickly (P1)

**Goal**: Title-only quick-add, location tag on detail, offline persist (FR-002, FR-003).

**Independent Test**: [quickstart.md](quickstart.md) § P1 — Add plant.

- [X] T1320 [US1] Plant list + quick-add `src/components/plants/plant-list.tsx` per [contracts/plant-list-detail-ui.md](contracts/plant-list-detail-ui.md)
- [X] T1321 [US1] Plant detail fields (title, location tag, notes) `src/components/plants/plant-detail.tsx`
- [X] T1322 [US1] Routes `src/app/(app)/plants/page.tsx` and `[id]/page.tsx` (depends on T1320, T1321)
- [X] T1323 [US1] E2e offline quick-add `tests/e2e/plants-garden.spec.ts` (depends on T1322)

---

## Phase 4: User Story 2 — Log watering (P1)

**Goal**: **Arrosé**, backdate, dedupe, **Dernier arrosage** (FR-004–FR-006, FR-008).

**Independent Test**: [quickstart.md](quickstart.md) § P1 — Watering.

- [X] T1330 [US2] Implement `recordPlantWatered` use case with dedupe + max last-watered in `src/application/plants-garden/record-care-event.ts` (depends on T1306, T1307, T1308)
- [X] T1331 [US2] **Arrosé** button + date picker UI in `src/components/plants/plant-care-actions.tsx` per [contracts/plant-care-events-ui.md](contracts/plant-care-events-ui.md)
- [X] T1332 [US2] Show **Dernier arrosage** on detail from derived query (depends on T1330, T1321)
- [X] T1333 [US2] Extend e2e water + same-day dedupe in `tests/e2e/plants-garden.spec.ts` (depends on T1331)

---

## Phase 5: User Story 3 — Log other care actions (P1)

**Goal**: Fertilize/repot/prune/mist/other with backdate (FR-007).

**Independent Test**: [quickstart.md](quickstart.md) § P1 — Other care.

- [X] T1340 [US3] Extend `record-care-event.ts` for all `PlantCareEventType` values **`fertilize`**, **`repot`**, **`prune`**, **`mist`**, **`other`**
- [X] T1341 [US3] **Soin** menu UI for non-water types in `src/components/plants/plant-care-actions.tsx` (depends on T1340)
- [X] T1342 [US3] Unit tests multiple care types same day in `tests/unit/plants-garden/care-event-domain.test.ts` (extend)
- [X] T1343 [US3] Implement `src/application/plants-garden/plants-recap-query.ts` + repo range queries per [contracts/plants-recap-port.md](contracts/plants-recap-port.md) (depends on T1316)
- [X] T1344 [US3] Unit tests recap query excludes soft-deleted plants in `tests/unit/plants-garden/recap-query.test.ts` (depends on T1343)

**Checkpoint**: P1 MVP — plant + all care types + recap port ready for [011 T1115](../011-periodic-recap/tasks.md).

---

## Phase 6: User Story 4 — Seasonal care guide (P2)

**Goal**: Seasonal hints jsonb + **Fait** → event (FR-009).

**Independent Test**: [quickstart.md](quickstart.md) § P2 — Seasonal hints.

- [X] T1350 [US4] Extend migration + domain for `seasonalHints` jsonb on `plant` and `plant_care_profile` table per [data-model.md](data-model.md)
- [X] T1351 [US4] Domain + tests for `PlantSeasonalHint` (`actionText` **1–500**, `monthRangeText` max **100**) in `tests/unit/plants-garden/seasonal-hints.test.ts`
- [X] T1352 [US4] Seasonal hints editor UI `src/components/plants/plant-seasonal-hints.tsx` per [contracts/seasonal-hints-ui.md](contracts/seasonal-hints-ui.md)
- [X] T1353 [US4] **Fait** flow creating care event with `seasonalHintId` (depends on T1352, T1340)
- [X] T1354 [US4] Care profile list/copy use cases under `src/application/plants-garden/care-profile.ts` (depends on T1350)

---

## Phase 7: User Story 5 — Vegetable culture milestones (P2)

**Goal**: Potager CRUD + milestone buttons (FR-010).

**Independent Test**: [quickstart.md](quickstart.md) § P2 — Potager.

- [X] T1360 [US5] Domain `src/domain/vegetable-culture.ts`, `vegetable-milestone.ts` + migration columns for P2 entities
- [X] T1361 [US5] Unit tests milestone dedupe per `(cultureId, milestoneType, calendar day)` in `tests/unit/plants-garden/milestone-dedupe.test.ts`
- [X] T1362 [US5] Repos + sync payload arrays for cultures/milestones in push/pull (depends on T1360)
- [X] T1363 [US5] Potager list/detail UI `src/components/plants/vegetable-culture-*` per [contracts/vegetable-culture-ui.md](contracts/vegetable-culture-ui.md)
- [X] T1364 [US5] Routes `src/app/(app)/plants/potager/page.tsx` and `potager/[id]/page.tsx` (depends on T1363)
- [X] T1365 [US5] Extend `plants-recap-query.ts` for milestones (depends on T1343, T1362)

---

## Phase 8: User Story 6 — Browse and last care at a glance (P2)

**Goal**: List **Dernier arrosage**, location filters, no guilt (US6, FR-013).

**Independent Test**: [quickstart.md](quickstart.md) § P2 — List glance.

- [X] T1370 [US6] List row subtitle **Dernier arrosage** in `src/components/plants/plant-list.tsx` (depends on T1330)
- [X] T1371 [US6] Location filter chips **`indoor`** / **`outdoor`** / **`both`** filter rules in `src/components/plants/plant-list-filters.tsx`
- [X] T1372 [US6] Copy review: no « en retard » strings in `plants.*` i18n (SC-005)

---

## Phase 9: Polish & cross-cutting

- [X] T1380 [P] Performance checklist: 20 plants / 200 events list scroll (SC-002) — unit fixture or manual note in `tests/unit/plants-garden/performance-fixture.test.ts`
- [X] T1381 Session: recap reflects new care after navigate to **Récap** without full reload when 011 wired (SC-004) — document handoff in test comment linking [011 T1192](../011-periodic-recap/tasks.md)
- [X] T1382 Extend sync integration for P2 entity arrays in `tests/integration/plants-garden-sync.test.ts`
- [X] T1383 Run `yarn verify:ci` and fix regressions
- [X] T1384 Document 011 integration: ensure [011 T1115](../011-periodic-recap/tasks.md) uses `PlantsRecapRepository` from T1343 (coordination comment in `plants-contributor.ts`)

---

## Dependencies & execution order

```text
Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3)
Phase 6–8 (P2) after P1 checkpoint
Phase 9 last
011 T1115 can start after T1343 (stub ok until T1317)
```

## Parallel opportunities

- T1301, T1302, T1303 in parallel (Phase 1)
- T1310, T1311 after T1309 — postgres vs idb adapters [P] if different authors
- T1352 seasonal UI parallel with T1363 potager UI after foundation extended

---

## Implementation strategy

### MVP (P1)

1. Phases 1–2 foundation
2. US1 → US2 → US3
3. Stop and validate [quickstart.md](quickstart.md) P1 + recap query tests
4. Coordinate [011 T1115](../011-periodic-recap/tasks.md) for **Plantes** lines + heatmap **`plants`**

### Incremental (P2)

Add US4 → US5 → US6 without breaking P1 flows.

---

## Task count

**Total tasks**: **44** (T1301–T1384)

| Phase | Tasks | IDs |
|-------|-------|-----|
| Setup | 3 | T1301–T1303 |
| Foundational | 15 | T1304–T1318 |
| US1 | 4 | T1320–T1323 |
| US2 | 4 | T1330–T1333 |
| US3 | 5 | T1340–T1344 |
| US4 | 5 | T1350–T1354 |
| US5 | 6 | T1360–T1365 |
| US6 | 3 | T1370–T1372 |
| Polish | 5 | T1380–T1384 |

**Per user story**: US1=4, US2=4, US3=5, US4=5, US5=6, US6=3

**Suggested MVP scope**: US1 + US2 + US3 (Phases 1–5) + T1343–T1344 for 011 handoff.

**Format validation**: All tasks use `- [ ]`, Task ID, optional `[P]`, story label on user-story phases, and file paths.
