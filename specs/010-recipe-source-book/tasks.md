# Tasks: Recipes — source book / cookbook citation (010)

**Input**: `/specs/010-recipe-source-book/`

**Prerequisites**: Feature **001** on `main`. Design docs: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

**Task IDs**: **T1001–T1081** (feature 010 band).

---

## Phase 1: Setup

- [ ] T1001 [P] Add French i18n keys for Ouvrage source, combobox, create hint, help text, detail labels, missing-cookbook fallback in `src/i18n/fr.json` per [contracts/cookbook-combobox-ui.md](contracts/cookbook-combobox-ui.md) and [research.md](research.md) § Product copy

---

## Phase 2: Foundational

**Purpose**: Domain, persistence, sync, item wire fields — blocks all user stories.

- [ ] T1002 Unit tests for `Cookbook` validation (title trimmed length **1–500**, author **1–200** or null, isbn **1–32** or null) in `tests/unit/cookbook/domain.test.ts`
- [ ] T1003 Unit tests for recipe `cookbookId` / `sourcePage` rules (`sourcePage` null when `cookbookId` null; max **100** chars) in `tests/unit/cookbook/recipe-source-fields.test.ts`
- [ ] T1004 Implement `src/domain/cookbook.ts` (schemas, wire mapping, upsert helpers) per [data-model.md](data-model.md) (depends on T1002)
- [ ] T1005 Extend `src/domain/item.ts` with `cookbookId` and `sourcePage` on recipe type, wire fields `cookbook_id` / `source_page`, and recipe branch validation (depends on T1003)
- [ ] T1006 Migration `db/migrations/0015_cookbooks_and_recipe_source.ts` (`cookbooks` table, item columns, FK, recipe check constraints) + register in `db/migrations/index.ts`
- [ ] T1007 [P] Ports `src/application/ports/cookbook-repository.ts` and `src/application/ports/cookbook-remote-store.ts` per [contracts/cookbook-sync-api.md](contracts/cookbook-sync-api.md)
- [ ] T1008 Postgres adapter `src/adapters/postgres/cookbook-repository.ts` with user scoping and pullSince
- [ ] T1009 IndexedDB adapter `src/adapters/indexeddb/cookbook-repository.ts` + store version bump in `src/adapters/indexeddb/db.ts`
- [ ] T1010 Extend Postgres and IndexedDB item repositories/mappers for `cookbook_id` and `source_page` on recipe rows
- [ ] T1011 Integration tests cookbook sync push/pull + isolation in `tests/integration/cookbook-sync.test.ts`
- [ ] T1012 Implement `src/application/cookbook-sync.ts` and routes `src/app/api/sync/cookbooks/push/route.ts`, `pull/route.ts` (depends on T1011)
- [ ] T1013 Register cookbook sync channel in `src/composition/sync-run.ts` (and client composition) with pull-before-items hydration rule from contract
- [ ] T1014 Implement `src/application/cookbooks/list-cookbooks.ts`, `upsert-cookbook.ts`, `search-cookbooks.ts` (accent-insensitive filter, max **20** results)
- [ ] T1015 Wire cookbook repository into client/server composition (`src/composition/client.ts`, `src/composition/server.ts`)

**Checkpoint**: Migrations apply; cookbook push/pull green; recipe items accept null source fields.

---

## Phase 3: User Story 1 — Pick or create cookbook when adding (P1)

**Goal**: Combobox search/create + optional page; title-only save unchanged (FR-003, FR-004).

**Independent Test**: [quickstart.md](quickstart.md) § P1 steps 1–2.

- [ ] T1020 [US1] Unit tests combobox search + create title trimming in `tests/unit/cookbook/search-cookbooks.test.ts`
- [ ] T1021 [US1] Build `src/components/fields/cookbook-combobox.tsx` per [contracts/cookbook-combobox-ui.md](contracts/cookbook-combobox-ui.md) (depends on T1020, T1014)
- [ ] T1022 [US1] Integrate collapsible **Ouvrage source** into `src/components/fields/recipe-fields.tsx` (after title, default collapsed on add)
- [ ] T1023 [US1] Extend recipe create/update use cases in `src/application/items.ts` to upsert cookbook then item with `cookbookId` / `sourcePage` (depends on T1005, T1014)
- [ ] T1024 [US1] E2e add recipe with create cookbook + page offline `tests/e2e/recipe-source.spec.ts` (depends on T1022)

---

## Phase 4: User Story 2 — Reuse the same cookbook (P1)

