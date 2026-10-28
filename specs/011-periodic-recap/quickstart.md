# Quickstart: Periodic recap (011)

**Prerequisites**: Muni **001–007** on `main`; **008** fitness implemented locally (completed workouts in IndexedDB). Run `yarn db:up` before `yarn verify:ci` when testing full gate.

Design refs: [plan.md](plan.md), [data-model.md](data-model.md), [contracts/](contracts/).

## Phase A — Recipe cooked signal (prerequisite)

1. Open a recipe detail → tap **Cuisiné** → today’s date appended to `cookedDates`.
2. **Choisir une date** → pick a day in the **previous ISO week** → save offline → reload → date persists.
3. Tap **Cuisiné** again same day → no duplicate entry (dedupe).

## Phase A — Weekly recap (US1)

1. Seed (or use UI): one book → **Lu**, one film → **Vu**, one track → **Écouté**, one recipe cook this week, one **completed** workout this week.
2. Go **offline** → bottom nav **Récap** → `/recap` loads with **Semaine** default.
3. Verify sections **Livres**, **Films & séries**, **Musique**, **Recettes**, **Entraînement** with counts; lines show title + weekday.
4. Mark a série episode watched this week → **one line per episode** (series title + episode key).
5. Clear all events → neutral empty state (no guilt copy).

## Phase A — Monthly + navigation (US2)

1. Switch to **Mois** → events only in current calendar month.
2. **Période précédente** → label updates; content matches prior month only.
3. Offline period change still works.

## Phase A — Navigation (US3)

1. From `/search`, tap bottom **Récap** → weekly recap (no Accueil visit required).
2. Optional: home teaser shows count → opens `/recap`.

## Phase A — Desktop heatmap (US7)

1. Set viewport **≥ 768px** → grid visible at top (`data-testid="recap-activity-heatmap"`).
2. Seed book finish + workout same day → cell shows **two vertical segments** (book + fitness colors).
3. Film only another day → single-segment cell.
4. Resize **< 768px** → heatmap absent; list unchanged.
5. Legend shows French domain labels; focus/hover cell → domain names in tooltip/a11y.

## Phase A — Daily and yearly (US4–US5, MVP v1)

1. **Aujourd’hui** / **Hier** (or day picker) → only that day’s lines.
2. **Cette année** → January and December events both listed with month indication; **no** book/movie goal UI embedded.
3. Copy review: no quota / failed-goal language on yearly view.

## Extensibility smoke (US6)

1. Seed **books only** → recap shows **Livres** section only (no empty **Entraînement** block).

## Performance smoke (SC-001)

1. Fixture or dev seed ~50 achievements in one month → scrollable content within **2s** offline on mid-tier device (manual or perf budget test).

## Quality gate

- `yarn typecheck`
- `tests/unit/recap/**/*.test.ts`
- `tests/e2e/recap.spec.ts` (weekly offline + day/year period switch + desktop heatmap path)
- No-guilt string checklist for `recap.*` and home teaser keys (SC-003)
- `yarn verify:ci` before push to `main`
