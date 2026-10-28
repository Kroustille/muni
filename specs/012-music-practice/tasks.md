# Tasks: Music practice — compositions, DJ sets & instrument learning (012)

**Input**: `/specs/012-music-practice/`

**Prerequisites**: Feature **001** on `main`; **004** tracks for P2 picker tests. Design docs: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

**Task IDs**: **T1201–T1294** (feature 012 band).

---

## Phase 1: Setup

- [ ] T1201 [P] Add `musicPractice.*` i18n keys (nav, tabs, statuses, apprentissage segments, empty states, validation) in `src/i18n/fr.json` per [contracts/ui-routes.md](contracts/ui-routes.md) and workflow UI contracts
- [ ] T1202 [P] Scaffold domain modules under `src/domain/` for all seven entity types per [data-model.md](data-model.md)
- [ ] T1203 [P] Create `tests/unit/music-practice/` directory and fixture builders for seeded entities

---

## Phase 2: Foundational

**Purpose**: Migration, repositories, sync — blocks all user stories.

- [ ] T1204 Unit tests for composition + DJ validation (status/date rules) in `tests/unit/music-practice/composition-dj-domain.test.ts`
- [ ] T1205 Unit tests for practice + learning-piece validation in `tests/unit/music-practice/apprentissage-domain.test.ts`
- [ ] T1206 Implement `src/domain/music-composition.ts` and `src/domain/dj-set.ts` (depends on T1204)
- [ ] T1207 Implement `src/domain/practice-instrument.ts`, `practice-exercise.ts`, `practice-plan.ts`, `practice-log.ts`, `learning-piece.ts` (depends on T1205)
- [ ] T1208 Migration `db/migrations/0016_music_practice_tables.ts` + register in `db/migrations/index.ts`
- [ ] T1209 [P] Ports under `src/application/ports/music-practice-*-repository.ts` per entity family
- [ ] T1210 Postgres adapters `src/adapters/postgres/music-practice-*-repository.ts` with user scoping and pullSince
- [ ] T1211 IndexedDB adapters + store version bump in `src/adapters/indexeddb/db.ts`
- [ ] T1212 Integration tests push/pull + isolation in `tests/integration/music-practice-sync.test.ts`
- [ ] T1213 Implement `src/application/music-practice-sync.ts` and routes `src/app/api/sync/music-practice/push/route.ts`, `pull/route.ts` per [contracts/music-practice-sync-api.md](contracts/music-practice-sync-api.md) (depends on T1212)
- [ ] T1214 Register music-practice sync channel in `src/composition/sync-run.ts` and client composition
- [ ] T1215 Application use cases: list/upsert/delete wrappers for each entity under `src/application/music-practice/`
- [ ] T1216 Wire repositories into `src/composition/client.ts` and `src/composition/server.ts`
- [ ] T1217 Hub layout `src/app/(app)/music-practice/layout.tsx` with tab navigation per [contracts/ui-routes.md](contracts/ui-routes.md)

**Checkpoint**: Migration applies; push/pull green; hub shell reachable.

---

## Phase 3: User Story A1–A2 — Compositions capture & terminé (P1)

**Goal**: Quick-add, session notes, finished + backdated `finishedAt`.

**Independent Test**: [quickstart.md](quickstart.md) § P1 Compositions.

- [ ] T1220 [US-A1] Unit tests session note ordering in `tests/unit/music-practice/composition-session-notes.test.ts`
- [ ] T1221 [US-A1] Compositions list + quick-add `src/components/music-practice/composition-list.tsx`
- [ ] T1222 [US-A1] Composition detail + session notes UI per [contracts/composition-workflow-ui.md](contracts/composition-workflow-ui.md) (depends on T1220)
- [ ] T1223 [US-A1] Routes `src/app/(app)/music-practice/compositions/page.tsx` and `[id]/page.tsx` (depends on T1221, T1222)
- [ ] T1224 [US-A2] Status **Terminé** + `finishedAt` backdate validation in use case (depends on T1206)
- [ ] T1225 [US-A2] E2e composition offline capture `tests/e2e/music-practice-composition.spec.ts` (depends on T1223)

---

## Phase 4: User Story B1–B2 — DJ performed & planned (P1)

**Goal**: Joué validation, setlist lines, planned → performed.

**Independent Test**: [quickstart.md](quickstart.md) § P1 DJ sets.

- [ ] T1230 [US-B1] Unit tests `performedAt` required when Joué in `tests/unit/music-practice/dj-set-validation.test.ts`
- [ ] T1231 [US-B1] DJ list + detail + setlist editor per [contracts/dj-set-workflow-ui.md](contracts/dj-set-workflow-ui.md)
- [ ] T1232 [US-B1] Routes `src/app/(app)/music-practice/dj-sets/page.tsx` and `[id]/page.tsx` (depends on T1231)
- [ ] T1233 [US-B2] Planned → performed transition preserves fields (depends on T1230)
- [ ] T1234 [US-B1] E2e DJ set offline `tests/e2e/music-practice-dj-set.spec.ts` (depends on T1232)

