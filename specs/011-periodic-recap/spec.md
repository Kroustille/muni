# Feature Specification: Periodic recap (daily / weekly / monthly / yearly)

**Feature directory**: `specs/011-periodic-recap/`

**Feature Branch**: `011-periodic-recap`

**Created**: 2026-10-28

**Status**: Draft (specified; planning and implementation pending)

**Input**: Valentin wants a **read-only periodic recap** of what was done in Muni — finished books, watched films/séries, cooked recipes, completed fitness workouts, listened tracks, and extensible hooks for future domains — aggregated from **existing local data** and **explicit completion events**. French UI, offline-first, celebratory companion tone aligned with [009](../009-experiences-achievements/spec.md) (**no guilt**, no social comparison). Not a separate journal unless completion is already recorded in domain data.

**Depends on**: Foundation (**001**), books (**002**), films & TV (**003**), music tracks (**004**), fitness (**008**). **Recipe cooked signal** is a **prerequisite slice** (see [research.md](research.md)) — may ship in 001/010 amendment or as first task of 011 implementation. **Recommended after** fitness (**008**) and any in-flight **010** cookbook-source work are stable enough to avoid merge thrash; recap itself does not require 010 for cookbook metadata.

**Serves**: [009](../009-experiences-achievements/spec.md) north star (visibility of discovery and milestones over time) without implementing 009’s non-scheduled “fil de vie” or new experience entities.

## Clarifications

### Session 2026-10-28 (spec defaults)

| Topic | Decision |
|--------|----------|
| Data model for recap | **No new recap journal table** in MVP — compute from domain items + fitness logs (+ recipe `cookedDates` when added) |
| Shopping | **Excluded** from recap achievements |
| Music | **Tracks** with `listened` included; **artists** excluded (no finish status) |
| Fitness | **`completed`** workouts only; skipped / abandoned excluded |
| Tone | Celebratory, optional empty states (“Rien de marqué cette semaine — et c’est ok”) — **no** guilt, streak loss, or comparison copy |
| Notifications | **Out of scope** MVP (future optional prompt) |
| Timezone | Local calendar boundaries; default **`Europe/Paris`** until user timezone exists |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Weekly recap across domains (Priority: P1 — MVP Phase A)

A signed-in user opens **Récap** and sees **this week** (ISO week, Monday–Sunday) as the default period. The screen groups **achievements** by domain (Livres, Films & séries, Musique, Recettes, Entraînement, …) with a short celebratory intro and each line showing **what** happened and **when** (day within the week). Counts are visible at section level (e.g. “3 livres terminés”). All content is computed from **local store** without network.

**Why this priority**: Weekly rhythm matches companion reflection without daily noise; delivers cross-domain value 009 describes but no domain alone provides.

**Independent Test**: Seed local data with one book → `read`, one film → `watched`, one completed workout in the current ISO week; open recap — all three appear with French labels; enable airplane mode — unchanged.

**Acceptance Scenarios**:

1. **Given** a book transitioned to **`read`** with finish timestamp falling in the current week, **When** the user opens weekly recap, **Then** that book appears under **Livres** with title and day.
2. **Given** a film marked **`watched`** this week, **When** recap loads, **Then** it appears under **Films & séries**.
3. **Given** a série episode with **`watchedAt`** this week, **When** recap loads, **Then** an episode line appears (series title + episode key or equivalent French label).
4. **Given** a track with status **`listened`** this week, **When** recap loads, **Then** it appears under **Musique**.
5. **Given** a recipe with **`cookedDates`** containing a date this week, **When** recap loads, **Then** it appears under **Recettes** (one line per date entry in period).
6. **Given** a fitness workout log with status **`completed`** and **`completedAt`** this week, **When** recap loads, **Then** it appears under **Entraînement** with session title and day.
7. **Given** no qualifying events in the week, **When** recap loads, **Then** a **neutral, non-guilt** empty state appears (no “you failed” framing).

---

### User Story 2 - Monthly recap and period switcher (Priority: P1 — MVP Phase A)

The user switches period to **Ce mois-ci** and sees the same domain grouping for the **current calendar month**. A **period control** (tabs or select) offers at least **Semaine** and **Mois**; navigation to **previous / next** period for the selected granularity is available so they can browse last month’s recap offline.

**Why this priority**: Monthly view supports longer reflection; paired with weekly in Phase A covers most companion use cases before daily/yearly.

**Independent Test**: Fix device date or test harness to a known month; seed events on first and last day of month; both appear in monthly recap; switch to previous month — only that month’s events show.

**Acceptance Scenarios**:

1. **Given** events on different days in the current month, **When** the user selects **Mois**, **Then** all appear ordered by date (newest first within section or global — **default: newest first globally** with domain subheaders).
2. **Given** the user chooses **période précédente**, **When** viewing monthly recap, **Then** the month label updates and content reflects that month only.
3. **Given** offline mode, **When** changing period, **Then** recap still renders from IndexedDB.

---

