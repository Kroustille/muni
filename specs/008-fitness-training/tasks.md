# Tasks: Fitness — weekly training, logging, progression (008)

**Input**: `/specs/008-fitness-training/`

**Prerequisites**: Features **001–007**. Design docs: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

**Task IDs**: **T801–T878** (feature 008 band).

---

## Phase 1: Setup

- [x] T801 [P] Add `validate-catalog` script to `package.json` invoking `node specs/008-fitness-training/validate-catalog.mjs`
- [x] T802 [P] Copy catalog seed to `public/fitness/exercises.catalog.json` and `public/fitness/muscles.catalog.json` (build step or checked-in copy per plan OD-008-4)
- [x] T803 [P] i18n keys for fitness nav, home, program, workout, history, progression, settings in `src/i18n/fr.json`

---

## Phase 2: Foundational

**Purpose**: Domain, persistence, catalog, sync — blocks all user stories.

- [x] T804 Unit tests for fitness domain types (program, workout log, set validation, RPE) in `tests/unit/fitness/domain.test.ts`
- [x] T805 Implement `src/domain/fitness/program.ts`, `workout-log.ts`, `catalog.ts` per [data-model.md](data-model.md) (depends on T804)
- [x] T806 Unit tests for PR derivation and week adherence helpers in `tests/unit/fitness/progression.test.ts`
- [x] T807 Implement `src/domain/fitness/progression.ts`, `adherence.ts` (depends on T806)
- [x] T808 Migration `db/migrations/0014_fitness_tables.ts` + register in `db/migrations/index.ts` per data-model
- [x] T809 [P] Ports `src/application/ports/fitness-program-repository.ts`, `fitness-workout-repository.ts`, `fitness-skip-repository.ts`, `fitness-settings-repository.ts`
- [x] T810 Postgres adapters in `src/adapters/postgres/fitness-*-repository.ts` with isolation scoping
- [x] T811 IndexedDB adapters in `src/adapters/indexeddb/fitness-*-repository.ts`
- [x] T812 Integration tests fitness sync push/pull in `tests/integration/fitness-sync.test.ts`
- [x] T813 Implement `src/app/api/sync/fitness/push/route.ts` and `pull/route.ts` per [contracts/fitness-sync-api.md](contracts/fitness-sync-api.md)
- [x] T814 Register fitness entities in sync engine (`src/composition/sync-run.ts` or equivalent)
- [x] T815 Implement `src/application/fitness/seed-exercise-catalog.ts` + IndexedDB store per [contracts/exercise-catalog.md](contracts/exercise-catalog.md)
- [x] T816 [P] Primary nav entry + shell route stub `src/app/(app)/fitness/page.tsx` per [contracts/ui-routes.md](contracts/ui-routes.md)

**Checkpoint**: Catalog validates; migrations apply; empty fitness home renders offline.

---

## Phase 3: User Story 1 — Weekly training plan (P1) — Phase A

**Goal**: One active program; sessions on weekdays; catalog planned exercises (FR-010–FR-013).

**Independent Test**: [quickstart.md](quickstart.md) § Phase A steps 1–2.

- [x] T820 [US1] Unit tests program use cases in `tests/unit/fitness/program-use-cases.test.ts`
- [x] T821 [US1] `createProgram`, `updateProgram`, `getActiveProgram` in `src/application/fitness/program.ts`
- [x] T822 [US1] Program editor UI `src/app/(app)/fitness/program/page.tsx` + `src/components/fitness/program-editor.tsx` per [contracts/program-editor.md](contracts/program-editor.md)
- [x] T823 [US1] Catalog picker component `src/components/fitness/exercise-picker.tsx` (search FR/EN, filters)
- [x] T824 [US1] E2e program create offline `tests/e2e/fitness-program.spec.ts`

---

## Phase 4: User Story 2 — Today & complete/skip (P1) — Phase A

**Goal**: Fitness home; start, skip, séance libre (FR-020–FR-023).

**Independent Test**: [quickstart.md](quickstart.md) § Phase A steps 3–6.

- [x] T830 [US2] Unit tests today/session resolution in `tests/unit/fitness/today.test.ts`
- [x] T831 [US2] `startWorkoutFromPlan`, `startFreeWorkout`, `completeWorkout`, `skipPlannedSession` in `src/application/fitness/workout.ts`
- [x] T832 [US2] Enforce single in-progress workout in application layer (research §6)
- [x] T833 [US2] Fitness home `src/app/(app)/fitness/page.tsx` + `src/components/fitness/fitness-home.tsx`
- [x] T834 [US2] Workout route shell `src/app/(app)/fitness/workout/[id]/page.tsx`
- [x] T835 [US2] E2e today start/terminé/skip `tests/e2e/fitness-today.spec.ts`

---

