# Feature Specification: Periodic recap (daily / weekly / monthly / yearly)

**Feature directory**: `specs/011-periodic-recap/`

**Feature Branch**: `011-periodic-recap`

**Created**: 2026-10-28

**Status**: Specified — product decisions locked **2026-10-28** (Valentin); planning and implementation pending

**Input**: Valentin wants a **read-only periodic recap** of what was done in Muni — finished books, watched films/séries, cooked recipes, completed fitness workouts, **Musique** (tracks **écoutés** plus **012** practice completions), and extensible hooks for future domains — aggregated from **existing local data** and **explicit completion events**. French UI, offline-first, celebratory companion tone aligned with [009](../009-experiences-achievements/spec.md) (**no guilt**, no social comparison). Not a separate journal unless completion is already recorded in domain data.

**Depends on**: Foundation (**001**), books (**002**), films & TV (**003**), music tracks (**004**), fitness (**008**), music practice (**012**) for composition / DJ / apprentissage recap lines, plants & garden (**013**) for **Plantes** care and potager milestones. **Recipe cooked signal** is a **prerequisite slice** (see [research.md](research.md)) — may ship in 001/010 amendment or as first task of 011 implementation. **Recommended after** fitness (**008**), **012** music-practice stores locally available, **013** plant stores (or stubbed contributor tests), and any in-flight **010** cookbook-source work are stable enough to avoid merge thrash; recap itself does not require 010 for cookbook metadata.

**Serves**: [009](../009-experiences-achievements/spec.md) north star (visibility of discovery and milestones over time) without implementing 009’s non-scheduled “fil de vie” or new experience entities.

## Clarifications

### Session 2026-10-28 (spec defaults)

| Topic | Decision |
|--------|----------|
| Data model for recap | **No new recap journal table** in MVP — compute from domain items + fitness logs (+ recipe `cookedDates` when added) |
| Shopping | **Excluded** from recap achievements |
| Music | **Single section Musique** (MVP): **004** tracks **`listened`**; **012** **`music_composition` → `finished`** (**`finishedAt`**), **`dj_set` → `performed`** (**`performedAt`**), **each non-deleted `practice_log`** bucketed by **`practicedAt`** (mark **Fait**, structured ad-hoc, **`practiceKind: improvisation`**). **Artists** excluded; **012** planned/cancelled sets and non-**Terminé** compositions excluded; **learning_piece** status alone excluded — **logs are the apprentissage recap signal**; **multiple logs same piece/week/day → multiple lines** |
| Fitness | **`completed`** workouts only; skipped / abandoned excluded |
| Tone | Celebratory, optional empty states (“Rien de marqué cette semaine — et c’est ok”) — **no** guilt, streak loss, or comparison copy |
| Notifications | **Out of scope** MVP (future optional prompt) |
| Timezone | Local calendar boundaries; default **`Europe/Paris`** until user timezone exists |

### Session 2026-10-28 (Valentin — locked)

| Topic | Decision |
|--------|----------|
| **Navigation** | **Bottom navigation** includes a dedicated **Récap** item — **primary** access to `/recap` (not home-only). Accueil may still show an optional weekly teaser card. |
| **Séries (TV)** | **One recap line per episode** in period lists (series title + episode key / French label). No weekly roll-up like “3 épisodes de …” in MVP. |
| **Recipe cooked** | **Yes** — v1 MUST allow **backdating** « cuisiné » dates (user picks a calendar day, not only today). Same-day dedupe per recipe still applies. |
| **Ordering within period** | **Grouped by domain** (Livres, Films & séries, Musique, Recettes, Entraînement, Plantes, …). Within each section, lines ordered **newest first** (by event calendar day, then title). No global cross-domain sort that breaks domain blocks. |
| **Yearly recap vs goals** | **Standalone** `/recap` experience for **all** periods (day/week/month/year). Yearly recap MUST **not** tie into or replace book/movie **year goal** screens (002/003); no required links between them. |
| **Activity tracker (heatmap)** | **GitHub-style** week-column calendar grid on **`/recap`** on **all viewports** (see User Story 7). Each day cell shows **one accent per recap domain** with activity that day (**multi-segment** cells — not a single global accent). Narrow screens use **horizontal scroll** for the grid. |
| **MVP v1 periods** | **Day, week, month, and year** — all four granularities ship in **v1** (not deferred to Phase B). Optional fitness PR highlights remain post-v1. |

