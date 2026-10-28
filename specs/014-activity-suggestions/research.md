# Research: Activity suggestions (014)

**Date**: 2026-10-28

**Purpose**: Define **stale** heuristics per logged domain, candidate eligibility, exclusion rules, and a **deterministic selection algorithm** for **exactly two** forward-looking suggestions. Contrast with [011](../011-periodic-recap/research.md) **completion** signals (past) vs **014** **intent / resume** signals (future).

## Alignment with 009 and distinction from 011

| Aspect | [009](../009-experiences-achievements/spec.md) | [011](../011-periodic-recap/spec.md) recap | **014 suggestions** |
|--------|--------------------------------------------------|--------------------------------------------|---------------------|
| Time direction | Longitudinal life story | **Past** period achievements | **Forward** “you might enjoy…” |
| Data used | Conceptual | **`read`**, **`watched`**, **`cookedDates`**, **`completed`**, … | **Backlog**, **gaps**, **skipped plans**, **care gaps** |
| Tone | No guilt | Celebratory empty states | **Invitational**, dismissible |
| Count | N/A | All events in period | **Exactly 2** per refresh |

**014 MUST NOT** reuse recap contributors as achievement lines; it MAY reuse the same **local stores** and timestamps with **inverted** logic (long time since touch → candidate).

## Global rules

| Rule | Detail |
|------|--------|
| **Timezone** | Local calendar day; default **`Europe/Paris`** (011 parity) |
| **Default staleness floor** | **`minStaleDays = 30`** unless domain table specifies otherwise |
| **Scoring** | `score = daysSince(staleAnchorDate)` — higher = more stale |
| **Eligible** | `score >= minStaleDays` AND not excluded AND item active (not soft-deleted) |
| **Shopping** | **Never** a candidate (001 errands) |
| **Artists-only 004** | No `to_listen` — **exclude** |
| **Quotes** | Exclude (capture, not backlog) |
| **Copy** | Do not show raw `score` or “42 days inactive” in primary UI (009 anti-pattern); subtitle MAY use soft French (“depuis un moment”) |

## Staleness by domain (normative for spec FR-013)

Anchor date = **most recent** of the listed signals (max date). **Days since** = whole local calendar days from anchor to **today**.

### Books ([002](../002-books-library/spec.md))

| Candidate kind | Include when | Stale anchor (max of) | Default `minStaleDays` |
|----------------|--------------|------------------------|-------------------------|
| **Resume reading** | Status **`reading`** or **`paused`** | Last book **activity day** (status change, pages read, per FR-D02) | 14 |
| **Start backlog** | Status **`to_read`** | `fieldsUpdatedAt.status` or item `updatedAt` when still `to_read` | 30 |

**Exclude**: **`read`**; items without title.

**Suggestion kind labels (FR)**: “Reprendre la lecture de …” / “Commencer …”

### Films & TV ([003](../003-films-tv-library/spec.md))

| Candidate kind | Include when | Stale anchor | `minStaleDays` |
|----------------|--------------|--------------|----------------|
| **Watch film** | Film status **`to_watch`** | Status touch date | 30 |
| **Continue série** | Série with **`episodeProgress`** incomplete | Latest **`watchedAt`** among episodes, or série status touch if none watched | 14 |
| **Start série** | Série **`to_watch`**, no episode progress | Status touch | 30 |

**Exclude**: **`watched`** films; fully watched séries.

**FR templates**: “Voir …” / “Reprendre … (S…E…)”

### Music listening ([004](../004-music-artists-tracks/spec.md))

| Candidate kind | Include when | Stale anchor | `minStaleDays` |
|----------------|--------------|--------------|----------------|
| **Listen backlog** | Track **`to_listen`** | `fieldsUpdatedAt.status` | 30 |

**Exclude**: **`listened`**; artists without track backlog.

**FR**: “Écouter …”

### Recipes (001 + [010](../010-recipe-source-book/spec.md) metadata optional)

| Candidate kind | Include when | Stale anchor | `minStaleDays` |
|----------------|--------------|--------------|----------------|
| **Cook again / first time** | Recipe item exists | If **`cookedDates`** non-empty: **max date** in array; else recipe **`createdAt`** or last **`updatedAt`** excluding ingredient-only edits (plan: use `updatedAt` if no cooks) | 30 (45 if never cooked) |

**Exclude**: Shopping lists; recipes user cooked within threshold.

**FR**: “Cuisiner …” / “Refaire …”

**Dependency**: **`cookedDates`** field from 011 prerequisite — without it, treat as **never cooked** using `updatedAt`/`createdAt` only.

### Fitness ([008](../008-fitness-training/spec.md))

| Candidate kind | Include when | Stale anchor | `minStaleDays` |
|----------------|--------------|--------------|----------------|
| **Resume training** | Active program exists; **no** **`completed`** workout in window | **`completedAt`** of last **`completed`** log; if none ever, program **`startedAt`** or first plan date | 7 |
| **Unblock skipped day** | Planned session **skipped** (`Passer`) with optional note | **Calendar date** of skip | 3 |

