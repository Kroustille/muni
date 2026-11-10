# Research: Souvenirs & progression (015)

**Date**: 2026-11-11 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Each section resolves a design question left open by the spec's "Defaults proposed" table or discovered while planning. Format: **Decision** / **Rationale** / **Alternatives rejected**.

---

## R1 — Where domain events for Fil de vie and goal progress come from

**Decision**: Reuse the récap (011) **`DomainRecapContributor.collectAchievements(deps, range)`** contributors as the single source of dated domain events. Fil de vie and goal progress call them over a date range and map each `RecapAchievement` to a timeline entry or a progress count.

**Rationale**: Contributors already encode the hard rules per domain — HLC stamp → calendar day, one line per episode, recipe `cookedDates`, completed workouts only, practice logs, plant care events, deleted items hidden. Reusing them keeps Fil de vie, Récap and Objectifs consistent by construction (spec Assumption: "Récap completion signals are the source of truth"). FR-008 ("derived, no duplicated event copies") holds automatically.

**Alternatives rejected**:
- New event journal table written on every completion — duplicates data, needs backfill for history, drifts from domain edits.
- Per-feature queries in 015 — re-implements contributor rules (Constitution VII boundary violation, and bugs like the HLC parsing fixed on 2026-11-10 would reappear).

**Consequence**: Shopping is excluded (récap excludes it). Music artists excluded. Any domain later added to récap appears in Fil de vie with no 015 change.

---

## R2 — Timeline pagination and performance (SC-002)

**Decision**: Fil de vie loads **one calendar month per page** (newest first) by calling contributors with that month's `RecapDateRange`, plus local souvenirs/réalisations/goals in range. "Jump to year/month" sets the anchor month. Infinite scroll loads the previous month.

**Rationale**: Contributors already accept ranges and run against local IndexedDB; a month of data is small. 5 years ≈ 60 pages; only the visible month is computed. Meets SC-002 (<1 s for current month offline) without an index.

**Alternatives rejected**: Precomputed timeline cache in IDB — invalidation complexity for no measured need (Constitution IV).

---

## R3 — Souvenir links to other domains