### Session 2026-10-28 (Valentin — heatmap correction)

| Topic | Decision |
|--------|----------|
| **Heatmap accents** | **Multi-domain** per day — vertical micro-segments with domain accent tokens; legend + tooltip/a11y text; **not** binary single-accent MVP. |
| **Heatmap mobile (2026-10-28)** | Mount on **all** viewports; **week-column** grid (7 weekday rows, weeks as columns) with **`overflow-x` horizontal scroll** on narrow widths — no `md+`-only gate. |
| **Heatmap mobile window (2026-10-28)** | On **narrow** viewports (`< 768px`), heatmap shows **recent weeks only** — default **12 weeks** (**84 local calendar days**) ending today, **not** the full 365-day strip. **Desktop / wide** (≥ 768px) keeps **trailing 365 days** (OD-011-1). Same week-column layout; shorter horizontal scroll on mobile. |
| **Period controls (2026-10-28)** | Replace row of period **toggle buttons** with a single **`<select>`** (French: **Jour**, **Semaine**, **Mois**, **Année**); optional **Aujourd’hui** / **Hier** shortcuts when **Jour** is selected. **◀ / ▶** prev/next unchanged within granularity. See [contracts/recap-period-controls.md](contracts/recap-period-controls.md). |

### Session 2026-10-28 (Valentin — Musique in recap, 011)

| Topic | Decision |
|--------|----------|
| **Musique list section** | **One** domain block **Musique** (stable order unchanged). Lines distinguish event kind via French subtitle/template (écouté, composition terminée, set joué, séance de pratique, **improvisation**) — **no** separate recap domain per 012 workflow in MVP. **One line per eligible event**; **one line per `practice_log`** (dedupe **same log id** only). |
| **012 signals** | **Terminé** → **`finishedAt`**; **Joué** → **`performedAt`**; **Fait** / ad-hoc / **improvisation** → **one Musique line per `practice_log`**, bucketed by **`practicedAt`** ([012 data-model](../012-music-practice/data-model.md)). Contributor dedupes **same `sourcePracticeLogId`** only — **not** by calendar day, piece, or instrument. |
| **Every session counts** | A piece may span **several practice sessions** — **each** eligible log → **one** Musique line and contributes to heatmap activity that day. **`comfortable`** (or any **learning_piece** status) **without** a log → **no** line. |
| **Heatmap** | Still **one Musique segment** per calendar day if **any** eligible Musique event (004 or 012) occurred — including **any** **`practice_log`** that day; multiple logs or event types the same day do **not** add extra segments. |
| **Periods** | Four-period v1 (**day / week / month / year**) unchanged. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Weekly recap across domains (Priority: P1 — MVP Phase A)

A signed-in user opens **Récap** and sees **this week** (ISO week, Monday–Sunday) as the default period. The screen groups **achievements** by domain (Livres, Films & séries, Musique, Recettes, Entraînement, …) with a short celebratory intro and each line showing **what** happened and **when** (day within the week). Counts are visible at section level (e.g. “3 livres terminés”). All content is computed from **local store** without network.

**Why this priority**: Weekly rhythm matches companion reflection without daily noise; delivers cross-domain value 009 describes but no domain alone provides.

**Independent Test**: Seed local data with one book → `read`, one film → `watched`, one completed workout in the current ISO week; open recap — all three appear with French labels; enable airplane mode — unchanged.

**Acceptance Scenarios**:

