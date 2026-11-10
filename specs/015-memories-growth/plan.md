# Implementation Plan: Souvenirs & progression

**Branch**: `015-memories-growth` (work on `main`) | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/015-memories-growth/spec.md`

**Depends on**: **001** foundation (auth, offline sync, quick-add, French UI); **011** récap contributors (single source of dated domain events) and récap snapshot (Moments forts); **014** Accueil card slot pattern and local per-day store; **002/003** year goals (read-through). Domain data from **002–004, 008, 010, 012, 013** is consumed only via 011 contributors.

**Task band**: **T1501–T1599** (see [tasks.md](tasks.md)).

**Product context**: Promotes the [009](../009-experiences-achievements/spec.md) north star to delivery: Muni helps people **not forget good moments** and **improve themselves** — without guilt, comparison or gamification.

## Summary

Add four synced entities — **souvenir**, **goal**, **goal_checkin**, **achievement** — on a new **`/api/sync/memories-growth/*`** channel (mirrors 012/013). Everything else is **derived**: **Fil de vie** and **goal progress** reuse 011's `DomainRecapContributor`s through a thin `DomainEventsQuery` port; **réalisations** are created by a local, idempotent rule evaluator with **deterministic ids** (UUIDv5) so offline devices converge; **Ce jour-là** and **Moments forts** are read-only projections. Two new hubs, **Souvenirs** (`/souvenirs`) and **Progression** (`/progression`), plus a **Souvenir** option in global quick-add.

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥ 22, Next.js 16 (App Router), React 19

**Primary Dependencies**: Existing hexagonal stack (zod domain schemas, Kysely/Postgres, `idb` IndexedDB, HLC per-field LWW in `src/domain/merge.ts`/`clock.ts`); récap contributors `src/application/recap/contributors/*`; `normalizeText` for search; lucide icons `BookHeart`, `Sprout`, `Sparkles`. **No new npm dependency** (UUIDv5 via WebCrypto).

**Storage**:
- Postgres migration **`0021_memories_growth_tables.ts`**: `souvenir`, `goal`, `goal_checkin`, `achievement` (composite PK `(user_id, id)`, `fields_updated_at` jsonb, `deleted_at`, `server_updated_at`)
- IndexedDB version bump: same four stores + local-only `on_this_day_dismissal`, `memories_prefs`, `timeline_filter`
- Regenerate `src/adapters/postgres/db-types.ts` with `yarn db:codegen` (CI checks it; keep alphabetical column order)

**Testing**: Vitest unit (domain validation, period presets, progress, rule evaluator idempotency, UUIDv5 vectors, Ce jour-là date matching incl. 29 Feb, timeline ordering, tone deny-list scan); Vitest integration (sync push/pull/isolation, deterministic achievement merge); Playwright e2e per [quickstart.md](quickstart.md). E2E rules learned 2026-11-10: wait for writes before navigating (`saveItem`/sheet close), no offline route changes, block the service worker only in specs that mock `/api`.

**Target Platform**: Mobile-first PWA; desktop sidebar + split views unchanged.

**Performance Goals**: SC-001 souvenir capture < 10 s; SC-002 Fil de vie current month < 1 s offline with 5 years of history; SC-003 goal progress updates < 1 s after a domain change.

**Constraints**: Offline-first for all writes; French-only copy passing the 009 tone review; no photos, notifications, sharing (spec Out of Scope); no changes to `ItemType`.

**Scale/Scope**: Single user; ≤ thousands of souvenirs, ≤ hundreds of goals; 6 user stories (P1: US1–US3; P2: US4–US5; P3: US6).

## Constitution Check

*GATE: Pass before Phase 0. Re-checked after Phase 1 design — still passing.*

| Principle | Status | Notes |
|---|---|---|
| I. Offline-first, always instant | Pass | All CRUD local; sync background; evaluator and projections run on local data |
| II. Capture speed over completeness | Pass | Souvenir quick-add = title + date (default today), ≤ 3 taps |
| III. Typed lists, not generic notes | Pass | Souvenir is a **typed** entity (date, mood, place, favourite, typed links); free text is one optional field, not the model. Goals/achievements are structured |
| IV. Simplicity (YAGNI) | Pass | Timeline/progress derived from existing contributors (no event journal); links as jsonb; rules in code; prefs device-local |
| V. Privacy by default | Pass | Per-user tables, session-derived `user_id`, isolation integration tests; no sharing |
| VI. Portable backend | Pass | Plain Postgres tables + ports/adapters |
| VII. Domain-driven, hexagonal | Pass | `src/domain/{souvenir,goal,achievement}.ts`; use cases in `src/application/memories-growth/`; contributors reached through a port, not imported by UI |

## Project Structure

### Documentation (this feature)

```text
specs/015-memories-growth/
├── spec.md
├── plan.md                 # this file
├── research.md             # R1–R13 decisions
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── memories-growth-sync-api.md
│   ├── ui-routes.md
│   ├── timeline-and-progress.md
│   └── achievements-and-resurfacing.md
└── tasks.md
```

### Source code (touch map)

```text
src/domain/souvenir.ts
src/domain/goal.ts                       # goal, goal_checkin, periods, metrics
src/domain/achievement.ts
src/domain/deterministic-uuid.ts         # UUIDv5 (WebCrypto)
src/application/ports/memories-growth-repositories.ts
src/application/memories-growth/
  souvenir-use-cases.ts
  goal-use-cases.ts  goal-progress.ts  virtual-goals.ts
  achievement-rules.ts  evaluate-achievements.ts
  domain-events.ts  timeline.ts  on-this-day.ts  highlights.ts
src/application/sync/memories-growth-sync-engine.ts
src/application/server/memories-growth-sync-service.ts
src/adapters/indexeddb/memories-growth-repositories.ts   (+ db.ts version bump)
src/adapters/postgres/memories-growth-repositories.ts   (+ db-types.ts regen)
src/adapters/http/memories-growth-remote-store.ts
src/app/api/sync/memories-growth/{push,pull}/route.ts
src/composition/client.ts  client-memories-growth-sync.ts  server-container
src/app/(app)/souvenirs/{page.tsx,[id]/page.tsx}
src/app/(app)/progression/{page.tsx,objectifs/nouveau/page.tsx,objectifs/[id]/page.tsx,realisations/[id]/page.tsx}
src/components/memories/   souvenir-*.tsx, timeline-*.tsx, on-this-day-card.tsx, linked-souvenirs-section.tsx
src/components/progression/ goal-*.tsx, achievement-*.tsx, celebration-toast.tsx
src/components/quick-add/quick-add-context.tsx   # Souvenir option
src/components/nav-config.ts                    # two FEATURE_NAV hubs
src/app/(app)/page.tsx                          # Ce jour-là card + hubs row
src/application/recap/build-recap-snapshot.ts   # optional highlights (Moments forts)
src/components/recap/                           # Moments forts section
db/migrations/0021_memories_growth_tables.ts (+ index.ts)
src/i18n/fr.json                                # memories.*, progression.*
tests/unit/memories-growth/*.test.ts
tests/integration/memories-growth-sync.test.ts
tests/e2e/memories-*.spec.ts, progression-*.spec.ts
```

**Structure Decision**: Mirror 012/013 — new entities are **not** `items`; one sync channel for the feature; projections live in `application/memories-growth` and read other domains only through the récap contributor port.

## Phased implementation (ship order)

| Batch | User stories | Outcome |
|---|---|---|
| **1 — Foundation** | — | Domain + UUIDv5, migration, repositories, sync channel, i18n, nav hubs (empty states) |
| **2 — Souvenirs** | US1 | Quick-add Souvenir, list, detail, links, « Souvenirs liés » on item/workout/plant, search |
| **3 — Fil de vie** | US2 | `DomainEventsQuery`, month pagination, filters, jump to month |
| **4 — Objectifs** | US3 | Goal CRUD, progress (auto + check-ins), virtual year goals, reflection prompt |
| **— P1 checkpoint —** | | Capture, remember, improve: demoable, all P1 e2e green |
| **5 — Ce jour-là** | US4 | Accueil card, per-day dismissal, settings toggle |
| **6 — Réalisations** | US5 | Rule evaluator, deterministic ids, manual achievements, celebration, timeline entries |
| **7 — Moments forts** | US6 | Récap highlights for month/year |
| **8 — Polish** | — | Tone deny-list test, Accueil hubs row, a11y pass, performance check (SC-002) |

## Decisions

### Locked (Valentin, 2026-11-10)

| ID | Topic | Decision |
|---|---|---|
| OD-015-1 | Memory content v1 | Text + date, **no photos** |
| OD-015-2 | Resurfacing | Fil de vie + Ce jour-là + Moments forts — all three |
| OD-015-3 | Self-improvement model | Goals **and** achievements, now |

### Implementation defaults (from [research.md](research.md); change by editing here before Batch 1)

| ID | Topic | Default |
|---|---|---|
| OD-015-4 | Domain event source | 011 contributors via `DomainEventsQuery` (R1) |
| OD-015-5 | Year goals 002/003 | Read-through virtual goals; no migration (R6) |
| OD-015-6 | Mobile reach of feature hubs | Accueil hubs row in 015; **follow-up recommended**: a mobile « Plus » menu exposing all `FEATURE_NAV` hubs (fixes 008/012/013 too) (R10) |
| OD-015-7 | Fitness personal-record achievements | **Deferred** (needs PR detection, cf. 011 T1194) (R7) |
| OD-015-8 | Ce jour-là toggle | Device-local preference, not synced (R8) |
| OD-015-9 | Moments forts granularity | Month and year only (R12) |
| OD-015-10 | Achievement backfill | Created silently for history; celebrate only if earned ≤ 7 days ago (R7) |

## Complexity Tracking

| Addition | Why needed | Simpler alternative rejected because |
|---|---|---|
| New sync channel + 4 tables | Souvenirs/goals/achievements are user data that must sync | Storing in `items` would need a new `ItemType`, overload list UIs, and break typed-list semantics |
| Deterministic UUIDv5 for auto achievements | SC-004: no duplicates across offline devices | Server-side dedupe needs unique natural-key index + conflict path; random ids would duplicate |
| Contributor port reuse for timeline/progress | One definition of "something happened" across Récap, Fil de vie, Objectifs | Own queries would duplicate domain rules and their bugs |
