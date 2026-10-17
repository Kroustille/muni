# Feature Specification: Next.js 16 platform upgrade

**Feature directory**: `specs/006-nextjs-16/`

**Feature Branch**: `006-nextjs-16`

**Created**: 2026-10-17

**Status**: Draft (specified; planning and implementation pending)

**Input**: Upgrade the Muni web application from Next.js **^15.5** to **Next.js 16** (and aligned runtime dependencies such as React and lint tooling) with **no user-visible regression**: Progressive Web App behavior, offline-first local data, French UI, authentication, sync, and existing list features must behave as today. Automated **build**, **unit/integration tests**, and **CI** must pass on the upgraded stack.

**Depends on**: Muni features **001–005** (current production behavior is the baseline). **Recommended before** feature **007** (library list UX and bulk) to avoid merging a large UI change with a platform upgrade.

## Clarifications

### Session 2026-10-17 (locked — roadmap)

- **P1:** User-facing product scope is **unchanged**; this is a platform stabilization release, not a feature release.
- **P2:** **PWA** installability, service worker / offline shell behavior, and **offline-first** IndexedDB usage MUST remain equivalent from the user’s perspective.
- **P3:** **French-only** UI and i18n patterns MUST be preserved; no new languages in this feature.
- **P4:** **CI** MUST run the same quality gates as today (tests, build, migrations checks, and e2e when the environment supports them) and MUST pass on the upgraded stack.
- **P5:** Parallel work on **007** is possible but **risky**; teams SHOULD land **006** first or keep **007** branches rebased on **006** before merge.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Everyday use unchanged after upgrade (Priority: P1)

A signed-in user opens Muni on mobile or desktop, browses shopping, books, movies, recipes, and music lists, adds or edits items, uses search, and works **offline** exactly as before the upgrade. No new steps, broken screens, or missing French strings.

**Why this priority**: The upgrade only succeeds if users perceive no breakage.

**Independent Test**: Run the existing automated e2e smoke paths (or manual equivalent checklist) on a build produced from the upgraded stack; compare critical flows to pre-upgrade baseline.

**Acceptance Scenarios**:

1. **Given** a signed-in user with local data, **When** they open the app **offline**, **Then** lists and item detail load from local storage without error.
2. **Given** a PWA-installed user, **When** they launch from the home screen, **Then** the app opens to the same entry experience as before upgrade.
3. **Given** any supported list type, **When** the user quick-adds an item with title only, **Then** the item appears in the list with French labels intact.
4. **Given** network returns after offline edits, **When** sync runs in the background, **Then** data still reconciles without user-blocking errors (same semantics as today).

---

### User Story 2 - Authentication and session (Priority: P1)

A user signs in with magic link or Google, uses the app, and signs out or recovers from an expired session without new failures introduced by the upgrade.

**Independent Test**: Execute auth-focused automated tests and manual sign-in / sign-out once on upgraded build.

**Acceptance Scenarios**:

1. **Given** a new visitor online, **When** they complete magic-link or Google sign-in, **Then** they reach the main app.
2. **Given** an expired session, **When** the user opens the app offline, **Then** local data remains accessible with the same non-blocking re-auth prompt as today.

---

### User Story 3 - Operators and contributors: green pipeline (Priority: P1)

A contributor runs the standard project scripts locally and in CI; **build**, **test**, and **database migration** checks succeed on the upgraded dependencies without relaxing coverage or architecture rules from the constitution.

**Why this priority**: Prevents shipping a broken stack; defines “done” for this epic.

**Independent Test**: CI job on `main` (or release branch) completes with same required checks as pre-upgrade.

**Acceptance Scenarios**:

1. **Given** a clean checkout, **When** the contributor runs the documented test command, **Then** all required tests pass.
2. **Given** a clean checkout, **When** the contributor runs the production build, **Then** the build completes without errors.
3. **Given** migration scripts in the repo, **When** CI runs migration validation, **Then** validation passes.

---

### Edge Cases

- **Breaking framework behavior**: Any deprecated API or default change in the new major version MUST be addressed so user flows above still pass; undocumented behavior changes are treated as defects.
- **Development vs production**: Local `dev` and production `build`/`start` both MUST remain usable for contributors.
- **Third-party adapters**: Email, Google auth, and PostgreSQL adapters MUST continue to work; adapter-only fixes are in scope if required by the upgrade.
- **Partial upgrade**: Shipping with a mix of old and new major versions for the same app shell is out of scope — upgrade is atomic per release.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST run on **Next.js 16** (minimum 16.0.0) as the web framework for routing, rendering, and server handlers, replacing the current **^15.5** line.
- **FR-002**: All **user-facing routes** and navigation that exist before upgrade MUST remain available and reachable without 404 or blank screens attributable to the upgrade.
- **FR-003**: **Offline-first** behavior MUST be preserved: local read/write without network, with background sync unchanged in product semantics.
- **FR-004**: **PWA** capabilities (install prompt / installed app launch, offline shell) MUST remain functionally equivalent for end users.
- **FR-005**: **French** MUST remain the only UI language; no missing or English-fallback strings introduced by the upgrade.
- **FR-006**: **Authentication** flows (magic link, Google, session handling) MUST behave as before upgrade.
- **FR-007**: The **automated test suite** configured for the repository MUST pass at **≥80%** coverage on logic folders per constitution, without lowering thresholds.
- **FR-008**: The **production build** MUST succeed without errors.
- **FR-009**: **CI** MUST pass all required checks currently enforced for merges to `main` (including tests, build, and migration validation).
- **FR-010**: **Dependency alignment**: React, TypeScript, ESLint, and other toolchain packages tied to the framework upgrade MUST be updated to compatible versions so FR-007–FR-009 hold.
- **FR-011**: Release notes and breaking changes for the new major version MUST be reviewed; any impact on App Router, image optimization, middleware, or default bundler behavior MUST be resolved or explicitly documented in the implementation plan (not left as silent regressions).
- **FR-012**: No **new end-user features** (list UX, bulk, catalog changes) belong in this feature; scope is limited to platform upgrade and fixes required for parity.

### Key Entities

- **Application release**: A version of Muni built and deployed on Next.js 16 with unchanged domain model and user journeys.
- **Quality gate**: The set of automated commands CI runs today (tests, build, migrations, optional e2e).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **100%** of existing automated tests that passed on Next.js 15 pass on Next.js 16 without disabling tests.
- **SC-002**: **Zero** P1 regressions in a smoke checklist covering offline open, one quick-add per list type, global search, and sign-in (manual or e2e).
- **SC-003**: Production **build** completes in CI in a time within **2×** the pre-upgrade median (no order-of-magnitude slowdown).
- **SC-004**: PWA **install and launch** succeeds on at least one mobile and one desktop browser used in project testing.
- **SC-005**: No increase in **user-visible** error rate for sync or auth in acceptance testing compared to pre-upgrade baseline.

## Assumptions

- Next.js 16 stable release is available and supported for App Router projects used by Muni.
- Breaking changes are finite and addressable within one focused upgrade effort.
- Self-hosted deployment process remains the same; only the build artifact toolchain changes.
- Feature **007** may be developed in parallel but SHOULD merge after **006** to reduce integration risk (P5).

## Out of Scope

- New list search, sort UI, bulk actions, or catalog multi-add (**007**).
- New languages, analytics, or third-party tracking.
- Infrastructure changes unrelated to the framework upgrade (e.g. new hosting vendor).
- Optional “phase 2” sort fields or server-side full-text search.
