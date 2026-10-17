# Implementation Plan: Next.js 16 platform upgrade

**Branch**: `006-nextjs-16` (work on `main`) | **Date**: 2026-10-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-nextjs-16/spec.md`

**Build order**: Complete **006** before merging **007** (`specs/007-library-list-bulk/`) to limit integration risk (spec P5).

**Task band**: Implementation tasks use **T601–T6xx** (see [tasks.md](tasks.md)).

## Summary

Upgrade Muni from **Next.js ^15.5** to **Next.js 16.x** with aligned toolchain (`eslint-config-next`, TypeScript types, Serwist PWA wrapper) while preserving **offline-first** behavior, **French UI**, **auth**, **sync**, and **PWA** install/launch. No new product features; parity is verified via existing automated tests plus a documented smoke checklist.

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥22, Next.js **16.0.x** (target `^16.0.2` or latest 16.x patch at implementation time)

**Primary Dependencies**: `next`, `react`, `react-dom` (already React 19), `@serwist/next` + `serwist` (service worker), `eslint-config-next`, Vitest, Playwright

**Storage**: Unchanged — IndexedDB + PostgreSQL via existing ports (no schema changes for this epic)

**Testing**: `yarn test` / Vitest (≥80% coverage on logic folders), `yarn typecheck`, `yarn lint`, `yarn build`, `yarn migrate:up` + migration build, Playwright e2e when Docker stack available

**Target Platform**: Installable PWA (mobile + desktop); App Router; route handlers for auth and catalog proxies

**Project Type**: Single Next.js app (`src/`, `tests/`, `db/migrations/`)

**Performance Goals**: CI production build within **2×** pre-upgrade median (SC-003)

**Constraints**: Constitution I–VII; no lowering coverage thresholds; atomic dependency bump (no mixed Next 15/16); French-only UI

**Scale/Scope**: One user; existing routes and list types unchanged

## Constitution Check

*GATE: Pass before Phase 0. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-first | Pass | Upgrade must not block UI on network; IndexedDB paths unchanged |
| II. Capture speed | Pass | No UX changes required |
| III. Typed lists | Pass | No domain model changes |
| IV. Simplicity | Pass | Dependency bump + targeted fixes only |
| V. Privacy | Pass | No new analytics |
| VI. Portable backend | Pass | Adapters remain behind ports |
| VII. Hexagonal | Pass | No business logic in route handlers beyond existing patterns |

**Post-design**: No new violations; complexity table empty.

## Project Structure

### Documentation (this feature)

```text
specs/006-nextjs-16/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── quality-gates.md
│   └── smoke-regression.md
└── tasks.md
```

### Source Code (repository root)

```text
package.json              # next, eslint-config-next, @types/*
next.config.ts            # Serwist wrapper — verify Next 16 compat
src/app/                  # App Router pages + API routes
src/app/sw.ts             # Serwist service worker entry
tests/                    # unit, integration, e2e
db/migrations/            # unchanged for 006
```

**Structure Decision**: Continue single-package layout; all upgrade work touches toolchain config and any framework breaking-change call sites in `src/` and `tests/`.

## Phased implementation outline

### Phase 0 — Research (research.md)

Audit Next.js 16 release notes; confirm `@serwist/next` peer range; document breaking changes affecting `next.config.ts`, middleware (if any), `next/image`, and default bundler (Turbopack in dev if enabled).

### Phase 1 — Design artifacts

- **data-model.md**: No new domain entities; documents **quality gate** and **release baseline** only.
- **contracts/**: Required CI commands and manual/e2e smoke paths.
- **quickstart.md**: Contributor validation after upgrade.

### Implementation (tasks.md)

1. **T601–T603**: Release-notes audit + dependency bump plan.
2. **T604–T609**: Bump `next`, `eslint-config-next`, verify Serwist build, fix compile/lint breakages.
3. **T610–T618**: User-story validation (offline/PWA, auth, full test/build pipeline).
4. **T619**: Polish — document resolved breaking changes in research.md if any.

## Open decisions (defaults in research.md)

| ID | Topic | Default |
|----|--------|---------|
| OD-006-1 | Next pin | `^16.0.2` (latest 16.x patch at implementation) |
| OD-006-2 | React | Keep React 19.x aligned with Next 16 peer deps |
| OD-006-3 | Turbopack | Match Next 16 default for `next dev` only if stable; else explicit `--turbo` opt-in |
| OD-006-4 | E2e in CI | Same as today — required when environment provides Docker |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |

## Artifacts

| Artifact | Path |
|----------|------|
| Research | [research.md](research.md) |
| Data model | [data-model.md](data-model.md) |
| Quickstart | [quickstart.md](quickstart.md) |
| Contracts | [contracts/](contracts/) |
