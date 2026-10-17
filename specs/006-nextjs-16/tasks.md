# Tasks: Next.js 16 platform upgrade (006)

**Input**: `/specs/006-nextjs-16/`

**Prerequisites**: Features **001–005** on `main`. Design docs: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

**Recommended before**: [007-library-list-bulk](../007-library-list-bulk/tasks.md) implementation.

**Task IDs**: **T601–T620** (feature 006 band).

---

## Phase 1: Setup

**Purpose**: Audit and baseline before dependency bump.

- [ ] T601 Document Next.js 16 breaking-change checklist (App Router, image, middleware, Turbopack) in `specs/006-nextjs-16/research.md` §5 with links to official migration notes
- [ ] T602 Record pre-upgrade baseline (`next` / `eslint-config-next` versions, CI build time note) in `specs/006-nextjs-16/research.md`

---

## Phase 2: Foundational (toolchain)

**Purpose**: Atomic framework upgrade — **blocks all user-story validation**.

- [ ] T603 Bump `next` to `^16.0.x` and `eslint-config-next` to matching 16.x in `package.json`
- [ ] T604 Regenerate lockfile via `yarn install` and align `@types/react` / `@types/react-dom` peers if Next 16 requires
- [ ] T605 Verify `@serwist/next` compatibility; bump `serwist` / `@serwist/next` in `package.json` if needed for Next 16 build
- [ ] T606 Fix `next.config.ts` and `src/app/sw.ts` compile or build warnings per Next 16 + Serwist docs
- [ ] T607 Resolve `yarn typecheck` failures across `src/` and `tests/` after upgrade
- [ ] T608 Resolve `yarn lint` failures (including `eslint-config-next` rule changes) across repository

**Checkpoint**: `yarn typecheck` and `yarn lint` clean.

---

## Phase 3: User Story 1 — Everyday use unchanged (P1)

**Goal**: Offline lists, quick-add, PWA shell parity (spec US1, FR-002–FR-005).

**Independent Test**: [contracts/smoke-regression.md](contracts/smoke-regression.md) SM-001–SM-007.

- [ ] T609 [US1] Fix App Router / RSC regressions affecting list pages under `src/app/(app)/` and `src/components/lists/list-page-content.tsx`
- [ ] T610 [US1] Verify offline IndexedDB reads after upgrade; fix any client composition breakages in `src/composition/client.ts`
- [ ] T611 [US1] Validate PWA precache and offline shell per `quickstart.md` §4; adjust Serwist config only if required

**Checkpoint**: SM-001–SM-007 pass on `yarn build && yarn start`.

---

## Phase 4: User Story 2 — Authentication and session (P1)

**Goal**: Magic link, Google, session handling unchanged (spec US2, FR-006).

**Independent Test**: SM-008–SM-009; existing auth-related tests green.

- [ ] T612 [US2] Fix auth route handlers under `src/app/api/` (session, magic link, OAuth) if Next 16 request/cookie APIs changed
- [ ] T613 [US2] Run and fix failing auth/session unit or integration tests under `tests/` tied to auth adapters

---

## Phase 5: User Story 3 — Green pipeline (P1)

**Goal**: All quality gates pass (spec US3, FR-007–FR-009).

**Independent Test**: [contracts/quality-gates.md](contracts/quality-gates.md) QG-001–QG-006.

- [ ] T614 [US3] Fix unit/integration test failures in `tests/` until `yarn test` passes without disabled tests
- [ ] T615 [US3] Ensure `yarn build` succeeds (production bundle including Serwist `public/sw.js`)
- [ ] T616 [US3] Run `yarn build:migrations` and `yarn migrate:up`; fix any tooling breakages in `db/` scripts
- [ ] T617 [US3] Run Playwright suite `yarn test:e2e` when Docker stack available; fix framework-related flakes only (no 007 features)

---

## Phase 6: Polish

- [ ] T618 Execute [contracts/smoke-regression.md](contracts/smoke-regression.md) SM-010–SM-011 (PWA launch + sync) and note results in PR/commit body
- [ ] T619 Update `specs/006-nextjs-16/research.md` with resolved breaking-change IDs from implementation
- [ ] T620 Final gate: `yarn typecheck`, `yarn lint`, `yarn test`, `yarn build` per [quickstart.md](quickstart.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **Phase 3–5** (3/4/5 can overlap after Phase 2 once build compiles)
- **Phase 6** after Phases 3–5 green

### User Story Dependencies

- **US1** and **US2** depend on Phase 2; independent of each other after compile
- **US3** depends on US1/US2 fixes only if tests cover those flows (fix order by failing test suite)

### Parallel Opportunities

- T601 and T602 can run in parallel
- After T607, T609/T612/T614 can proceed in parallel on different subsystems if staffed

---

## Parallel Example: Post-upgrade fixes

```bash
# Different owners after T608:
# - List/offline: T609–T611
# - Auth routes: T612–T613
# - Test suite: T614
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1–2 (toolchain green compile/lint)
2. Complete Phase 3 (US1 smoke) — **stop** if PWA/offline broken
3. Phase 4–5 then Phase 6

### Incremental Delivery

Ship single PR to `main` with full T601–T620 complete; no partial Next 15/16 mix in production.

---

## Notes

- Do **not** implement **007** list UX in this band.
- Commit with Conventional Commits (`chore(deps):`, `fix(next):`, etc.).
