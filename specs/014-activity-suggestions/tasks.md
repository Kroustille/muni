# Tasks: Activity suggestions (014)

**Input**: `/specs/014-activity-suggestions/`

**Prerequisites**: Feature **001** on `main`. Design docs: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md). Domain data from **002–004**, **008**, **010** optional, **012**, **013** as available; recipe **`cookedDates`** from **011** prerequisite.

**Task IDs**: **T1401–T1448** (feature 014 band).

---

## Phase 1: Setup

- [x] T1401 [P] Add `suggestions.*` i18n keys (title, intro, partial/empty, domain labels, actions, recap teaser, guilt-safe templates) in `src/i18n/fr.json` per [contracts/accueil-suggestions-ui.md](contracts/accueil-suggestions-ui.md)
- [x] T1402 [P] Scaffold `src/domain/activity-suggestion.ts` types per [data-model.md](data-model.md)
- [x] T1403 [P] Create `tests/unit/suggestions/` directory with date/TZ fixtures (`Europe/Paris`)

---

## Phase 2: Foundational

**Purpose**: Local store, selection algorithm, orchestrator — blocks all user stories.

- [x] T1404 Unit tests selection algorithm (sort, diversity within 7 days, fitness pool cap) in `tests/unit/suggestions/selection-algorithm.test.ts`
- [x] T1405 Unit tests snapshot idempotency same calendar day in `tests/unit/suggestions/snapshot-idempotency.test.ts`
- [x] T1406 Unit tests dismiss no backfill (FR-012) in `tests/unit/suggestions/dismiss-no-backfill.test.ts`
- [x] T1407 Unit tests guilt lexicon on `suggestions.*` strings (SC-003) in `tests/unit/suggestions/guilt-lexicon.test.ts`
- [x] T1408 Implement `ActivitySuggestionStore` port in `src/application/ports/activity-suggestion-store.ts`
- [x] T1409 IndexedDB adapter + store version bump in `src/adapters/indexeddb/activity-suggestion-store.ts` per [contracts/suggestions-local-store.md](contracts/suggestions-local-store.md)
- [x] T1410 Unit tests store get/put/dismiss in `tests/unit/suggestions/activity-suggestion-store.test.ts` (depends on T1409)
- [x] T1411 Implement pure selection helpers in `src/application/suggestions/select-pair.ts` (depends on T1404)
- [x] T1412 Implement `buildDailySuggestions` + `getSuggestionsViewModel` in `src/application/suggestions/build-daily-suggestions.ts` per [contracts/suggestions-selection-service.md](contracts/suggestions-selection-service.md) (depends on T1411, T1408)
- [x] T1413 Register `SuggestionsDeps` wiring in `src/composition/client.ts` (depends on T1412)
- [x] T1414 [P] Scaffold `src/application/suggestions/contributors/index.ts` registry per [contracts/domain-stale-contributors.md](contracts/domain-stale-contributors.md)

**Checkpoint**: Algorithm + store tests green without UI.

---

## Phase 3: Domain contributors

**Purpose**: Stale candidate enumeration per domain (FR-013 graceful degradation).

- [x] T1415 Unit tests books stale rules in `tests/unit/suggestions/books-stale-contributor.test.ts`
- [x] T1416 Implement `books-stale-contributor.ts` (depends on T1415)
- [x] T1417 Unit tests movies stale rules in `tests/unit/suggestions/movies-stale-contributor.test.ts`
- [x] T1418 Implement `movies-stale-contributor.ts` (depends on T1417)
- [x] T1419 Unit tests music tracks stale rules in `tests/unit/suggestions/music-tracks-stale-contributor.test.ts`
- [x] T1420 Implement `music-tracks-stale-contributor.ts` (depends on T1419)
- [x] T1421 Unit tests recipes stale + `cookedDates` in `tests/unit/suggestions/recipes-stale-contributor.test.ts`
- [x] T1422 Implement `recipes-stale-contributor.ts` (depends on T1421)
- [x] T1423 Unit tests fitness gap + skip (no streak reads) in `tests/unit/suggestions/fitness-stale-contributor.test.ts`
- [x] T1424 Implement `fitness-stale-contributor.ts` (depends on T1423, **008** repos)
- [x] T1425 Unit tests music practice 012 rules in `tests/unit/suggestions/music-practice-stale-contributor.test.ts`
- [x] T1426 Implement `music-practice-stale-contributor.ts` (depends on T1425, **012** repos)
- [x] T1427 Unit tests plants water gap in `tests/unit/suggestions/plants-stale-contributor.test.ts`
- [x] T1428 Implement `plants-stale-contributor.ts` (depends on T1427, **013** repos)
- [x] T1429 Wire all contributors into registry + integration test merged pool in `tests/unit/suggestions/build-daily-suggestions.test.ts` (depends on T1416–T1428, T1412)