1. **Given** a book transitioned to **`read`** with finish timestamp falling in the current week, **When** the user opens weekly recap, **Then** that book appears under **Livres** with title and day.
2. **Given** a film marked **`watched`** this week, **When** recap loads, **Then** it appears under **Films & séries**.
3. **Given** a série episode with **`watchedAt`** this week, **When** recap loads, **Then** an episode line appears (series title + episode key or equivalent French label).
4. **Given** a track with status **`listened`** this week, **When** recap loads, **Then** it appears under **Musique** (line kind **écouté**).
5. **Given** a **012** composition with status **`finished`** and **`finishedAt`** this week, **When** recap loads, **Then** it appears under **Musique** (composition terminée + date).
6. **Given** a **012** DJ set with status **`performed`** and **`performedAt`** this week, **When** recap loads, **Then** it appears under **Musique** (set joué + date).
7. **Given** a **012** **`practice_log`** with **`practicedAt`** this week (from **Fait**, structured ad-hoc, or **`practiceKind: improvisation`**), **When** recap loads, **Then** it appears under **Musique** (line kind **séance de pratique** or **improvisation** + date; optional exercise/piece/instrument in subtitle).
7b. **Given** **two** distinct **`practice_log`** rows for the **same learning piece** with **`practicedAt`** dates this week, **When** recap loads, **Then** **two** Musique lines appear (not merged to one).
7c. **Given** a **learning_piece** moved to **À l’aise** this week **without** a new **`practice_log`**, **When** recap loads, **Then** **no** apprentissage line is emitted from that status change alone.
8. **Given** a recipe with **`cookedDates`** containing a date this week, **When** recap loads, **Then** it appears under **Recettes** (one line per date entry in period).
9. **Given** a fitness workout log with status **`completed`** and **`completedAt`** this week, **When** recap loads, **Then** it appears under **Entraînement** with session title and day.
10. **Given** a **`plant_care_event`** or **vegetable milestone** with **`occurredAt`** this week ([013](../013-plants-garden/spec.md)), **When** recap loads, **Then** it appears under **Plantes** with plant or culture title and care/milestone label.
11. **Given** no qualifying events in the week, **When** recap loads, **Then** a **neutral, non-guilt** empty state appears (no “you failed” framing).

---

### User Story 2 - Monthly recap and period switcher (Priority: P1 — MVP Phase A)

The user switches period to **Ce mois-ci** and sees the same domain grouping for the **current calendar month**. A **period granularity** control (native **`<select>`**: **Jour**, **Semaine**, **Mois**, **Année** — French labels) sets the active type; **◀ / ▶** navigate **previous / next** period for that granularity so they can browse last month’s recap offline.

**Why this priority**: Monthly view supports longer reflection alongside weekly, daily, and yearly in the same v1 shell.

**Independent Test**: Fix device date or test harness to a known month; seed events on first and last day of month; both appear in monthly recap; switch to previous month — only that month’s events show.

**Acceptance Scenarios**:

1. **Given** events on different days in the current month, **When** the user selects **Mois**, **Then** achievements appear in **domain sections** (fixed domain order), each section listing lines **newest first** by event day.
2. **Given** the user chooses **période précédente**, **When** viewing monthly recap, **Then** the month label updates and content reflects that month only.
3. **Given** offline mode, **When** changing period, **Then** recap still renders from IndexedDB.

---

### User Story 3 - Bottom nav and optional home teaser (Priority: P1 — MVP Phase A)

The user opens **Récap** from the **bottom navigation** item (primary entry, same shell as 001). **Accueil** MAY show an optional compact **Récap de la semaine** card (count + highlight); tapping it opens `/recap` with weekly period selected — but recap MUST remain fully usable **without** visiting home first.

**Why this priority**: Recap is a first-class companion surface; bottom nav matches other domains and avoids burying reflection behind Accueil.

**Independent Test**: From any tab, tap bottom-nav **Récap** — weekly recap loads offline. Optional: home card deep-links to same route.

**Acceptance Scenarios**:

1. **Given** signed-in user on any main screen, **When** they tap bottom-nav **Récap**, **Then** `/recap` loads with default weekly period.
2. **Given** at least one achievement this week and home teaser enabled, **When** the user views home, **Then** the recap card shows a **positive** summary (count ≥ 1).
3. **Given** zero achievements this week and home teaser enabled, **When** the user views home, **Then** the card still invites gently (e.g. “Voir le récap”) without guilt copy.
4. **Given** home teaser absent or user never opens Accueil, **When** they use bottom-nav **Récap**, **Then** the full experience is unchanged.

---

### User Story 4 - Daily recap (Priority: P1 — MVP v1)

The user selects **Aujourd’hui** or **Hier** (or a single-day picker) to see achievements for **one calendar day** — useful for “what did I do today?” without scrolling a week.

**Why this priority**: Completes the four-period companion set in v1; sparse days still use neutral empty copy.

**Independent Test**: Seed events on two consecutive days; daily view shows only selected day.

