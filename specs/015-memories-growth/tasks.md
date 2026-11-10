# Tasks: Souvenirs & progression (015)

**Input**: `/specs/015-memories-growth/`

**Prerequisites**: 001 foundation and 011 récap contributors on `main`. Design docs: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

**Task IDs**: **T1501–T1599** (feature 015 band). `[P]` = parallelizable (different files, no dependency). `[USn]` = user story.

**E2E rules** (learned 2026-11-10): wait for the write to land before navigating (sheet closed / « Modifications enregistrées »); never change routes while offline; `test.use({ serviceWorkers: "block" })` only in specs that mock `/api`.

---

## Phase 1: Setup

- [ ] T1501 [P] (foundation keys added 2026-11-11; story keys land with each phase) Add `memories.*` and `progression.*` i18n keys (nav, tabs, forms, empty states, celebration, Ce jour-là, Moments forts, goal result lines) in `src/i18n/fr.json` per [contracts/ui-routes.md](contracts/ui-routes.md)
- [x] T1502 [P] Unit test tone deny-list over `memories.*`/`progression.*` keys (`retard`, `échec`, `raté`, `perdu`, `série perdue`, `classement`) in `tests/unit/memories-growth/tone.test.ts` (research R13)
- [x] T1503 [P] Create `tests/unit/memories-growth/` fixture builders (souvenir, goal, check-in, achievement, récap achievement)

---

## Phase 2: Foundational (blocks all stories)

- [x] T1504 [P] Unit tests UUIDv5 against RFC 4122 vectors in `tests/unit/memories-growth/deterministic-uuid.test.ts`
- [x] T1505 Implement `src/domain/deterministic-uuid.ts` (WebCrypto SHA-1) (depends on T1504)
- [x] T1506 [P] Unit tests souvenir validation (title 1–200, `occurredOn` ≤ today, links ≤ 10 and kinds, body/place limits) in `tests/unit/memories-growth/souvenir-domain.test.ts`
- [x] T1507 [P] Unit tests goal validation + period presets (week/month/quarter/year/custom → start/end, span ≤ 3 y, metric/target consistency) in `tests/unit/memories-growth/goal-domain.test.ts`
- [x] T1508 [P] Unit tests achievement validation (auto ⇒ ruleId+threshold) in `tests/unit/memories-growth/achievement-domain.test.ts`
- [x] T1509 Implement `src/domain/souvenir.ts`, `src/domain/goal.ts`, `src/domain/achievement.ts` (zod schemas + types) (depends on T1506–T1508)
- [x] T1510 Migration `db/migrations/0021_memories_growth_tables.ts` (four tables per [data-model.md](data-model.md)) + register in `db/migrations/index.ts`; regenerate `src/adapters/postgres/db-types.ts` with `yarn db:codegen`
- [x] T1511 [P] Ports `src/application/ports/memories-growth-repositories.ts` (souvenir, goal, check-in, achievement; `list`, `get`, `upsert`, `pullSince`, `subscribe`)
- [x] T1512 Postgres adapters `src/adapters/postgres/memories-growth-repositories.ts` (user scoping, pullSince, LWW merge via `src/domain/merge.ts`)
- [x] T1513 IndexedDB adapters `src/adapters/indexeddb/memories-growth-repositories.ts` + version bump in `src/adapters/indexeddb/db.ts` (4 synced stores + 3 local-only stores + outbox tags)
- [x] T1514 Integration tests in `tests/integration/memories-growth-sync.test.ts`: round trip per entity, two-user isolation, `goal_checkin.goal_id` ownership, tombstone wins, **same deterministic achievement id pushed twice → one row**
- [x] T1515 Server sync service `src/application/server/memories-growth-sync-service.ts` + routes `src/app/api/sync/memories-growth/push/route.ts` (session + same-origin) and `pull/route.ts` (session only, **no Origin check on GET**) per [contracts/memories-growth-sync-api.md](contracts/memories-growth-sync-api.md) (depends on T1514)
- [x] T1516 Client engine `src/application/sync/memories-growth-sync-engine.ts`, remote store `src/adapters/http/memories-growth-remote-store.ts`, wiring `src/composition/client-memories-growth-sync.ts` and registration in the `runSync` engine list in `src/composition/client.ts`
- [x] T1517 Server container wiring in `src/app/api/_lib/server-container.ts`
- [x] T1518 [P] Add **Souvenirs** (`/souvenirs`, `BookHeart`) and **Progression** (`/progression`, `Sprout`) to `FEATURE_NAV` in `src/components/nav-config.ts`; hub shells with path tabs (`/souvenirs`, `/souvenirs/liste`, `/progression`, `/progression/realisations`) and empty states

**Checkpoint**: migration applies, sync integration tests green, both hubs reachable with empty states.

---

## Phase 3: User Story 1 — Capture a souvenir (P1) 🎯 MVP

**Goal**: FR-001–FR-006. **Independent test**: [quickstart.md](quickstart.md) § US1.