## Phase 5: User Story 3 — Set logging precision (P1) — Phase B

**Goal**: Sets with reps, charge, duration, RPE (FR-024–FR-025).

**Independent Test**: [quickstart.md](quickstart.md) § Phase B steps 1–3.

- [x] T840 [US3] Unit tests set mutations on `loggedExercises` jsonb in `tests/unit/fitness/workout-sets.test.ts`
- [x] T841 [US3] `updateLoggedExercises`, charge unit conversion using settings in `src/application/fitness/workout.ts`
- [x] T842 [US3] Workout log UI `src/components/fitness/workout-log-editor.tsx` per [contracts/workout-log-ui.md](contracts/workout-log-ui.md)
- [x] T843 [US3] E2e offline five-exercise log `tests/e2e/fitness-logging.spec.ts`

---

## Phase 6: User Story 4 — Picker & duplicate (P2) — Phase B

**Goal**: Recent exercises; duplicate template (FR-026).

**Independent Test**: [quickstart.md](quickstart.md) § Phase B steps 4–5.

- [x] T850 [US4] `recentlyUsedExerciseIds` client helper in `src/application/fitness/recent-exercises.ts`
- [x] T851 [US4] Wire recent section in `exercise-picker.tsx`
- [x] T852 [US4] `duplicateWorkoutAsTemplate` use case + history action UI
- [x] T853 [US4] E2e duplicate flow `tests/e2e/fitness-duplicate.spec.ts`

---

## Phase 7: User Story 5 — History & progression (P1) — Phase C

**Goal**: History list; per-exercise progression and PRs (FR-030–FR-032).

**Independent Test**: [quickstart.md](quickstart.md) § Phase C steps 1–2.

- [x] T860 [US5] History page `src/app/(app)/fitness/history/page.tsx` + in-fitness search
- [x] T861 [US5] Progression page `src/app/(app)/fitness/exercises/[exerciseId]/progression/page.tsx` per [contracts/progression.md](contracts/progression.md)
- [x] T862 [US5] PR badge on workout save in workout UI
- [x] T863 [US5] E2e progression PR `tests/e2e/fitness-progression.spec.ts`

---

## Phase 8: User Story 6 — Week adherence strip (P2) — Phase C

**Goal**: Week planned vs done vs skipped (FR implicit US6).

**Independent Test**: [quickstart.md](quickstart.md) § Phase C step 3.

- [x] T870 [US6] `WeekAdherenceView` component `src/components/fitness/week-strip.tsx`
- [x] T871 [US6] Integrate week strip on fitness home

---

## Phase 9: User Stories 7–8 — Companion (P3) — Phase D

**Goal**: Recovery check-in, streak, home card (FR-040–FR-042). **Ship after Phase C checkpoint.**

**Independent Test**: [quickstart.md](quickstart.md) § Phase D.

- [x] T875 [US7] Recovery fields on workout detail + optional post-terminé sheet
- [x] T876 [US8] Settings adherence toggle + streak calculation in `src/application/fitness/adherence-streak.ts`
- [x] T877 [US8] Home fitness card `src/components/fitness/home-fitness-card.tsx` on `src/app/(app)/page.tsx`
- [x] T878 [US7] E2e recovery + streak `tests/e2e/fitness-companion.spec.ts`

---

## Phase 10: Polish

- [x] T879 Cross-account isolation test for fitness tables in `tests/integration/fitness-isolation.test.ts` (SC-005)
- [x] T880 Run [quickstart.md](quickstart.md) quality gate; document any env needs in plan if e2e skipped

---

## Phase 11: Session picker, library delete, modality set UX (2026-10-28 spec)

- [ ] T881 [US2] Session picker on `fitness-home.tsx` — list or select + **Démarrer** any template (FR-020)
- [ ] T882 [US2] E2e start from picker without planifiée row in `tests/e2e/fitness-today.spec.ts`
- [ ] T883 [US1] Per-row **Supprimer** on `/fitness/sessions` with undo toast via `UndoDeleteProvider` (FR-050, session-library contract)
- [ ] T884 [US1] E2e delete template + undo in `tests/e2e/fitness-sessions.spec.ts`
- [ ] T885 [US3] `workout-log-editor.tsx` modality-aware set columns per FR-024a + unit tests in `tests/unit/fitness/set-input-layout.test.ts`
- [ ] T886 [US3] E2e log strength exercise shows reps/charge; cardio shows duration-first in `tests/e2e/fitness-logging.spec.ts`

---

## Dependency graph (summary)

```text
Setup (T801–T803) → Foundational (T804–T816) → US1 (T820–T824) → US2 (T830–T835)
  → US3 (T840–T843) → US4 (T850–T853) → US5 (T860–T863) → US6 (T870–T871)
  → US7–US8 (T875–T878) → Polish (T879–T880)
```