**Acceptance Scenarios**:

1. **Given** multiple events today, **When** daily period is selected, **Then** all of today’s achievements appear.
2. **Given** no events today, **When** daily recap opens, **Then** empty state remains neutral and brief.

---

### User Story 5 - Yearly recap (Priority: P1 — MVP v1)

The user selects **Cette année** (calendar year) inside **`/recap`** only — same domain-grouped layout as other periods, with **month labels** on lines or sub-grouping when volume is high. This is a **standalone** yearly reflection screen: it MUST **not** embed, redirect to, or depend on book/movie **year goal** UIs (002/003). Domain goal screens may continue to exist independently; recap does not surface goal progress bars or quota copy.

**Why this priority**: Year boundary matters for life reflection; ships with the same aggregation core as other periods in v1.

**Independent Test**: Seed finishes in January and December of same year; yearly view in `/recap` includes both; previous year navigation works; no navigation requirement to `/books/.../goals` or movie equivalents.

**Acceptance Scenarios**:

1. **Given** achievements across the year, **When** yearly recap is selected in `/recap`, **Then** all appear in domain sections with month indication on each line (or month subheaders).
2. **Given** yearly recap, **When** shown, **Then** copy does **not** imply quotas, failed goals, or comparison to domain year-goal targets.
3. **Given** user on yearly recap, **When** browsing, **Then** they remain in `/recap` period UX — no mandatory link-out to domain year-goal screens.

---

### User Story 6 - Extensibility placeholder (Priority: P3)

The recap UI includes a **stable extension point** (e.g. empty domain sections hidden; registry hook documented in plan) so a future domain can appear without renaming the feature.

**Independent Test**: With only books seeded, only **Livres** section appears — no empty **Voyage** section.

**Acceptance Scenarios**:

1. **Given** a domain with zero events in period, **When** recap renders, **Then** that domain section is **omitted** (not an empty shaming block).

---

### User Story 7 - Activity tracker (GitHub-style heatmap) (Priority: P2 — MVP Phase A)

At the top of **`/recap`** (above period navigation), on **every viewport**, show a **calendar activity grid** (GitHub-contribution-style): one cell per **calendar day** in a visible range (**independent** of the selected list period; see OD-011-1 / OD-011-11). **Wide** viewports: trailing **365 local days** ending today. **Narrow** viewports: trailing **12 weeks** (**84 days**) ending today — recent activity only, not the full year strip. Layout: **week columns** (ISO **Monday–Sunday** rows, weeks left→right). On **narrow** viewports the grid sits in a **horizontally scrollable** region with legible cell size (no breakpoint-based unmount). Days with no recap-eligible events stay **neutral/empty**. Days with activity use **multi-domain accents** (see **Visual pattern** below). Recap lists and period controls unchanged below the heatmap.

**Visual pattern (MVP — locked 2026-10-28; **Plantes** segment added 2026-10-28)**: Each active day cell is a small square subdivided into **vertical micro-segments** (equal-width columns, left → right). One segment appears **per recap domain** that had ≥ 1 eligible event that day, in the **same stable domain order** as recap list sections (Livres → Films & séries → Musique → Recettes → Entraînement → Plantes). A segment’s fill uses that domain’s **design-system accent token** (see FR-020). A single-domain day is a **full-cell** fill in that domain’s accent (no artificial split). **No intensity scale** by event count in MVP — presence only, not volume.

**Domain → accent (normative for heatmap)** — tokens from [005](../005-design-system/spec.md) / `list-type-visual` where applicable; fitness uses the **Entraînement** accent defined in planning (005 extension or fitness shell token):

| Recap domain | Accent source |
|--------------|----------------|
| Livres | Book list-type accent |
| Films & séries | Movie list-type accent |
| Musique (004 écouté + 012 practice) | Music track list-type accent (single segment for all Musique events) |
| Recettes | Recipe list-type accent |
| Entraînement | Fitness domain accent (planning) |
| Plantes | Plants domain accent (planning — see [013](../013-plants-garden/research.md)) |

**Segment cap**: At most **6** visible segments per cell (one per in-scope recap domain through **Plantes**). **Future domains** (e.g. **012** music practice) beyond the cap MUST still appear in **tooltip and accessible name**; overflow domains MUST NOT rely on extra strip colors alone (text lists all domains). When contributor count exceeds **6**, planning MUST either raise cap or adopt overflow-only rule (OD-011-8).