### User Story 3 - Entry from home and dedicated route (Priority: P1 — MVP Phase A)

The user discovers recap from **Accueil** via a compact **Récap de la semaine** card (summary: total achievements count + one highlight line or domain icons) and from navigation to **`/recap`** (French shell, bottom nav consistent with 001). Tapping the home card opens `/recap` with weekly period selected.

**Why this priority**: Without discovery, recap is dead; home teaser matches 009’s “visibility over time” without a new primary module name.

**Independent Test**: Complete one achievement; home card shows non-zero count; tap opens full recap.

**Acceptance Scenarios**:

1. **Given** at least one achievement this week, **When** the user views home, **Then** the recap card shows a **positive** summary (count ≥ 1).
2. **Given** zero achievements this week, **When** the user views home, **Then** the card still invites gently (e.g. “Voir le récap”) without guilt copy.
3. **Given** any screen, **When** the user navigates to **Récap**, **Then** `/recap` loads the full experience.

---

### User Story 4 - Daily recap (Priority: P2 — MVP Phase B)

The user selects **Aujourd’hui** or **Hier** (or a single-day picker) to see achievements for **one calendar day** — useful for “what did I do today?” without scrolling a week.

**Why this priority**: Higher churn and sparse days; valuable after weekly/monthly ship.

**Independent Test**: Seed events on two consecutive days; daily view shows only selected day.

**Acceptance Scenarios**:

1. **Given** multiple events today, **When** daily period is selected, **Then** all of today’s achievements appear.
2. **Given** no events today, **When** daily recap opens, **Then** empty state remains neutral and brief.

---

### User Story 5 - Yearly recap (Priority: P2 — MVP Phase B)

The user selects **Cette année** (calendar year) to see aggregated achievements — similar sections, with **month sub-grouping** or month labels when volume is high. This complements but does **not** replace book/movie **year goals** screens in 002/003.

**Why this priority**: Year boundary matters for life reflection; heavier UI and overlap with domain year-in-review → after weekly/monthly proven.

**Independent Test**: Seed finishes in January and December of same year; yearly view includes both; previous year navigation works.

**Acceptance Scenarios**:

1. **Given** achievements across the year, **When** yearly recap is selected, **Then** all are listed with month indication.
2. **Given** yearly recap, **When** shown, **Then** copy does **not** imply quotas or failed goals.

---

### User Story 6 - Extensibility placeholder (Priority: P3)

The recap UI includes a **stable extension point** (e.g. empty domain sections hidden; registry hook documented in plan) so a future domain can appear without renaming the feature.

**Independent Test**: With only books seeded, only **Livres** section appears — no empty **Voyage** section.

**Acceptance Scenarios**:

1. **Given** a domain with zero events in period, **When** recap renders, **Then** that domain section is **omitted** (not an empty shaming block).

---

### Edge Cases

- **Timezone change**: Events bucketed by timestamp rules in [research.md](research.md); ambiguous historical rows use stored local date fields (`watchedAt`, `calendarDate`, `cookedDates`) where available.
- **Soft-deleted items**: Achievements from items later soft-deleted **remain visible** in historical recap for honesty, or **hide** if deleted before recap view — **default: show if event timestamp predates delete and item still in store with deletedAt** → **hide from recap once soft-deleted** (user undone finish removes from recap).
- **Backdated `watchedAt` / manual date on cook**: If user sets `watchedAt` in the past, recap attributes to that **calendar day** (003 allows edit).
- **Same book marked read twice**: Only **transitions into `read`** count; re-saving read does not duplicate if status unchanged.
- **Large months**: Recap remains scrollable; target **500 events per period** without unacceptable delay (see success criteria).
- **Fitness `completedAt` null**: Fall back to **`calendarDate`** for bucketing.
- **Duplicate same-day cook tap**: Same-day dedupe on `cookedDates` per research — one entry per recipe per day.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a **Récap** experience reachable at **`/recap`** with French UI strings via i18n.
- **FR-002**: Recap MUST be **read-only** — no editing domain items from recap rows in MVP (optional deep link to item detail allowed).
- **FR-003**: Recap MUST compute from **local on-device data** (IndexedDB and local fitness stores) without requiring network.
- **FR-004**: **Phase A (MVP)** MUST support **weekly** (ISO) and **monthly** periods with previous/next navigation.
- **FR-005**: **Phase B** MUST add **daily** (single calendar day) and **yearly** (calendar year) periods using the same aggregation rules.
- **FR-006**: Recap MUST include achievements from: books **`read`**, films/séries **`watched`** and **episode `watchedAt`**, music tracks **`listened`**, recipes with **`cookedDates`** in period, fitness workouts **`completed`**.
- **FR-007**: Recap MUST **exclude** shopping check-offs, music **artist-only** rows, fitness **skipped/abandoned** sessions, and quote creation events.
- **FR-008**: Each achievement line MUST show at minimum **domain**, **title** (or session title), and **calendar date** within the selected period.
- **FR-009**: Section headers MUST use celebratory/neutral French copy; MUST NOT use guilt, loss, or social comparison language (009 anti-patterns).
- **FR-010**: Home MUST show a **weekly summary card** linking to `/recap` as in User Story 3.
- **FR-011**: Period boundaries MUST use the user’s **local timezone** (default Europe/Paris until a global preference exists).
- **FR-012**: Recipe **`cookedDates`** MUST be populated only by an **explicit user action** (see research); recap MUST NOT infer cooks from edits to ingredients or steps.
- **FR-013**: Implementation MUST structure aggregation so **new domains** can register without changing recap route identity (extensibility).
- **FR-014**: Recap MUST respect **soft delete**: achievements tied to soft-deleted sources do not appear.
- **FR-015**: Optional **Phase B**: highlight **fitness personal records** logged in period as a subsection under **Entraînement** (non-blocking badges).