- [ ] T1520 [P] [US1] Unit tests souvenir use cases (create default today, backdate, edit, soft delete + restore, link add/remove, search by title/place) in `tests/unit/memories-growth/souvenir-use-cases.test.ts`
- [ ] T1521 [US1] Implement `src/application/memories-growth/souvenir-use-cases.ts` and wire into `src/composition/client.ts` with `onLocalWrite` (depends on T1520)
- [ ] T1522 [US1] Quick-add: add **Souvenir** option to the picker and a title + date form in `src/components/quick-add/quick-add-context.tsx`; preset Souvenir on `/souvenirs` (extend `item-type-from-path.ts` mapping or a sibling helper) per research R11
- [ ] T1523 [US1] Souvenirs tab list (newest first, favourite filter) `src/components/memories/souvenir-list.tsx`
- [ ] T1524 [US1] Souvenir detail/edit `src/app/(app)/souvenirs/[id]/page.tsx` + `src/components/memories/souvenir-form.tsx` (title, date, body, mood, place, favourite, save status `souvenir-save-status`, delete + undo)
- [ ] T1525 [US1] Link picker sheet over local items (no shopping), workouts, plants `src/components/memories/souvenir-link-picker.tsx`; dangling link renders « élément supprimé »
- [ ] T1526 [US1] « Souvenirs liés » section + « Créer un souvenir » action on item detail (`src/components/items/ItemDetailForm.tsx`), workout detail and plant detail — `src/components/memories/linked-souvenirs-section.tsx`
- [ ] T1527 [US1] Global search includes souvenirs (title, place) in `src/app/(app)/search/page.tsx` search use case
- [ ] T1528 [US1] E2E `tests/e2e/memories-souvenirs.spec.ts`: quick-add title only → listed; backdate; link a book → « Souvenirs liés » on book; whitespace title rejected; offline add (no route change while offline); second device sees it

**Checkpoint**: US1 independently demoable.

---

## Phase 4: User Story 2 — Fil de vie (P1)

**Goal**: FR-007–FR-010. **Independent test**: quickstart § US2.

- [ ] T1530 [P] [US2] Unit tests `DomainEventsQuery` delegates to all 011 contributors with range + domain filter in `tests/unit/memories-growth/domain-events.test.ts`
- [ ] T1531 [US2] Implement `src/application/memories-growth/domain-events.ts` (port impl over `src/application/recap/contributors`) (depends on T1530)
- [ ] T1532 [P] [US2] Unit tests timeline month projection: grouping by day, intra-day ordering, filters, deleted/un-completed items disappear, `hasEarlier` in `tests/unit/memories-growth/timeline.test.ts`
- [ ] T1533 [US2] Implement `src/application/memories-growth/timeline.ts` per [contracts/timeline-and-progress.md](contracts/timeline-and-progress.md) (depends on T1531, T1532)
- [ ] T1534 [US2] Fil de vie UI `src/components/memories/timeline-view.tsx`: month sections, infinite scroll to earlier months, domain colour chip per entry (reuse récap legend colours), entry → source link
- [ ] T1535 [US2] Domain filter (remembered in `timeline_filter`) and month/year jump (`/souvenirs?month=YYYY-MM`) `src/components/memories/timeline-filters.tsx`
- [ ] T1536 [US2] E2E `tests/e2e/memories-timeline.spec.ts`: souvenir + finished book on different days in order; filter to Souvenirs only; un-mark book read → entry disappears

---

## Phase 5: User Story 3 — Objectifs (P1)

**Goal**: FR-013–FR-018. **Independent test**: quickstart § US3.

- [ ] T1540 [P] [US3] Unit tests goal progress for each `targetKind`/metric, period clamping, `completedOn` = N-th event day, `movies` counts episodes like récap in `tests/unit/memories-growth/goal-progress.test.ts`
- [ ] T1541 [US3] Implement `src/application/memories-growth/goal-progress.ts` and `goal-use-cases.ts` (create, edit period, archive/reactivate, delete, check-ins, reflection) (depends on T1531, T1540)
- [ ] T1542 [P] [US3] Unit tests virtual goals from `ReadingGoal`/`WatchGoal` in `tests/unit/memories-growth/virtual-goals.test.ts`
- [ ] T1543 [US3] Implement `src/application/memories-growth/virtual-goals.ts` (depends on T1542)
- [ ] T1544 [US3] Objectifs tab `src/components/progression/goal-list.tsx` (active, completed this period, archived collapsed; virtual goals with « Objectif annuel » badge linking to the existing goal screens)
- [ ] T1545 [US3] New goal form `src/app/(app)/progression/objectifs/nouveau/page.tsx` + `src/components/progression/goal-form.tsx`
- [ ] T1546 [US3] Goal detail `src/app/(app)/progression/objectifs/[id]/page.tsx`: neutral progress bar, counted events list, « + Check-in », end-of-period reflection prompt, archive/delete
- [ ] T1547 [US3] E2E `tests/e2e/progression-goals.spec.ts`: « Lire 3 livres ce mois-ci » → mark 1 book read → 1/3 without input; manual goal with 2 check-ins; existing reading goal appears; archived goal leaves active list

**P1 checkpoint**: US1–US3 demoable; full CI green; update [quickstart.md](quickstart.md) if flows changed.