**Legend & tooltip**: Heatmap MUST include a **text legend** (French domain labels + swatches) on all viewports. Each cell MUST expose a **tooltip or equivalent** on hover/focus listing active domains for that date (and optional total event count). Color MUST NOT be the only channel for which domains fired.

**Independent Test**: Seed a book finish and a workout on day D1, only a film on D2; on `/recap`, D1 shows **two** vertical segments (book + fitness accents), D2 shows one (film); on iPhone-width viewport heatmap remains mounted and scrolls horizontally; list unchanged. Screen reader: active days name **domains** explicitly, not color alone.

**Acceptance Scenarios**:

1. **Given** recap-eligible events from **one** domain on calendar day D, **When** `/recap` loads, **Then** cell D is a **single** full fill in that domain’s accent.
2. **Given** events from **two or more** recap domains on the same day D, **When** heatmap renders, **Then** cell D shows **vertical micro-segments** (one per domain present), in stable domain order, each with the correct domain accent.
3. **Given** no events on day D, **When** heatmap renders, **Then** D appears inactive (neutral).
4. **Given** a narrow viewport (< 768px), **When** `/recap` loads, **Then** heatmap is **rendered** at the top with **horizontal scroll** for the week-column grid spanning **84 days** (12 weeks), not 365 cells; weekly/monthly list UX below is unchanged.
5. **Given** an active day cell, **When** assistive tech focuses it, **Then** accessible name includes the **date** and a **text list of domains** with activity (e.g. “28 octobre 2026 — Livres, Entraînement”); optional total event count.
6. **Given** the heatmap is visible, **When** the user views the grid, **Then** a **legend** maps each accent to its French domain label.
7. **Given** user selects previous month/week in period control, **When** heatmap is visible, **Then** heatmap range stays the **fixed trailing window** for the viewport (365 days wide, 84 days narrow — OD-011-1, OD-011-11) — decoupled from list period.

