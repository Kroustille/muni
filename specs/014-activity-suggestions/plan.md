# Implementation Plan: Activity suggestions (forward-looking companion nudges)

**Branch**: `014-activity-suggestions` (work on `main`) | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-activity-suggestions/spec.md`

**Depends on**: **001** foundation (Accueil `/`, offline IndexedDB, French i18n). Domain **local stores** from **002–004**, **008**, recipes + optional **010**, **012**, **013** — contributors **stub gracefully** when stores missing (FR-013). **011** **`cookedDates`** improves recipe staleness; **011 `/recap`** hosts optional **teaser only** (no shared aggregation table). Serves [009](../009-experiences-achievements/spec.md) — no new global Experience entity.

**Task band**: **T1401–T1448** (see [tasks.md](tasks.md)).

**Product context**: **Exactly two** deterministic, dismissible **forward** nudges per local calendar day (default **`Europe/Paris`**), computed on **first Accueil visit** after local midnight, stable until next day; **multi-domain** selection when pool allows; **no guilt** copy; **no** shopping; **no** server sync for snapshot/dismiss in MVP.

## Summary

Ship a read-only **suggestions pipeline**: per-domain **`listStaleCandidates`** contributors (mirror 011 recap registry, inverted semantics) → merge/score/sort → pick **S1/S2** with domain-diversity tie-break → persist **daily snapshot** + **dismiss records** in **IndexedDB only** → render **Accueil** companion card and optional **`/recap`** teaser linking home. Deep links reuse existing domain routes. Deterministic v1 — **no AI** (Constitution IV).

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥22, Next.js 16+ (per 006 on `main`)

**Primary Dependencies**: Existing hexagonal stack; contributor pattern from [011 recap aggregation](../011-periodic-recap/contracts/recap-aggregation-service.md); staleness rules in [research.md](research.md); item repos + fitness + music-practice + plants ports as they land

**Storage**:
- **No Postgres tables** for MVP (FR-009, spec Out of Scope) — snapshot + dismiss are **client-only**
- New IndexedDB object stores: `activity_suggestion_snapshot`, `activity_suggestion_dismiss` (see [data-model.md](data-model.md), [contracts/suggestions-local-store.md](contracts/suggestions-local-store.md))
- Reads domain data from existing stores only

**Testing**: Vitest for selection algorithm, per-domain contributor fixtures, dismiss/snapshot idempotency, guilt lexicon string audit; Playwright e2e per [quickstart.md](quickstart.md); `yarn verify:ci` gate

**Target Platform**: PWA mobile-first; Accueil `/` and `/recap` teaser

**Constraints**: Offline-first (FR-001); exactly two when ≥2 candidates (FR-002); no backfill after dismiss (FR-012); no recap lines (FR-011); no streak reads from 008 assiduity (spec edge case); French i18n only; primary copy hides raw day counts (research global rules)

**Scale/Scope**: O(n) over ≤ few thousand items; P1 US1–US2; P2 US3–US4; optional P2 snooze out of scope

## Constitution Check

*GATE: Pass before Phase 0. Re-check after Phase 1.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-first | Pass | Compute + dismiss local; no network for display |
| II. Capture speed | Pass | Read-only; no new capture flows |
| III. Typed lists | Pass | Reuses per-domain items; no generic suggestion type in backend |
| IV. Simplicity | Pass | Deterministic scoring; no LLM; local-only metadata |
| V. Privacy | Pass | Dismiss/snapshot not synced MVP; no analytics |
| VI. Portable backend | Pass | No server schema change |
| VII. Hexagonal | Pass | Domain `SuggestionCandidate`; use case `buildDailySuggestions`; UI in components |

**Post-design**: Contributor registry parallels 011 but **separate module** — avoids coupling recap achievements to backlog logic (research alignment table).

## Project Structure

### Documentation (this feature)

```text
specs/014-activity-suggestions/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
├── contracts/
│   ├── suggestions-selection-service.md
│   ├── domain-stale-contributors.md
│   ├── suggestions-local-store.md
│   ├── accueil-suggestions-ui.md
│   ├── recap-suggestions-teaser.md
│   └── suggestion-deep-links.md
└── tasks.md
```

### Source Code (touch map — implementation, not in this planning commit)

```text
src/domain/activity-suggestion.ts          # Candidate, Snapshot, Dismiss types
src/application/suggestions/
  build-daily-suggestions.ts               # orchestrator
  contributors/*.ts                        # per-domain listStaleCandidates
  contributors/index.ts                    # registry
src/application/ports/activity-suggestion-store.ts
src/adapters/indexeddb/activity-suggestion-store.ts
src/components/home/activity-suggestions-card.tsx
src/components/recap/suggestions-teaser.tsx
src/app/(app)/page.tsx                     # Accueil — mount card
src/app/(app)/recap/page.tsx               # teaser when 011 route exists
src/i18n/fr.json                           # suggestions.* keys
tests/unit/suggestions/
  selection-algorithm.test.ts
  *-contributor.test.ts
  guilt-lexicon.test.ts
tests/e2e/activity-suggestions.spec.ts
```

**Structure Decision**: Application **`suggestions/`** sibling to **`recap/`** — shared deps on repositories, **no** import from recap contributors (FR-011).

## Phased implementation outline (recommended ship order)

| Ship batch | Workflows | User stories | Outcome |
|------------|-----------|--------------|---------|
| **1 — Foundation** | Types, store, algorithm | — | Domain types, IndexedDB store, selection tests green |
| **2 — Contributors (incremental)** | Stale scanners | — | Books + recipes first; then movies, tracks, fitness, 012, 013 as available |
| **3 — Accueil card** | Home UI | US1 | Two suggestions, daily snapshot, empty states |
| **4 — Dismiss** | Opt-out | US2 | Per-row dismiss, no backfill, block dismiss optional |
| **5 — Diversity + links** | Scoring polish | US3 | Cross-domain pick + deep links |
| **6 — Récap teaser** | Cross-surface | US4 | Single line when ≥1 suggestion today |
| **7 — Polish** | Quality | — | Guilt lexicon audit, offline e2e, contributor coverage |

## Open decisions (plan defaults — spec open questions)

| ID | Topic | Plan default (implement unless Valentin changes spec) |
|----|--------|--------------------------------------------------------|
| OD-014-1 | Refresh cadence | **First Accueil visit per local calendar day** (`Europe/Paris`); idempotent if revisit same day |
| OD-014-2 | Default visibility | Accueil card **on by default**; entire block dismissible for the day (not permanent hide — P2) |
| OD-014-3 | Domain diversity | When ≥2 domains qualify, **prefer S2 from different domain** if any candidate within **7** score days of S1; else allow same domain (research step 4) |
| OD-014-4 | Récap link target | Navigate to **`/`** with hash **`#activity-suggestions`** (Accueil scroll anchor) |
| OD-014-5 | Dismiss storage | Per **snapshot slot id** + calendar day; keyed dismiss excludes candidate from display but does not re-run pick |
| OD-014-6 | Block dismiss | Optional **×** on card header hides **whole block for today** (stored as `blockDismissed` on snapshot row) |
| OD-014-7 | Fitness cap | At most **one** fitness-derived candidate in sorted pool before pick (research note) |
| OD-014-8 | Contributor order | Registry: `books`, `movies`, `musicTracks`, `recipes`, `fitness`, `musicPractice`, `plants` — tie-break priority in research |

## Complexity Tracking

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| Separate contributor registry from recap | Inverted semantics (staleness vs completion) | Reusing recap collectors would wrong-sign candidates and violate FR-011 |
| Daily snapshot persistence | Stable pair same day (US1) | Recompute on every render causes flicker and breaks dismiss |
| IndexedDB dismiss store | FR-006–FR-007 without server | In-memory only loses dismiss on refresh |