**Checkpoint**: End-to-end compute from seeded fixtures returns expected pair.

---

## Phase 4: User Story 1 — Two gentle ideas on Accueil (P1)

**Goal**: Daily snapshot on first Accueil visit; 0/1/2 display states (FR-002, FR-010).

**Independent Test**: [quickstart.md](quickstart.md) § P1 — Two ideas.

- [x] T1430 [US1] Component `src/components/home/activity-suggestions-card.tsx` per [contracts/accueil-suggestions-ui.md](contracts/accueil-suggestions-ui.md)
- [x] T1431 [US1] Hook `useDailySuggestions` calling `buildDailySuggestions` on first Accueil mount in `src/components/home/use-daily-suggestions.ts` (depends on T1430, T1413)
- [x] T1432 [US1] Mount card on `src/app/(app)/page.tsx` with `id="activity-suggestions"` (depends on T1431)
- [x] T1433 [US1] E2e two suggestions + same-day stability offline in `tests/e2e/activity-suggestions.spec.ts` (depends on T1432)

---

## Phase 5: User Story 2 — Dismiss without shame (P1)

**Goal**: Per-row and block dismiss; no backfill (FR-006, FR-007, FR-012).

**Independent Test**: [quickstart.md](quickstart.md) § P1 — Dismiss.

- [x] T1434 [US2] Wire **Pas maintenant** → `dismissSlot` in `activity-suggestions-card.tsx` (depends on T1430, T1409)
- [x] T1435 [US2] Wire header **×** → `dismissBlock` (depends on T1434)
- [x] T1436 [US2] Extend e2e dismiss + next-day refresh in `tests/e2e/activity-suggestions.spec.ts` (depends on T1435)

---

## Phase 6: User Story 3 — Domain diversity and deep link (P1)

**Goal**: Cross-domain pair when possible; primary navigation (FR-008, FR-014).

**Independent Test**: [quickstart.md](quickstart.md) § P1 — Domain diversity.

- [x] T1437 [US3] Implement `deepLink` builders in `src/application/suggestions/deep-links.ts` per [contracts/suggestion-deep-links.md](contracts/suggestion-deep-links.md)
- [x] T1438 [US3] Unit tests deep link paths per domain in `tests/unit/suggestions/deep-links.test.ts` (depends on T1437)
- [x] T1439 [US3] Primary action navigation from card using `deepLink` (depends on T1437, T1434)
- [x] T1440 [US3] E2e diversity seed + tap-through in `tests/e2e/activity-suggestions.spec.ts` (depends on T1439)

---

## Phase 7: User Story 4 — Récap entry teaser (P2)

**Goal**: Optional forward link on `/recap` (FR-011 contrast).

**Independent Test**: [quickstart.md](quickstart.md) § P2 — Récap teaser.

- [x] T1441 [US4] Component `src/components/recap/suggestions-teaser.tsx` per [contracts/recap-suggestions-teaser.md](contracts/recap-suggestions-teaser.md)
- [x] T1442 [US4] Mount teaser on recap page/layout above period switcher when **011** route exists (depends on T1441, T1431) — **deferred**: `/recap` not on `main`; teaser component ready at `src/components/recap/suggestions-teaser.tsx`
- [x] T1443 [US4] E2e teaser visible after Accueil compute in `tests/e2e/activity-suggestions.spec.ts` (depends on T1442) — **deferred** with T1442 (no `/recap` route)

---

## Phase 8: Polish & cross-cutting

- [x] T1444 [P] Document contributor registration in `src/application/suggestions/contributors/index.ts` JSDoc
- [x] T1445 Verify shopping never appears in pool (FR-004) in `tests/unit/suggestions/build-daily-suggestions.test.ts`
- [x] T1446 Verify recap snapshot contains no suggestion rows (FR-011) — contract test stub when recap ships
- [x] T1447 Run full [quickstart.md](quickstart.md) script; fix gaps
- [x] T1448 Update spec checklist / mark plan artifacts complete in `specs/014-activity-suggestions/checklists/requirements.md` if needed

---

## Dependencies & execution order

- **Phase 1–3** before Accueil UI (US1).
- **US2** depends on US1 card shell.
- **US3** can parallel deep links after T1412.
- **US4** depends on **011** `/recap` route existing; may ship after US1 with feature flag if recap not merged.
- **012/013/008** contributors (T1424–T1428) may land as stubs returning `[]` until domain features ship — FR-013.

## MVP scope

Minimum shippable: **T1401–T1436** + books/recipes contributors (**T1415–T1422**) for Valentin value before full domain matrix.
