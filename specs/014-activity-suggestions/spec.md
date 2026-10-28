# Feature Specification: Activity suggestions (forward-looking companion nudges)

**Feature directory**: `specs/014-activity-suggestions/`

**Feature Branch**: `014-activity-suggestions`

**Created**: 2026-10-28

**Status**: Specified — defaults documented; **3 product open questions** for Valentin (see [Open questions](#open-questions-product))

**Input**: Valentin wants the app to **propose two activities** the user **has not done in quite some time**, to gently nudge **new or resumed experiences** aligned with [009](../009-experiences-achievements/spec.md) north star. Tone: **companion, not guilt** — optional, dismissible, no streak shame. French UI, **offline-first** (derive from local domain data only). **Not** the same as [011](../011-periodic-recap/spec.md) periodic recap (recap = **what happened**; this feature = **what you might enjoy doing next**).

**Depends on**: Foundation (**001**), libraries (**002–004**), fitness (**008**), recipes (001 + **010** metadata optional), music practice (**012**), plants (**013**). Suggestions **degrade gracefully**: domains without local data or not yet implemented simply do not contribute candidates.

**Serves**: [009](../009-experiences-achievements/spec.md) — subjective novelty and companion framing — via a **small, forward-looking** surface without new global entities, social feeds, or mandatory journaling.

## Clarifications

### Session 2026-10-28 (spec defaults — pending Valentin on cadence & placement)

| Topic | Default in this spec |
|--------|----------------------|
| **Count** | **Exactly two** suggestions whenever the feature refreshes |
| **Refresh cadence** | **Once per local calendar day** on **first visit to Accueil** after local midnight (timezone: **`Europe/Paris`** until a global preference exists — same as 011) — **not** on every cold app open (see Open questions) |
| **Persistence of picks** | Same two suggestions **stable for the rest of that calendar day** unless user **dismisses** one (see FR-012) |
| **Primary surface** | **Accueil card** — optional companion block below existing home content (not replacing lists) |
| **Secondary surface** | **Teaser line** on **`/recap`** header or above period switcher: “Deux idées pour plus tard →” linking to Accueil anchor or expanded sheet — **informational only**, no duplicate algorithm |
| **Tone & copy** | Invitational French (“Et si…”, “Tu n’as pas … depuis un moment”) — **never** days-since counters in primary copy, **never** “tu es en retard”, broken chains, or streak loss |
| **Shopping** | **Excluded** from candidate pool (errands, not experience nudges — parity with 011) |
| **Snooze / hide** | **P2** — explicit snooze per suggestion type or item (see Out of Scope P1) |
| **Relation to 011** | Recap **must not** be the only entry; suggestions **must not** appear inside recap period lists as fake “achievements” |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Two gentle ideas on Accueil (Priority: P1)

A signed-in user opens **Accueil** on a day when suggestions refresh. They see **exactly two** cards (or list rows) with a short companion intro (e.g. “Deux idées pour te remettre en route — sans obligation”). Each line names **one concrete activity** drawn from their data (book title, film, recipe, workout day, practice exercise, plant to water, …) and offers **one primary action** (open detail, start flow, mark done where domain already supports it). They can **ignore** the block without consequence.

**Why this priority**: Delivers 009-aligned forward nudges with minimal UI; value even if only books + recipes exist locally.

**Independent Test**: Seed one **`to_read`** book untouched for 60+ days and one recipe never **`cookedDates`**; open Accueil on a new local day — two suggestions appear with French labels; airplane mode — unchanged.

**Acceptance Scenarios**:

1. **Given** at least two eligible stale candidates across domains, **When** Accueil loads on the first visit of a local calendar day, **Then** **exactly two** suggestions appear (not zero, not three).
2. **Given** suggestions were computed today, **When** the user leaves Accueil and returns same day, **Then** the **same two** suggestions appear (stable daily snapshot).
3. **Given** only one eligible candidate exists, **When** Accueil refreshes, **Then** **one** suggestion appears and the block explains neutrally that there is nothing else for now (no guilt).
4. **Given** zero eligible candidates, **When** Accueil loads, **Then** the suggestions block is **hidden** or shows a **neutral empty** (“Rien à proposer pour l’instant — c’est ok”).
5. **Given** offline mode, **When** suggestions render, **Then** content matches local store only.

---

### User Story 2 - Dismiss without shame (Priority: P1)

The user dismisses **one** suggestion (swipe, “Pas maintenant”, or equivalent). That slot **does not reappear until the next local calendar day**; the other suggestion remains. Dismissal is **private** and **not** framed as failure.

**Why this priority**: Optional companion requires easy opt-out without dark patterns.

**Independent Test**: Dismiss one of two suggestions; navigate away and back — dismissed item stays gone today; second item still visible; next day (test harness date) — new pair may appear.

**Acceptance Scenarios**:

1. **Given** two visible suggestions, **When** the user dismisses suggestion A, **Then** only suggestion B remains for today.
2. **Given** suggestion A dismissed today, **When** the user refreshes Accueil, **Then** suggestion A does **not** return until the next local day.
3. **Given** dismissal, **When** UI copy is shown, **Then** it contains **no** streak, penalty, or “you skipped your chance” language.

---

### User Story 3 - Domain diversity and deep link (Priority: P2)

When the pool has candidates in **multiple domains**, the two daily suggestions **prefer different domains** (e.g. one cultural backlog item + one embodied/care item) so the nudge feels like **breadth of life**, not two similar rows.

**Why this priority**: Aligns with 009 “full life” story; avoids “two books” fatigue when fitness or plants also qualify.

**Independent Test**: Seed stale **`to_read`**, stale **`to_listen`**, and stale recipe; verify algorithm picks two from **at least two domains** when possible.

**Acceptance Scenarios**:

1. **Given** stale candidates in books and recipes, **When** suggestions are chosen, **Then** one suggestion is from books and one from recipes (not two books if recipe also qualifies above threshold).
2. **Given** the user taps a suggestion, **When** navigation completes, **Then** they land on the **authoritative domain screen** for that item (library detail, recipe detail, fitness today, plant detail, music practice hub, …).

---

### User Story 4 - Récap entry teaser (Priority: P2)

On **`/recap`**, the user sees a **single optional line** pointing to the same daily suggestions (Accueil card or equivalent). Recap lists remain **past-only**.

**Why this priority**: Valentin asked to **propose** placement near Récap without duplicating logic.

**Independent Test**: Open `/recap` with suggestions available — teaser visible; open recap with zero candidates — teaser hidden.

**Acceptance Scenarios**:

1. **Given** at least one suggestion today, **When** user opens Récap, **Then** a French teaser with link to suggestions is visible **above** period content.
2. **Given** user follows the link, **When** navigation completes, **Then** they see the Accueil suggestions block (or same content in a sheet — product choice at plan time).

---

### Edge Cases

- **New user / empty libraries**: No card or neutral empty — never placeholder fake suggestions.
- **Item completed after suggestion shown**: Tapping still opens detail; if user marks done, suggestion may disappear on next Accueil visit same day only if product refreshes on domain event (default: **wait until next day** to avoid flicker).
- **Soft-deleted items**: Excluded from pool.
- **Same item would win twice** (e.g. book + film same title): Two **distinct item ids** only — never duplicate row.
- **Fitness assiduity streak (008)**: Suggestion logic **must not** read or display streak state; optional fitness nudge uses **planned session skipped** or **long gap since last completed workout** only.
- **Plants without overdue engine (013)**: Staleness from **last water care event** only — no “overdue” badge copy.
- **012 planned DJ set in future**: Eligible as “not done lately” only when **`performedAt`** absent and plan date passed or status **`planned`** stale — not guilt for future gigs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST compute suggestions **only from local domain data** (offline-capable); network sync MUST NOT block display.
- **FR-002**: On each suggestion refresh boundary (default: **first Accueil visit per local calendar day**), system MUST select **at most two** and **exactly two when** ≥2 eligible candidates exist.
- **FR-003**: Each suggestion MUST reference **one identifiable domain item or actionable session** (book row, film/episode, track, recipe, planned/skipped fitness session, 012 composition/set/plan row, plant row, …) with **French** title and domain-appropriate subtitle template (see [research.md](research.md)).
- **FR-004**: System MUST **exclude** shopping lists and shopping item check-offs from the candidate pool.
- **FR-005**: Copy and empty states MUST comply with [009](../009-experiences-achievements/spec.md) anti-patterns: **no guilt**, **no social comparison**, **no streak loss** for this feature.
- **FR-006**: User MUST be able to **dismiss** each suggestion for the **current local day** without affecting domain data.
- **FR-007**: Dismissals MUST persist locally until next local day (per-item or per-slot — plan decides storage shape).
- **FR-008**: When ≥2 domains have eligible candidates above staleness threshold, selection SHOULD **prefer two different domains** (tie-break rules in research).
- **FR-009**: System MUST NOT write new “completion” or “experience” entities; suggestions are **read-only projections** plus dismiss metadata local to this feature.
- **FR-010**: Accueil MUST expose the suggestions block as **clearly optional** (dismissible block or per-row dismiss).
- **FR-011**: **`/recap`** MUST remain a **past achievement** view; suggestions MUST NOT appear as recap lines or heatmap events.
- **FR-012**: After user dismisses one of two suggestions, system MUST **not** backfill a third candidate until the next refresh boundary.
- **FR-013**: Staleness rules MUST follow per-domain definitions in [research.md](research.md); domains without implemented stores contribute **zero** candidates until shipped.
- **FR-014**: Primary actions MUST deep-link into existing domain UX (no parallel “suggestion-only” screens except optional sheet mirroring Accueil content).

### Key Entities *(conceptual — local preference only)*

- **Daily suggestion snapshot**: Ephemeral pair `(suggestionA, suggestionB)` for calendar day `D`, each pointing to `(domainId, itemId, suggestionKind)` and stable `snapshotId` for dismiss targeting.
- **Dismiss record**: `(calendarDay, snapshotId | itemId)` — no sync requirement in MVP unless plan adds optional sync for multi-device dismiss (out of scope P1).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance tests with ≥2 stale seeded items, **100%** of first Accueil visits on a new local day show **exactly two** suggestions.
- **SC-002**: With airplane mode enabled, **100%** of suggestion renders match seeded local data (no network calls required for display).
- **SC-003**: **Zero** suggestion strings in the French copy catalog contain guilt lexicon from the 009 review list (e.g. “en retard”, “tu n’as rien fait”, “chaîne brisée”) — verified by string audit in plan/tests.
- **SC-004**: **≥80%** of manual test sessions (plan-defined script) complete dismiss + deep-link in **under 30 seconds** without errors.
- **SC-005**: When recap and suggestions both enabled, users can distinguish recap (past) vs suggestions (forward) in moderated comprehension check (plan: 3 tester scenarios — pass if all describe correctly).

## Assumptions

- **Europe/Paris** local calendar until user timezone preference ships (011 parity).
- Staleness thresholds default to **30 local days** where domain has no finer rule; domains may use stricter defaults in research (e.g. plants watering).
- **Constitution Principle IV** interpreted as **no LLM / AI ranking** in v1 — deterministic scoring only.
- Multi-device dismiss sync is **not** required for MVP; worst case: suggestion reappears on another device same day — acceptable until P2.
- Home card is **on by default** but entire block dismissible for the day; permanent hide is **P2** (Open questions).

## Out of Scope

### MVP (P1)

- Push notifications (“time to read again”)
- AI-generated reasons or personalized essays
- New synced entities for `Experience` / `Suggestion` in backend (local dismiss + snapshot only)
- Shopping, quotes-only rows, artist-only 004 rows without track backlog
- Snooze “remind me in 7 days” per item (**P2**)
- Gamification points, badges, or global “discovery score”
- Replacing or merging into **011** recap aggregation

### P2 (may follow)

- Explicit **snooze** per candidate item (exclude until date)
- User setting: disable suggestions entirely or change staleness sensitivity
- Refresh on **each app foreground** instead of daily (if Valentin rejects daily default)

## UX sketch (informational)

```
Accueil (excerpt)
┌─────────────────────────────────────┐
│ … existing home lists / teasers …   │
├─────────────────────────────────────┤
│ Deux idées pour plus tard           │
│ Sans obligation — tu choisis.   [×] │
│  · Reprendre « Dune » (lecture)     │
│      [Ouvrir]  [Pas maintenant]     │
│  · Cuisiner « Curry lentilles »     │
│      [Ouvrir]  [Pas maintenant]     │
└─────────────────────────────────────┘

Récap (excerpt)
┌─────────────────────────────────────┐
│ Récap …                             │
│ → Deux idées pour plus tard (Accueil)│
│ … period lists (past only) …        │
└─────────────────────────────────────┘
```

## Open questions (product)

1. **Refresh cadence**: Keep **once per local day on first Accueil visit** (spec default) vs **recompute on every app open**?
2. **Default visibility**: Accueil card **on by default** vs **opt-in** in settings?
3. **Diversity rule**: When pool allows, **always two different domains** vs allow two from same domain if both are strongest stale?

## References

- Vision: [009 spec](../009-experiences-achievements/spec.md)
- Past reflection (contrast): [011 spec](../011-periodic-recap/spec.md), [011 research](../011-periodic-recap/research.md)
- Staleness sources: [research.md](research.md)
- Domain specs: [002](../002-books-library/spec.md), [003](../003-films-tv-library/spec.md), [004](../004-music-artists-tracks/spec.md), [008](../008-fitness-training/spec.md), [012](../012-music-practice/spec.md), [013](../013-plants-garden/spec.md)