**Activity day definition (normative)**: For each local calendar day, compute **`domainsPresent`**: the set of recap domains (FR-006) with **≥ 1** eligible event bucketed to that day. Day is **active** iff `domainsPresent` is non-empty. Same event sources as list aggregation (books `read`, films/séries watched, episode `watchedAt`, tracks `listened`, **012** composition **`finished`/`finishedAt`**, DJ **`performed`/`performedAt`**, **`practice_log.practicedAt`**, recipe `cookedDates` entries, fitness `completed`, plant care / vegetable milestones **`occurredAt`**). Multiple Musique event types on one day still yield **one** Musique segment.

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
- **FR-004**: **MVP v1** MUST support **daily** (single calendar day), **weekly** (ISO), **monthly**, and **yearly** (calendar year) periods with previous/next navigation for the selected granularity.
- **FR-005**: All four period types MUST use the **same aggregation rules** (FR-006, FR-016); only period boundaries and labels differ.
- **FR-006**: Recap MUST include achievements from: books **`read`**, films/séries **`watched`** and **episode `watchedAt`**, **Musique** — music tracks **`listened`**; **`music_composition`** with status **`finished`** bucketed by **`finishedAt`**; **`dj_set`** with status **`performed`** bucketed by **`performedAt`**; each non-deleted **`practice_log`** (incl. **`practiceKind: improvisation`**) bucketed by **`practicedAt`** — **one achievement per log** ([012](../012-music-practice/spec.md)); recipes with **`cookedDates`** in period; fitness workouts **`completed`**; **plant care events** and **vegetable milestones** with **`occurredAt`** in period ([013](../013-plants-garden/research.md) § Recap signals).
- **FR-007**: Recap MUST **exclude** shopping check-offs, music **artist-only** rows, **012** non-**Terminé** compositions, **Prévu**/**Annulé** DJ sets, **`practice_plan`** assignments without a **`practice_log`**, **learning_piece** status changes without a log date, fitness **skipped/abandoned** sessions, and quote creation events.
- **FR-008**: Each achievement line MUST show at minimum **domain**, **title** (or session title), and **calendar date** within the selected period.
- **FR-009**: Section headers MUST use celebratory/neutral French copy; MUST NOT use guilt, loss, or social comparison language (009 anti-patterns).
- **FR-010**: Bottom navigation MUST include a **Récap** item routing to **`/recap`**. Accueil MAY show an optional weekly summary card linking to `/recap`; bottom nav remains the primary entry.
- **FR-011**: Period boundaries MUST use the user’s **local timezone** (default Europe/Paris until a global preference exists).
- **FR-012**: Recipe **`cookedDates`** MUST be populated only by an **explicit user action** (see research); user MUST be able to record a cook on **today or a past calendar day** (backdating) in v1; recap MUST NOT infer cooks from edits to ingredients or steps.
- **FR-013**: Implementation MUST structure aggregation so **new domains** can register without changing recap route identity (extensibility).
- **FR-014**: Recap MUST respect **soft delete**: achievements tied to soft-deleted sources do not appear.
- **FR-015**: Optional **post-v1**: highlight **fitness personal records** logged in period as a subsection under **Entraînement** (non-blocking badges).
- **FR-016**: Within a selected period, recap MUST render achievements **grouped by domain** in a stable domain order; within each domain section, lines MUST sort **newest event day first** (then title).
- **FR-017**: Séries MUST emit **one recap line per episode** with `watchedAt` in period (no episode roll-up in MVP).
- **FR-018**: Yearly (and all) period views MUST live entirely in **`/recap`** UX without requiring navigation to domain year-goal screens.
- **FR-019**: On **all** viewports, **`/recap`** MUST show an **activity heatmap** at the top per User Story 7 whenever recap snapshot data is loaded; on narrow viewports the grid MUST use **week columns** with **horizontal scroll** and a **84-day** trailing window (OD-011-11); on wide viewports **365-day** window (OD-011-1). No breakpoint-based unmount.
- **FR-020**: Heatmap cells MUST encode **which recap domains** had activity each day using **vertical micro-segments** (MVP pattern in User Story 7): one segment per domain present, **stable domain order**, each segment filled with that domain’s **design-system accent token** (Livres, Films & séries, Musique, Recettes, Entraînement, Plantes — see User Story 7 table). Single-domain days MAY use a full-cell fill. Inactive days stay neutral. **No** event-count intensity scale in MVP. At most **6** segment colors per cell for current in-scope domains; additional domains MUST appear in tooltip and accessible name. A **French text legend** and per-cell domain listing MUST satisfy accessibility — **not color alone**.
- **FR-021**: Period granularity MUST be chosen via a single **`<select>`** with French options **Jour**, **Semaine**, **Mois**, **Année** (not a row of toggle buttons). Prev/next chevrons MUST navigate within the selected granularity. Optional **Aujourd’hui** / **Hier** shortcuts MAY appear when **Jour** is selected. See [contracts/recap-period-controls.md](contracts/recap-period-controls.md).

### Key Entities *(conceptual — mostly derived)*

- **RecapPeriod**: `{ granularity: week \| month \| day \| year, anchorDate }` — selection state in UI, not persisted server-side in MVP.
- **RecapAchievement** (derived view model): `{ domainId, occurredOn, title, subtitle?, musicLineKind?, sourceItemId?, sourceWorkoutId?, sourceCompositionId?, sourceDjSetId?, sourcePracticeLogId?, sortInstant }` — built at read time. **`musicLineKind`** (when `domainId` is Musique): `listened` \| `composition_finished` \| `dj_performed` \| `practice_session` \| `practice_improvisation`.
- **DomainRecapContributor** (conceptual registry): maps domain to rules for extracting `RecapAchievement[]` from local stores.
- **Recipe item extension**: **`cookedDates`**: `string[]` ISO dates on recipe items (see [research.md](research.md)).
- **RecapActivityDay** (derived): `{ calendarDate, eventCount, domainsPresent: DomainId[], isActive }` — for heatmap; `domainsPresent` ordered per FR-016 domain order; `isActive := domainsPresent.length ≥ 1`; `eventCount` optional for tooltip/a11y.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With **50 seeded achievements** in one month, recap screen becomes interactive (scrollable content visible) within **2 seconds** on a mid-tier mobile device offline.
- **SC-002**: **100%** of acceptance scenarios for User Stories 1–5 and 7 pass in automated tests (unit tests for aggregation + Playwright paths for `/recap` weekly view offline, day/year period switch, + heatmap visible at desktop and narrow widths).
- **SC-003**: In a **no-guilt copy review**, all recap empty states and home card strings pass checklist: no streak loss, no “falling behind”, no mandatory journaling implied (aligned with 009).
- **SC-004**: Users can switch week ↔ month and previous/next period in **≤ 3 taps** from `/recap`.
- **SC-005**: After completing one eligible domain action (e.g. mark book read), the weekly recap count on home updates **without reload** when returning to home (same session).

## Assumptions

- User timezone preference will eventually centralize; until then **Europe/Paris** matches 002/003 insights.
- **`cookedDates`** on recipes is acceptable as a small 001 data-model extension (or bundled with first 011 implementation PR); v1 includes **backdated** cook dates.
- Domain year goals and domain-specific activity heatmaps on book/movie screens **remain independent**; `/recap` yearly view is **standalone** and does not replace or link-require those screens.
- Fitness **008** workout logs are synced and available locally before fitness lines appear in recap.
- **012** music-practice entities are synced and available locally before composition / DJ / practice-log lines appear in recap; track **listened** lines still use **004** `items` only.
- **Plants 013** care events and vegetable milestones are available locally before **Plantes** lines appear; **`plants-contributor`** MAY ship in 011 before 013 UI if fixtures/tests cover event shape.
- Recap **activity heatmap** on `/recap` uses a **shorter trailing window on narrow viewports** (12 weeks) and **365 days on wide**; both scroll horizontally when needed rather than hiding the grid.

## Out of Scope (MVP)

- Push notifications or email “your week in review”
- Sharing recap externally or social feeds
- Unified **fil de vie** timeline with arbitrary filtering (009 future direction)
- Editing achievements or manual “life moment” entries not tied to domain completion
- Shopping, artist-only music rows, **012** session notes / setlist edits without status dates, reading **activity** days that are not **finished read**
- Heatmap **intensity scale** by event count (presence-only in MVP)
- Server-side pre-aggregation tables or new sync entities for recap alone
- AI-generated narrative summaries

## Phased delivery summary

| Phase | Periods | Entry | Recipe signal | Activity grid |
|-------|---------|-------|---------------|-----------------|
| **A (MVP v1)** | **Day + week + month + year** | Bottom-nav **Récap** + optional home teaser | **`cookedDates`** + UI (today **or backdated**) | **`/recap`** heatmap all viewports (**week-column grid**, multi-domain segments + legend; **84d** narrow / **365d** wide scroll) |
| **B (optional)** | PR highlights, richer yearly layout | Same | — | Optional event-count intensity or range tweaks |

**Justification**: All four periods ship together in v1 so `/recap` is a complete companion reflection surface (009 visibility) while copy stays **optional and non-guilt** (constitution capture speed). Yearly recap stays **standalone** in `/recap` (domain year goals unchanged elsewhere). Fitness PR highlights may follow in Phase B.

## UX sketch (informational)

```
Bottom nav: … | Accueil | … | Récap | …

Desktop /recap (wide)                Mobile /recap (narrow)
┌──────────────────────────┐         ┌──────────────────────────┐
│ Récap                    │         │ Récap                    │
│ [▮▮|▮□▮▮|□ week cols …]  │         │ ◀ scroll ▶ [▮|▮□|…]     │
│ (multi-domain day cells) │         │ (same grid, horiz. scroll)│
│ [Semaine ▾ select] ◀ … ▶ │         │ [Semaine ▾] ◀ … ▶       │
│                          │         │                          │
│ Livres (2)               │         │ Livres (2)               │
│  · Le Petit Prince — lun.│         │  · Le Petit Prince — lun.│
│ Films & séries (1)       │         │ Films & séries (1)       │
│  · S1E3 — Série X — mar. │         │  · S1E3 — Série X — mar. │
│ Entraînement (2)         │         │ Entraînement (2)         │
└──────────────────────────┘         └──────────────────────────┘

Optional Accueil teaser card → same `/recap` route (weekly default).
```

## Resolved product questions (2026-10-28)

All former open questions are locked in **Clarifications → Session 2026-10-28 (Valentin)** and User Stories 3, 5, 7.