**Exclude**: Reading fitness **assiduity streak**; abandoned logs as positive nudges.

**FR**: “Séance prévue aujourd’hui — …” (only if today planned) / “Reprendre l’entraînement” / “Rattraper une séance passée” (soft — plan copy review)

**Note**: Skip-based candidates are **low staleness threshold** but capped at **one fitness candidate** in top pool to avoid dominating.

### Music practice ([012](../012-music-practice/spec.md))

| Candidate kind | Include when | Stale anchor | `minStaleDays` |
|----------------|--------------|--------------|----------------|
| **Composition** | Status **`in_progress`** or **`idea`** (not **`finished`**) | Last session note date or status touch | 14 |
| **DJ set** | Status **`planned`**, no **`performedAt`** | Planned date if past, else status touch | 14 |
| **Apprentissage** | **`practice_plan`** active; exercise/piece not logged | Last **`practice_log.practicedAt`** for instrument/plan; if none, plan start | 7 |

**Exclude**: **`finished`**, **`performed`**, **`archived`**, **`cancelled`** without forward action.

**FR**: “Avancer …” / “Préparer le set …” / “Séance de pratique …”

### Plants ([013](../013-plants-garden/spec.md))

| Candidate kind | Include when | Stale anchor | `minStaleDays` |
|----------------|--------------|--------------|----------------|
| **Water plant** | **`Plant`** exists | Last **`plant_care_event`** with `eventType = water` **`occurredAt`**; if none, plant **`createdAt`** | 7 (user-defined rhythm P2 — until then fixed 7) |
| **Potager milestone** (optional P1.1) | **`VegetableCulture`** with next typical milestone not logged | Last milestone **`occurredAt`** or culture **`createdAt`** | 14 |

**Exclude**: “Overdue” notifications; guilt copy.

**FR**: “Arroser …” / “Noter une étape pour …”

## Exclusions (always)

| Exclusion | Reason |
|-----------|--------|
| Shopping lists / items | Not experience discovery (011 FR-007 parity) |
| Items dismissed today (014 dismiss store) | User choice |
| Same `itemId` already in current daily snapshot | Dedupe |
| Soft-deleted entities | Data hygiene |
| Recap-only ghost rows | FR-011 |

### P2: user snooze list

Optional **`snoozedUntil`** per `(domainId, itemId)` — excluded while `today <= snoozedUntil`. Not in MVP.

## Selection algorithm (deterministic v1)

**Input**: Local stores, `today` (local calendar), dismiss records for `today`, optional config (`minStaleDays` overrides).

**Output**: Ordered pair `[S1, S2]` or fewer if pool size < 2.

```
1. BUILD pool:
   For each domain contributor (books, movies, music_tracks, recipes, fitness, music_practice, plants):
     - Enumerate candidates per tables above
     - Compute score = daysSince(anchor)
     - Keep if score >= domain.minStaleDays and not excluded

2. SORT pool descending by score; tie-break:
     a) Higher domain priority for life breadth: plants care gap, fitness gap, recipe, music_practice, books, movies, music_tracks (configurable)
     b) Lexicographic item title (stable)

3. PICK S1 = first item in sorted pool

4. PICK S2:
     - Filter pool \ {S1}
     - Prefer first item where domain(S2) ≠ domain(S1) if any exists with score within 7 days of S1.score
     - Else take next highest score (same domain allowed — see Open question 3)

5. PERSIST daily snapshot { date, S1, S2, snapshotId } on first Accueil visit;
   reuse snapshot for rest of day unless dismiss removes slot (no backfill)

6. DISMISS:
   - Remove slot for today only; do not re-run steps 3–4 until next calendar day
```

**Complexity**: O(n) over item counts (≤ few thousand — constitution scale).

**Rejected alternatives**:

| Alternative | Why rejected |
|-------------|--------------|
| Random two | Feels inconsistent; harder to test |
| Single “most stale” only | Violates “exactly 2” product ask |
| ML ranking | Constitution IV / YAGNI |
| Recap heatmap inverse | Wrong semantics (activity ≠ backlog) |

## Registry pattern (planning hint — not implementation in spec)

Mirror 011 **contributor** idea: each domain exports **`listStaleCandidates(deps, today) → Candidate[]`**. Suggestions service merges, scores, selects two. **No shared table with recap achievements.**

## Dependencies and sequencing

| Dependency | Need for 014 MVP |
|------------|------------------|
| 001 local items | Books, films, recipes baseline |
| 011 **`cookedDates`** | Accurate recipe staleness |
| 008 stores | Fitness gap + skip |
| 012 stores | Practice nudges |
| 013 stores | Plant watering nudges |
| 011 recap UI | Optional teaser link only |

Ship **014** after core domain data exists; UI MAY ship with **subset of contributors** (books + recipes only) if others stubbed — FR-013 graceful degradation.

## References

- [014 spec](spec.md)
- [009 vision](../009-experiences-achievements/spec.md)
- [011 research](../011-periodic-recap/research.md)