---

## Phase 6: User Story 4 — Ce jour-là (P2)

**Goal**: FR-011–FR-012. **Independent test**: quickstart § US4.

- [ ] T1550 [P] [US4] Unit tests `listOnThisDay` (prior years only, max 3, year desc, favourites first, 29 Feb → 28 Feb in non-leap years) in `tests/unit/memories-growth/on-this-day.test.ts`
- [ ] T1551 [US4] Implement `src/application/memories-growth/on-this-day.ts` + local stores access (depends on T1550)
- [ ] T1552 [US4] Accueil card `src/components/memories/on-this-day-card.tsx` (`data-testid="on-this-day-card"`) above suggestions; « Masquer pour aujourd'hui »
- [ ] T1553 [US4] Settings toggle « Afficher Ce jour-là » in `src/app/(app)/settings/page.tsx` (`memories_prefs`)
- [ ] T1554 [US4] E2E `tests/e2e/memories-on-this-day.spec.ts`: souvenir backdated one year → card shows « Il y a 1 an » → dismiss stays hidden after reload → toggle off hides it

---

## Phase 7: User Story 5 — Réalisations (P2)

**Goal**: FR-019–FR-023. **Independent test**: quickstart § US5.

- [ ] T1560 [P] [US5] Unit tests rules + evaluator: thresholds crossed → exactly one row each; `earnedOn` = N-th event day; rerun idempotent; soft-deleted auto row not recreated; un-marking items never revokes; backfill flags (no celebration if > 7 days) in `tests/unit/memories-growth/evaluate-achievements.test.ts`
- [ ] T1561 [US5] Implement `src/application/memories-growth/achievement-rules.ts` (v1 table, research R7) and `evaluate-achievements.ts` (depends on T1505, T1531, T1560)
- [ ] T1562 [US5] Trigger evaluator on app start, debounced after local writes, and after sync pull in `src/composition/client.ts`
- [ ] T1563 [US5] Réalisations tab + detail `src/components/progression/achievement-list.tsx`, `src/app/(app)/progression/realisations/[id]/page.tsx`; manual achievement form (title, date, text, links)
- [ ] T1564 [US5] Celebration toast `src/components/progression/celebration-toast.tsx` (queue, one at a time, sets `celebratedAt`)
- [ ] T1565 [US5] Add `achievement` and `goal_completed` entries to Fil de vie (extend T1533 sources)
- [ ] T1566 [US5] E2E `tests/e2e/progression-achievements.spec.ts`: first book read → « Premier livre lu » appears once with celebration; reload → no second celebration; manual réalisation appears in Fil de vie

---

## Phase 8: User Story 6 — Moments forts in Récap (P3)

**Goal**: FR-024. **Independent test**: quickstart § US6.

- [ ] T1570 [P] [US6] Unit tests highlights query (month/year only, favourites first, cap 10, empty → undefined) in `tests/unit/memories-growth/highlights.test.ts`
- [ ] T1571 [US6] Implement `src/application/memories-growth/highlights.ts` and inject `MemoriesHighlightsQuery` into `buildRecapSnapshot` deps (`src/application/recap/build-recap-snapshot.ts`, `src/composition/client-recap.ts`) (depends on T1570)
- [ ] T1572 [US6] « Moments forts » section in récap UI `src/components/recap/` with link to `/souvenirs?month=YYYY-MM`
- [ ] T1573 [US6] E2E: favourite souvenir this month → month récap shows it under Moments forts; day view has no section (extend `tests/e2e/recap.spec.ts`)

---

## Phase 9: Polish & cross-cutting

- [ ] T1580 [P] Accueil row « Souvenirs · Progression » links (mobile entry point, research R10) in `src/app/(app)/page.tsx`
- [ ] T1581 [P] Accessibility pass: labelled form controls, `role="status"` save messages, tab semantics on hubs, colour-independent domain chips
- [ ] T1582 Performance check SC-002: seed 5 years of fixtures, assert current-month timeline projection < 1 s in a unit benchmark `tests/unit/memories-growth/timeline-perf.test.ts`
- [ ] T1583 Mark spec Status « Implemented », tick tasks, update [009](../009-experiences-achievements/spec.md) cross-reference
- [ ] T1584 Run `yarn verify:ci` locally (lint, typecheck, unit, codegen check) and confirm full CI (incl. e2e) green on `main`

---

## Dependencies & order

- Phase 2 blocks everything. T1531 (`DomainEventsQuery`) is shared by US2, US3, US5.
- US1 → US2 (timeline shows souvenirs) but US2 domain lines work without US1.
- US3 independent of US2 except T1531. US5 needs T1505 + T1531 (and goal progress for `goals_completed`). US6 needs US1 + US5 data (renders whatever exists).
- Parallel opportunities: all `[P]` unit-test tasks in a phase; T1518 alongside T1510–T1517; US3 (Phase 5) can run in parallel with US2 (Phase 4) after T1531.

## MVP

Phases 1–5 (US1–US3) = « garder mes bons moments et progresser à mon rythme ». Ship, collect feedback, then P2/P3.