**Goal**: Pick existing cookbook; edit author/ISBN once, visible on all referencing recipes (US2).

**Independent Test**: [quickstart.md](quickstart.md) § P1 step 3–4.

- [ ] T1030 [US2] Unit test cookbook author upsert propagates to display resolver in `tests/unit/cookbook/upsert-cookbook.test.ts`
- [ ] T1031 [US2] Expose optional author/ISBN fields on recipe form when cookbook selected; upsert cookbook on save in `src/components/fields/recipe-fields.tsx` + use case (depends on T1030)
- [ ] T1032 [US2] E2e two recipes same `cookbookId` different pages; edit author on one form updates both details `tests/e2e/recipe-source.spec.ts`

---

## Phase 5: User Story 3 — Edit or clear source (P1)

**Goal**: Change page, switch cookbook, clear selection clears persistence (FR-008).

**Independent Test**: [quickstart.md](quickstart.md) § P1 — Edit & clear.

- [ ] T1040 [US3] Unit tests clear selection nulls `cookbookId` and `sourcePage`; page-only LWW in `tests/unit/cookbook/recipe-source-fields.test.ts`
- [ ] T1041 [US3] Wire edit flow on `src/app/(app)/items/[id]/page.tsx` for combobox clear/switch (depends on T1040, T1021)
- [ ] T1042 [US3] E2e clear source hides section `tests/e2e/recipe-source.spec.ts`

---

## Phase 6: User Story 4 — View source on recipe detail (P1)

**Goal**: **Ouvrage source** section with stable field order (FR-007).

**Independent Test**: [quickstart.md](quickstart.md) § P1 — Detail.

- [ ] T1050 [US4] Implement `src/components/recipe/recipe-source-section.tsx` per [contracts/recipe-source-detail-ui.md](contracts/recipe-source-detail-ui.md)
- [ ] T1051 [US4] Mount section on recipe detail after steps, before notes in `src/app/(app)/items/[id]/page.tsx` (depends on T1050)
- [ ] T1052 [US4] E2e detail field order with ISBN `tests/e2e/recipe-source.spec.ts`

---

## Phase 7: User Story 5 — Sync cookbooks and recipe references (P1)

**Goal**: Offline create/edit replicates across devices with per-field LWW (FR-006).

**Independent Test**: [quickstart.md](quickstart.md) § P1 — Sync.

- [ ] T1060 [US5] Extend `tests/integration/cookbook-sync.test.ts` with recipe `cookbook_id` / `source_page` on item push and concurrent per-field LWW cases
- [ ] T1061 [US5] E2e two-browser or serialized sync scenario cookbook + recipe + author edit in `tests/e2e/recipe-source-sync.spec.ts` (depends on T1060)

---

## Phase 8: User Story 6 — Find recipes by cookbook (P2)

**Goal**: Global search matches cookbook title substring (FR-011).

**Independent Test**: [quickstart.md](quickstart.md) § P2.

- [ ] T1070 [US6] Unit tests search index includes cookbook title in `tests/unit/search-cookbook.test.ts` per [contracts/recipe-search-extension.md](contracts/recipe-search-extension.md)
- [ ] T1071 [US6] Extend `src/application/search.ts` to subscribe to cookbook repo and index titles (depends on T1070)
- [ ] T1072 [US6] E2e search by cookbook title returns expected recipes `tests/e2e/recipe-source.spec.ts`

---

## Phase 9: Polish & cross-cutting

- [ ] T1080 [P] Run `yarn verify:ci` and fix any coverage gaps for `src/domain/cookbook.ts` and `src/application/cookbooks/*`
- [ ] T1081 [P] Mark completed tasks in this file and align [checklists/requirements.md](checklists/requirements.md) if needed after implementation

---

## Dependencies

```text
Setup (T1001) → Foundational (T1002–T1015) → US1 (T1020–T1024)
US1 → US2 (T1030–T1032) → US3 (T1040–T1042) → US4 (T1050–T1052)
Foundational → US5 (T1060–T1061)
US2 + Foundational → US6 (T1070–T1072)
All → Polish (T1080–T1081)
```

## Parallel opportunities

- T1001 alongside T1002/T1003 once keys list is known
- T1007 with T1006 after migration merged
- T1080/T1081 after feature complete

## Implementation strategy

**MVP (P1)**: Complete through **Phase 7** (US1–US5) — shippable provenance without search.

**Incremental**: Ship MVP, then **Phase 8** (US6 search) as fast follow.

## Format validation

All tasks use checklist format `- [ ] Txxx [P?] [USn?] Description with file path`.
