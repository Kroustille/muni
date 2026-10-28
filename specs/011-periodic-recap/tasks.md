# Tasks: Periodic recap (011)

**Input**: `/specs/011-periodic-recap/`

**Prerequisites**: Features **001–007**; **008** fitness logs on `main`; **012** music-practice on `main` before Musique practice recap lines. Design docs: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md). Cross-ref: [012 tasks](../012-music-practice/tasks.md) T1284.

**Task IDs**: **T1101–T1194** (feature 011 band).

---

## Phase 1: Setup

- [x] T1101 [P] Add `recap.*` and `recap.nav` i18n keys in `src/i18n/fr.json` per [contracts/ui-routes.md](contracts/ui-routes.md)
- [x] T1102 [P] Scaffold `src/domain/recap.ts` types (`RecapPeriod`, `RecapAchievement`, `RecapActivityDay`, `RecapDomainId` order) per [data-model.md](data-model.md)
- [x] T1103 [P] Create `tests/unit/recap/` directory and shared fixtures helper for seeded items + workouts

---

## Phase 2: Foundational

**Purpose**: Recipe cook signal, period math, aggregation service — blocks all user stories.

- [x] T1104 Unit tests for `cookedDates` validation on recipe items in `tests/unit/recap/recipe-cooked-dates.test.ts`
- [x] T1105 Extend recipe item Zod/domain shape with `cookedDates` + sync field keys in `src/domain/item.ts` (depends on T1104)
- [x] T1106 Implement `recordRecipeCooked` in `src/application/recipes/record-cooked.ts` per [contracts/recipe-cooked-dates.md](contracts/recipe-cooked-dates.md) (depends on T1105)
- [x] T1107 Recipe detail UI: **Cuisiné** + backdate picker in recipe detail route/components (depends on T1106)
- [x] T1108 Unit tests ISO week/month/day/year bounds + prev/next in `tests/unit/recap/period.test.ts`
- [x] T1109 Implement `src/application/recap/period.ts` (depends on T1108)
- [x] T1110 Unit tests per domain contributor (books, movies/episodes, music tracks, **music practice 012**, recipes, fitness, **plants**) in `tests/unit/recap/*-contributor.test.ts`
- [x] T1111 Implement `src/application/recap/contributors/*.ts` + registry per [contracts/recap-aggregation-service.md](contracts/recap-aggregation-service.md) (depends on T1110, T1106, **012** repos for practice contributor)
- [x] T1115 [P] Unit tests + `plants-contributor.ts` for care events and vegetable milestones per [013](../013-plants-garden/research.md) (depends on T1110; may stub plant repo until 013 ships)
- [x] T1112 Unit tests snapshot grouping, sort, empty-section omission, soft-delete in `tests/unit/recap/build-recap-snapshot.test.ts`
- [x] T1113 Implement `buildRecapSnapshot`, `buildActivityDays` in `src/application/recap/build-recap-snapshot.ts` + `recap-activity-days.ts` (depends on T1111, T1112, T1109)
- [x] T1114 Unit tests heatmap window (365 days) and multi-domain `domainsPresent` in `tests/unit/recap/activity-days.test.ts` (depends on T1113)

**Checkpoint**: `buildRecapSnapshot` returns correct sections offline from fixtures; recipe cook persists locally.

---

## Phase 3: User Story 1 — Weekly recap (P1) — Phase A

**Goal**: Cross-domain weekly list grouped by domain (FR-004, FR-006, FR-016).

**Independent Test**: [quickstart.md](quickstart.md) § Phase A — Weekly recap.

- [x] T1120 [US1] Wire `RecapPage` data hook calling `buildRecapSnapshot` with default ISO week in `src/components/recap/recap-page.tsx`
- [x] T1121 [US1] `recap-domain-sections.tsx` — section headers with counts, lines newest-first (depends on T1120)
- [x] T1122 [US1] Neutral empty state component when `snapshot.empty` (depends on T1120)
- [x] T1123 [US1] Route `src/app/(app)/recap/page.tsx` shell (depends on T1121, T1122)
- [x] T1124 [US1] Unit/integration tests for weekly aggregation acceptance scenarios 1–10 in `tests/unit/recap/build-recap-snapshot.test.ts` (extend)

---

## Phase 4: User Story 2 — Monthly + period switcher (P1) — Phase A

**Goal**: Month granularity and prev/next navigation (FR-004).

**Independent Test**: [quickstart.md](quickstart.md) § Phase A — Monthly + navigation.

- [x] T1130 [US2] `recap-period-controls.tsx` — **Semaine**, **Mois**, **Aujourd’hui** (or **Hier** / day picker), **Cette année** + prev/next (depends on T1109)
- [x] T1131 [US2] Connect controls to snapshot rebuild on period change (depends on T1130, T1120)
- [x] T1132 [US2] E2e offline month switch `tests/e2e/recap.spec.ts` (depends on T1131)

---

## Phase 5: User Story 3 — Bottom nav + home teaser (P1) — Phase A

