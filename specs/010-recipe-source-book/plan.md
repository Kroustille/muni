# Implementation Plan: Recipes — source book / cookbook citation

**Branch**: `010-recipe-source-book` (work on `main`) | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-recipe-source-book/spec.md`

**Depends on**: **001** foundation (recipe items, add/edit/detail, offline sync, French UI). **No dependency** on **002** books library item types or catalog flows.

**Task band**: **T1001–T10xx** (see [tasks.md](tasks.md)).

**Product context**: Locked MVP model in spec § Decision summary and [research.md](research.md) — user-scoped **cookbook catalog**, recipe **`cookbookId`** + **`sourcePage`**, **single combobox** (search/create), **not** books-to-read.

## Summary

Add a **user-scoped cookbook registry** (title required; optional author, ISBN) synced like book quotes, plus optional **`cookbookId`** and **`sourcePage`** on **recipe** items. Recipe add/edit gets one **Ouvrage source** combobox (accent-insensitive search, create-in-place) and optional **Page(s)**; detail resolves cookbook metadata for display. **Offline-first** IndexedDB + Postgres with dedicated **`/api/sync/cookbooks/*`** push/pull and extended item sync fields. **P2**: global search matches cookbook title. **No** library book picker, **no** shared type with `002`.

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥22, Next.js 16+ (per 006 on `main`)

**Primary Dependencies**: Existing hexagonal stack; `normalizeText` for cookbook combobox and P2 search; sync patterns from **book quotes** and **fitness**; `RecommendedByInput` / list combobox patterns for UX reference

**Storage**:
- New table **`cookbooks`** (composite PK `user_id`, `id`; title, author, isbn; soft delete + LWW jsonb)
- **`items`**: nullable **`cookbook_id`** (FK → cookbooks) and **`source_page`** text for `type = recipe` only; extend type check constraint
- IndexedDB: `cookbooks` store + recipe item fields in existing items store
- Kysely migration **`0015_cookbooks_and_recipe_source.ts`** (next after `0014_fitness_tables`)

**Testing**: Vitest domain validation (cookbook title trim, page without cookbook rejected, recipe FK rules); cookbook sync isolation tests mirroring quotes; Playwright e2e per [quickstart.md](quickstart.md); extend search unit tests for US6

**Target Platform**: PWA mobile-first; desktop parity on recipe forms and detail

**Constraints**: Manual cookbook create only (FR-005); page MUST NOT persist without `cookbookId` (FR-002); no cookbook delete UI in MVP; orphan cookbooks allowed; French i18n only; no Open Library on recipe form

**Scale/Scope**: One user, hundreds of cookbooks, thousands of recipes; P1 stories US1–US5, P2 US6 search

## Constitution Check

*GATE: Pass before Phase 0. Re-check after Phase 1.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-first | Pass | Cookbooks + recipe refs local; sync background |
| II. Capture speed | Pass | Title-only save unchanged; source section collapsible on add |
| III. Typed lists | Pass | Cookbook is dedicated catalog, not generic notes |
| IV. Simplicity | Pass | Per-field LWW; no CRDT; separate sync channel like quotes |
| V. Privacy | Pass | Per-user tables + isolation tests on cookbook APIs |
| VI. Portable backend | Pass | Postgres migration + ports/adapters |
| VII. Hexagonal | Pass | `Cookbook` domain, use cases under `application/cookbooks/`, UI adapters only in components |

**Post-design**: Second synced entity type justified — cookbooks reused across recipes; inline-only fields rejected in research. See Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/010-recipe-source-book/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
├── contracts/
│   ├── cookbook-sync-api.md
│   ├── cookbook-combobox-ui.md
│   ├── recipe-source-detail-ui.md
│   └── recipe-search-extension.md
└── tasks.md
```

### Source Code (touch map — implementation, not in this planning commit)

```text
src/domain/cookbook.ts
src/domain/item.ts                    # cookbookId, sourcePage on recipe
src/application/cookbooks/
  list-cookbooks.ts, upsert-cookbook.ts, search-cookbooks.ts
src/application/ports/cookbook-repository.ts
src/application/ports/cookbook-remote-store.ts
src/application/cookbook-sync.ts
src/adapters/postgres/cookbook-repository.ts
src/adapters/indexeddb/cookbook-repository.ts
src/app/api/sync/cookbooks/push/route.ts
src/app/api/sync/cookbooks/pull/route.ts
src/composition/sync-run.ts           # register cookbook channel
src/components/fields/cookbook-combobox.tsx
src/components/fields/recipe-fields.tsx
src/components/recipe/recipe-source-section.tsx
src/app/(app)/items/[id]/page.tsx     # detail placement
src/application/search.ts             # P2 cookbook title join
db/migrations/0015_cookbooks_and_recipe_source.ts
src/i18n/fr.json
tests/unit/cookbook/
tests/integration/cookbook-sync.test.ts
tests/e2e/recipe-source.spec.ts
```

**Structure Decision**: Mirror **book quotes** — cookbooks **not** in `items` enum; recipe reference fields live on **`items`** row (like foreign keys to quotes’ parent, but optional nullable FK). Sync split: **items** channel carries `cookbook_id` / `source_page`; **cookbooks** channel carries catalog rows.

## Phased implementation outline (recommended ship order)

| Ship batch | User stories | Outcome |
|------------|--------------|---------|
| **1 — Foundation** | — (blocks US1–US5) | Migration, domain, repos, cookbook sync, item wire fields, i18n |
| **2 — Capture** | US1, US2 | Combobox search/create; optional author/ISBN on selected cookbook; reuse across recipes |
| **3 — Edit & display** | US3, US4 | Clear source; detail **Ouvrage source** block; page validation |
| **4 — Sync proof** | US5 | Multi-device e2e + integration LWW cases |
| **5 — Discovery** | US6 (P2) | Global search by cookbook title |

## Open decisions (defaults in research.md § Planning decisions)

| ID | Topic | Default |
|----|--------|---------|
| OD-010-1 | Cookbook sync routes | `POST /api/sync/cookbooks/push`, `GET /api/sync/cookbooks/pull` |
| OD-010-2 | Wire field names | Item: `cookbook_id`, `source_page`; Cookbook: `title`, `author`, `isbn` |
| OD-010-3 | Cookbook edit surface | Author/ISBN editable on recipe form when a cookbook is selected (upsert cookbook row); title via combobox only |
| OD-010-4 | Detail section order | After **steps**, before **notes**; omitted when no `cookbookId` |
| OD-010-5 | Add form layout | Collapsible **Ouvrage source** after title (collapsed by default) |
| OD-010-6 | Title max length | 500 chars trimmed non-empty on create (match long book titles) |
| OD-010-7 | P2 search | Load cookbook map in search index; match normalized cookbook title substring |

## Complexity Tracking

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| `cookbooks` table + sync channel | Reuse metadata across recipes; edit author once | Inline bibliographic fields on each recipe (Option A) — typos, no reuse |
| FK `cookbook_id` on recipe items | Stable reference while cookbook title edits propagate | Denormalized title-only on recipe — breaks US2 acceptance |
| Separate type from `002` books | Reading lifecycle ≠ cooking provenance | Library link (Option B/C) — wrong workflow, FR-009 |