### Key Entities *(conceptual — mostly derived)*

- **RecapPeriod**: `{ granularity: week \| month \| day \| year, anchorDate }` — selection state in UI, not persisted server-side in MVP.
- **RecapAchievement** (derived view model): `{ domainId, occurredOn, title, subtitle?, sourceItemId?, sourceWorkoutId?, sortInstant }` — built at read time.
- **DomainRecapContributor** (conceptual registry): maps domain to rules for extracting `RecapAchievement[]` from local stores.
- **Recipe item extension**: **`cookedDates`**: `string[]` ISO dates on recipe items (see [research.md](research.md)).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With **50 seeded achievements** in one month, recap screen becomes interactive (scrollable content visible) within **2 seconds** on a mid-tier mobile device offline.
- **SC-002**: **100%** of acceptance scenarios for User Stories 1–3 pass in automated tests (unit tests for aggregation + one Playwright path for `/recap` weekly view offline).
- **SC-003**: In a **no-guilt copy review**, all recap empty states and home card strings pass checklist: no streak loss, no “falling behind”, no mandatory journaling implied (aligned with 009).
- **SC-004**: Users can switch week ↔ month and previous/next period in **≤ 3 taps** from `/recap`.
- **SC-005**: After completing one eligible domain action (e.g. mark book read), the weekly recap count on home updates **without reload** when returning to home (same session).

## Assumptions

- User timezone preference will eventually centralize; until then **Europe/Paris** matches 002/003 insights.
- **`cookedDates`** on recipes is acceptable as a small 001 data-model extension (or bundled with first 011 implementation PR).
- Domain year goals and heatmaps remain on book/movie screens; recap does not delete or hide them.
- Fitness **008** workout logs are synced and available locally before fitness lines appear in recap.
- Valentin’s **no PR** workflow does not change spec content.

## Out of Scope (MVP)

- Push notifications or email “your week in review”
- Sharing recap externally or social feeds
- Unified **fil de vie** timeline with arbitrary filtering (009 future direction)
- Editing achievements or manual “life moment” entries not tied to domain completion
- Shopping, artist-only music rows, reading **activity** days that are not **finished read**
- Server-side pre-aggregation tables or new sync entities for recap alone
- AI-generated narrative summaries

## Phased delivery summary

| Phase | Periods | Entry | Recipe signal |
|-------|---------|-------|----------------|
| **A (MVP)** | Week + month | Home card + `/recap` | Ship **`cookedDates`** + UI action if not already present |
| **B** | Day + year | Same | Same |
| **C (optional)** | PR highlights, richer yearly layout | Same | — |

**Justification**: Week + month first balances **009 visibility** with **constitution capture speed** (no new daily obligation). Daily and yearly add precision and long arc once aggregation is proven; yearly overlaps domain insights, so it follows second.

## UX sketch (informational)

```
Accueil                          /recap
┌─────────────────────┐          ┌──────────────────────────┐
│ … list cards …      │          │ Récap    [Semaine ▼]     │
│ ┌─────────────────┐ │          │ ◀ Semaine du 28 oct. ▶   │
│ │ Récap semaine   │ │  ──────► │                          │
│ │ 5 moments · …   │ │          │ Livres (2)               │
│ └─────────────────┘ │          │  · Le Petit Prince — lun.│
└─────────────────────┘          │ Films & séries (1)       │
                                 │ Entraînement (2)         │
                                 │ …                        │
                                 └──────────────────────────┘
```

Bottom navigation: add **Récap** item or place under **Accueil** only for MVP — **default: dedicated nav item** if nav capacity allows; otherwise home card + overflow link (planning decision).

## Open questions (product — max 5 for prioritization)

1. **Navigation**: Dedicated bottom-nav **Récap** vs home-only entry until usage is proven?
2. **Série episodes**: Show **each episode** as its own line vs roll up “3 épisodes de …” per week?
3. **Recipe backdating**: Allow choosing a cook date other than today in v1 of `cookedDates`?
4. **Ordering**: Global newest-first vs strict domain blocks with oldest-first within block?
5. **Yearly overlap**: Should yearly recap **link** to book/movie year goal screens or stay fully self-contained?