**Goal**: Primary `/recap` entry via bottom nav (FR-010).

**Independent Test**: [quickstart.md](quickstart.md) § Phase A — Navigation.

- [x] T1140 [US3] Add Récap to `nav-config` + `BottomNav` layout per [contracts/bottom-nav.md](contracts/bottom-nav.md)
- [x] T1141 [US3] Add Récap link to `SidebarNav` primary block (depends on T1140)
- [x] T1142 [US3] Optional `recap-home-teaser.tsx` on Accueil with link to `/recap` (depends on T1113)
- [x] T1143 [US3] E2e bottom-nav entry offline in `tests/e2e/recap.spec.ts` (depends on T1140, T1123)

---

## Phase 6: User Story 7 — Activity heatmap (P2) — Phase A

**Goal**: Multi-domain segment heatmap on all viewports (FR-019, FR-020).

**Independent Test**: [quickstart.md](quickstart.md) § Phase A — Activity heatmap.

- [x] T1150 [US7] Implement `recap-activity-heatmap.tsx` per [contracts/recap-activity-heatmap.md](contracts/recap-activity-heatmap.md)
- [x] T1151 [US7] Mount heatmap when snapshot loaded in `recap-page.tsx` (depends on T1150) — *2026-10-28: scope expanded from `md+` only to all viewports*
- [x] T1152 [US7] Unit tests segment rendering for 1 / 2 / 6 domains in `tests/unit/recap/heatmap-segments.test.ts`
- [x] T1153 [US7] E2e heatmap visible at desktop + narrow viewport in `tests/e2e/recap.spec.ts` (depends on T1151)
- [x] T1154 [US7] Week-column layout helper + unit tests; horizontal scroll wrapper on narrow (2026-10-28 mobile heatmap)

---

## Phase 7: User Story 6 — Extensibility (P3)

**Goal**: Registry hook; omit empty domains (FR-013).

**Independent Test**: [quickstart.md](quickstart.md) § Extensibility smoke.

- [x] T1160 [US6] Document contributor registration in `src/application/recap/contributors/index.ts` JSDoc + export type for future domains
- [x] T1161 [US6] Test: books-only fixture yields single section (depends on T1113)

---

## Phase 8: User Story 4 — Daily recap (P1) — MVP v1

**Goal**: Single-day period (FR-004, FR-005).

**Independent Test**: [quickstart.md](quickstart.md) § MVP v1 — daily.

- [x] T1170 [US4] Add **Aujourd’hui** / **Hier** (or day picker) to period controls (depends on T1130)
- [x] T1171 [US4] Unit tests daily bounds in `tests/unit/recap/period.test.ts`
- [x] T1172 [US4] E2e daily view filters one day only (depends on T1170)

---

## Phase 9: User Story 5 — Yearly recap (P1) — MVP v1

**Goal**: Calendar year in `/recap` only; standalone from 002/003 goals (FR-004, FR-005, FR-018).

**Independent Test**: [quickstart.md](quickstart.md) § MVP v1 — yearly.

- [x] T1180 [US5] Add **Cette année** granularity + year prev/next (depends on T1130)
- [x] T1181 [US5] Month labels on lines or subheaders for yearly volume (depends on T1121)
- [x] T1182 [US5] Assert no goal-progress components imported on recap route (lint or code review checklist)
- [x] T1183 [US5] E2e yearly spans Jan–Dec events in one year (depends on T1180)

---

## Phase 10: Polish & quality gate

- [x] T1190 [P] No-guilt copy review for all `recap.*` + home teaser strings (SC-003)
- [x] T1191 Performance fixture test or manual checklist for 50 events / month (SC-001)
- [x] T1192 Session refresh: home teaser count updates after mark-read without full reload (SC-005) — wire store subscription or revalidate on focus
- [x] T1193 Run `yarn verify:ci` and fix regressions
- [ ] T1194 Optional Phase B: fitness PR subsection under **Entraînement** (FR-015) — defer until post-v1 if needed
- [x] T1195 Unit tests **012** music-practice recap rules (`finishedAt`, `performedAt`, **one line per `practice_log`** incl. **improvisation**, multi-log same piece, status-without-log excluded, soft-delete) in `tests/unit/recap/music-practice-contributor.test.ts` (depends on **012** T1216)
- [x] T1196 Implement `music-practice-contributor.ts` + extend Musique section i18n line templates (**séance de pratique**, **improvisation**) (depends on T1195, T1111)

---

## Dependencies & execution order

```text
Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) + Phase 8–9 (US4–US5) [period UI; can follow T1130 scaffold]
Phase 5 (US3) + Phase 6 (US7) [parallel after US1 route]
Phase 7 (US6) anytime after Phase 2
Phase 10 last
```

## Parallel opportunities

- T1101, T1102, T1103 in parallel (Phase 1)
- T1140–T1143 (nav) parallel with T1150–T1153 (heatmap) once T1123 exists
- Contributor unit tests T1110 can split by file per contributor [P]

---

## Task count

**Total tasks**: **47** (T1101–T1196, T1115)