**Decision**: A souvenir stores **`links: SouvenirLink[]`** as a **single jsonb field** (LWW whole value), each link `{ kind: "item" | "fitness_workout" | "plant", id: uuid }`. `item` covers books, films/séries, recipes, music tracks/artists (not shopping — validated against the item's `type` client-side; server only validates shape + ownership is not required, see R9). Max **10** links.

**Rationale**: Links are edited as a set in one form; whole-value LWW matches the 008 `plannedSessions` / 013 `seasonalHints` pattern. "Souvenirs liés" on an item detail (FR-005) is a local scan of souvenirs filtered by link id — cheap at personal scale.

**Alternatives rejected**: `souvenir_link` join table — extra entity, extra sync, per-row merge semantics nobody needs.

---

## R4 — Mood vocabulary for souvenirs

**Decision**: Reuse the existing **`BookMood`** set (shared by books and films discovery: same i18n `books.mood.*`). Optional.

**Rationale**: One mood vocabulary across Muni enables future "souvenirs joyeux" filters and Fil de vie styling; no new copy to review against 009.

---

## R5 — Goal model and measurable signals (FR-013/FR-014)

**Decision**: `Objectif` has `targetKind`:

| `targetKind` | Progress source | Target |
|---|---|---|
| `domain_count` | Count of contributor achievements for `metric` within the goal period | `targetCount ≥ 1` |
| `checkin_count` | Count of non-deleted `goal_checkin` rows within the period | `targetCount ≥ 1` |
| `done` | Single boolean via one check-in | — |

`metric` ∈ **`books`** (read) · **`movies`** (watched, films + episodes as récap counts them) · **`recipes`** (cooked) · **`fitness`** (completed workouts) · **`music_practice`** (practice logs + finished compositions + performed sets, as récap) · **`plants`** (care events) · **`souvenirs`** (souvenirs dated in period).

**Rationale**: Mapping metrics to `RecapDomainId` means progress = `achievements.filter(a => a.domainId === metric).length` over the goal's range — one rule, no new domain logic. `souvenirs` is counted from the souvenir store directly.

**Period**: `periodKind` ∈ `week | month | quarter | year | custom` with explicit `startDate`/`endDate` (calendar dates, inclusive) stored on the row; presets only compute those dates at creation (editing the period recomputes progress — spec edge case).

**Alternatives rejected**: Free-form "rules" engine — out of scope (spec Assumptions); per-goal custom filters (e.g. "books tagged sci-fi") — P3 at most.

---

## R6 — Existing book/film year goals (FR-017)

**Decision**: **Read-through projection**. `ReadingGoal` / `WatchGoal` (per-year `targetCount`) appear in Objectifs as virtual goals `{ source: "reading_goal" | "watch_goal", metric: "books" | "movies", periodKind: "year" }`, progress computed with the same R5 rule. Editing them deep-links to the existing book/film year-goal screens. Not stored in `goal`.

**Rationale**: Spec says no migration in v1; avoids two sources of truth.

---

## R7 — Achievement (réalisation) rules and idempotency (FR-019/FR-020)

**Decision**:
- Rules live in code: `src/application/memories-growth/achievement-rules.ts`, a **versioned** list `{ ruleId, version, thresholds[], metric, titleKey }`.
- v1 rules (all count-based over **all time**, using contributors with an all-time range or direct counts):

| ruleId | Metric | Thresholds |
|---|---|---|
| `books_read` | books | 1, 10, 25, 50, 100, 250 |
| `movies_watched` | movies (films only, not episodes) | 1, 10, 50, 100, 250 |
| `recipes_cooked` | recipes (distinct recipes cooked) | 1, 10, 25, 50 |
| `workouts_completed` | fitness | 1, 10, 50, 100, 250 |
| `practice_sessions` | music_practice (practice logs) | 1, 10, 50, 100 |
| `souvenirs_added` | souvenirs | 1, 10, 50, 100 |
| `goals_completed` | goals reaching target | 1, 5, 10 |

- **Fitness personal records** (spec US5 example) are **deferred to P3**: fitness PRs are explicitly post-v1 in 011 (T1194) and need 008 PR detection first.
- **Deterministic id**: `id = uuidV5(MEMORIES_NAMESPACE, "${ruleId}:${threshold}")` computed with WebCrypto SHA-1 (available in browsers and Node 22). Combined with the `(user_id, id)` composite PK, two devices earning the same achievement offline produce the **same row** → sync merges (SC-004).
- `earnedOn` = calendar day of the event that crossed the threshold (the N-th achievement's `occurredOn`), **not** the evaluation day — so backfilled history gets correct dates.
- Never revoked (FR-021): evaluation only inserts; un-marking items does not delete rows. User delete = soft delete; a soft-deleted auto achievement is **not** re-created (the tombstone keeps the id).
- **Backfill**: the first evaluation after install creates achievements for existing history **silently** (no celebration toasts for rows whose `earnedOn` is older than 7 days) to avoid a burst of celebrations.

**Evaluation trigger**: after local writes that can affect metrics (debounced, piggybacking on the existing `onLocalWrite` hook) and after sync pull applies remote rows; plus on app start.

**Alternatives rejected**: Server-side scoring — breaks offline-first; random UUIDs + server dedupe on natural key — needs a unique index and conflict handling for little gain.

---

## R8 — "Ce jour-là" (FR-011/FR-012)

**Decision**: Computed locally on Accueil: souvenirs and réalisations whose **month-day** equals today's in a **previous year**; most recent year first, max 3. 29 Feb entries surface on 28 Feb in non-leap years. Dismissal stored **per device** in a local-only IDB store keyed by calendar day (same pattern as 014's `activity_suggestion_snapshot`). The on/off toggle is a **device-local preference** in v1 (settings page), not synced.

**Rationale**: Mirrors 014 suggestions (local snapshot, per-day dismissal); no sync entity needed for a UI preference.

**Alternatives rejected**: Including domain events (finished books) in Ce jour-là — spec FR-011 limits to souvenirs/réalisations; can be revisited.

---

## R9 — Sync channel

**Decision**: New channel **`/api/sync/memories-growth/{push,pull}`** carrying `souvenirs[]`, `goals[]`, `goalCheckins[]`, `achievements[]`, mirroring 012/013 (per-field LWW via `fields_updated_at`, soft delete, tombstones in pull). Server validates shape, ownership of rows (user from session), and `goal_checkin.goal_id` same-user. Link targets inside `souvenir.links` are **not** cross-validated server-side (they may arrive before/after the linked item syncs on another channel); the client renders a missing target as "élément supprimé" (spec edge case).

**Pull** is a **GET**: it relies on the `isSameOriginRequest` fix (Sec-Fetch-Site) only if an origin check is added; follow the items pull route (session cookie only) — see 2026-11-10 incident where a GET origin check blocked all sync.

---

## R10 — Navigation and mobile reachability

**Finding**: The mobile **BottomNav** renders only `PRIMARY_NAV` (Accueil, Recherche, Récap, Réglages + FAB). `FEATURE_NAV` (Entraînement, Musique — pratique, Plantes) appears **only in the desktop sidebar** — on phones those hubs are reachable only via deep links / Accueil cards. Muni is mobile-first.

**Decision for 015**: 
- Add two hubs to `FEATURE_NAV`: **Souvenirs** (`/souvenirs`: tabs *Fil de vie* · *Souvenirs*) and **Progression** (`/progression`: tabs *Objectifs* · *Réalisations*).
- On Accueil, add a compact **Souvenirs & progression** entry row (links to both hubs) so mobile users can reach them; Ce jour-là card also links to `/souvenirs`.
- Raise **OD-015-6** (not blocking): a mobile "Plus" menu exposing all `FEATURE_NAV` hubs would fix reachability for 008/012/013/015 together — recommended as a small follow-up outside this spec.

**Alternatives rejected**: Replacing a primary bottom-nav slot — changes 011's locked decision (Récap in bottom nav).

---

## R11 — Quick-add integration (FR-003)

**Decision**: Add **Souvenir** as a type in the global quick-add picker (after Recette). The quick-add sheet for souvenirs shows title + date (default today) only; text, mood, place, favourite and links are on the detail screen. Souvenir is **not** an `ItemType` (separate entity) — the picker gains a non-item option that calls the souvenir use case.

**Rationale**: Meets ≤3 taps + title; keeps `items` enum unchanged (13/012 precedent: plants, practice are not items).

---

## R12 — Récap "Moments forts" (FR-024)

**Decision**: Extend the récap snapshot with an optional `highlights` block (not a new `RecapDomainId`, so the heatmap and domain sections are unchanged): favourite souvenirs first, then other souvenirs, réalisations earned, goals completed — within the period, for **month and year** granularities only. Hidden when empty.

**Rationale**: Keeps 011's domain model and heatmap legend stable; Moments forts is presentation over 015 data.

---

## R13 — Tone review (FR-025, SC-005)

**Decision**: All `memories.*` / `progression.*` copy goes through the 009 checklist (no guilt, no comparison, no streak loss). Goal end-of-period copy uses neutral counts ("8 sur 12 — belle année de lecture"); missed targets never use "échec", "raté", "en retard". Add a unit test that scans the new i18n keys for a deny-list of words (`retard`, `échec`, `raté`, `perdu`, `série perdue`, `classement`).