---

## Phase 5: User Story C1–C3 — Apprentissage library, plan, pieces (P1)

**Goal**: Instruments, exercises, active plan, today + mark done, learning pieces.

**Independent Test**: [quickstart.md](quickstart.md) § P1 Apprentissage.

- [ ] T1240 [US-C1] Unit tests exercise + instrument quick-add in `tests/unit/music-practice/exercise-library.test.ts`
- [ ] T1241 [US-C1] Instrument + exercise list/detail UI (depends on T1240)
- [ ] T1242 [US-C2] Unit tests today assignment resolution + mark done log in `tests/unit/music-practice/practice-today.test.ts`
- [ ] T1243 [US-C2] Plan editor UI per [contracts/apprentissage-plan-ui.md](contracts/apprentissage-plan-ui.md) (depends on T1242)
- [ ] T1244 [US-C2] Today view + **Fait** → `practice_log` (depends on T1242, T1243)
- [ ] T1245 [US-C3] Learning piece list/detail per [contracts/learning-piece-ui.md](contracts/learning-piece-ui.md)
- [ ] T1246 [US-C3] `lastPracticedAt` update when log links piece (depends on T1207)
- [ ] T1247 [US-C1] Routes under `src/app/(app)/music-practice/apprentissage/**` (depends on T1241, T1244, T1245)
- [ ] T1248 [US-C2] E2e apprentissage plan + today `tests/e2e/music-practice-apprentissage.spec.ts` (depends on T1247)

---

## Phase 6: User Story A3, B3–B4, C4 — Filters & cancel (P2)

**Goal**: Local search/filter; DJ cancel; piece filters.

- [ ] T1250 [US-A3] Composition list filters + search (status, title)
- [ ] T1251 [US-B3] DJ **Annulé** flow + history visibility
- [ ] T1252 [US-B4] Setlist line reorder polish (if not in B1)
- [ ] T1253 [US-C4] Apprentissage filters (instrument, piece status) + search

---

## Phase 7: Sync proof (cross-cutting P1)

- [ ] T1260 Multi-device sync e2e extension in `tests/e2e/music-practice-sync.spec.ts` per [quickstart.md](quickstart.md) § P1 Sync
- [ ] T1261 LWW concurrent edit integration cases in `tests/integration/music-practice-sync.test.ts` (extend)

---

## Phase 8: P2 — 004 track links

**Goal**: Optional track references without listen mutation.

- [ ] T1270 [P2] Unit tests track link does not mutate 004 status in `tests/unit/music-practice/track-link.test.ts`
- [ ] T1271 [P2] Shared `track-link-picker` component per [contracts/track-link-picker.md](contracts/track-link-picker.md) (depends on T1270)
- [ ] T1272 [P2] Wire picker into learning piece detail (depends on T1271)
- [ ] T1273 [P2] Wire picker into DJ setlist lines (depends on T1271)
- [ ] T1274 [P2] Wire picker into composition linked tracks (depends on T1271)
- [ ] T1275 [P2] E2e track link reference-only `tests/e2e/music-practice-track-link.spec.ts` (depends on T1272)

---

## Phase 9: Polish & quality gate

- [ ] T1280 Soft-delete restore flows for each entity (foundation pattern)
- [ ] T1281 Orphan `linkedTrackId` / setlist track display copy
- [ ] T1282 SC-004 copy review checklist in e2e or unit snapshot for empty states
- [ ] T1283 Document recap-eligible fields (`finishedAt`, `performedAt`, `practicedAt`) in domain JSDoc referencing [011 FR-006](../011-periodic-recap/spec.md)
- [ ] T1284 Cross-check [011 tasks](../011-periodic-recap/tasks.md) T1195–T1196 after **012** Phase 2 checkpoint (repos wired)
- [ ] T1290 Run `yarn verify:ci` and fix regressions
- [ ] T1291 Update [quickstart.md](quickstart.md) if routes differ from implementation
- [ ] T1292 Mark completed tasks in this file when shipping
- [ ] T1293 Home/overview card optional (defer — out of MVP unless trivial)
- [ ] T1294 Final spec/plan traceability review (FR-001–FR-021 mapped to tests)

---

## Dependencies (story order)

```text
Foundational (Phase 2) → A (Phase 3) ∥ B (Phase 4) ∥ C (Phase 5) → Filters (6) → Sync proof (7) → P2 links (8) → Polish (9)
```

## Parallel example

After Phase 2 checkpoint, one agent may own Phase 3 (compositions) while another owns Phase 4 (DJ) and Phase 5 (apprentissage) — shared sync must stay green via T1213 before merge.
