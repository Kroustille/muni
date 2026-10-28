# Data Model: Periodic recap (011)

Recap **does not persist** its own entities in MVP. This document defines **derived view models**, the **recipe field extension**, and **contributor inputs**.

## Persisted extension (recipe items only)

### `cookedDates` on `Item` (type `recipe`)

| Field | Type | Rules |
|-------|------|-------|
| `cookedDates` | `string[]` | Each entry ISO calendar date `YYYY-MM-DD` in user local semantics when recorded; ordered append-only in use case |
| Dedupe | — | At most **one entry per calendar day per recipe** (same-day double-tap ignored) |
| Sync | — | LWW on whole array field via existing item patch + `fieldsUpdatedAt.cookedDates` |
| Validation | — | Zod: array of `/^\d{4}-\d{2}-\d{2}$/`; reject invalid dates; max length 366×10 sanity cap |

**Not persisted**: recap period selection, heatmap cells, achievement rows.

## Derived: `RecapPeriod` (UI state)

| Field | Type | Rules |
|-------|------|-------|
| `granularity` | `"week"` \| `"month"` \| `"day"` \| `"year"` | MVP v1: all four granularities |
| `anchorDate` | `string` (`YYYY-MM-DD`) | Local calendar day anchoring the period (e.g. any day in target ISO week) |
| `timeZone` | `string` | Default `Europe/Paris` (OD-011-4) |

Computed (not stored):

| Field | Type | Rules |
|-------|------|-------|
| `startDate` | `string` | Inclusive start of period in `timeZone` |
| `endDate` | `string` | Inclusive end of period in `timeZone` |
| `labelFr` | `string` | i18n-ready label for header (“Semaine du …”, “Octobre 2026”, …) |

**Week**: ISO 8601 week (Monday start). **Month/year**: calendar boundaries in `timeZone`. **Day**: `anchorDate` only.

## Derived: `RecapDomainId`

Closed enum MVP (stable order FR-016 / heatmap):

| `RecapDomainId` | French section | Source store |
|-----------------|----------------|--------------|
| `book` | Livres | `items` type `book`, status `read` |
| `movie` | Films & séries | `items` type `movie`, film `watched` + episode `episodeProgress` |
| `music_track` | Musique | `items` type `music_track`, status `listened` |
| `recipe` | Recettes | `items` type `recipe`, `cookedDates` entries in period |
| `fitness` | Entraînement | `fitness_workout_log` status `completed` |

## Derived: `RecapAchievement`

Built at read time; one row per qualifying **event** in period.

| Field | Type | Rules |
|-------|------|-------|
| `domainId` | `RecapDomainId` | |
| `occurredOn` | `string` | `YYYY-MM-DD` local bucket for display + sort |
| `sortInstant` | `string` | ISO timestamp for tie-break (newest first within domain) |
| `title` | `string` | Book/film/track/recipe title or workout session title |
| `subtitle` | `string?` | Episode key (`S1E3`), series name, etc. |
| `sourceItemId` | `string?` | Item id when from `items` |
| `sourceWorkoutId` | `string?` | Fitness log id when from fitness store |
| `deepLinkHref` | `string?` | Optional navigation to detail (read-only recap) |

**Exclusion rules (FR-007, FR-014)**:

- Skip `deletedAt != null` sources.
- Skip shopping, music_artist, non-completed fitness, non-eligible statuses.
- Books: only transition to **`read`** (use finish instant rules from `book-stats` / `fieldsUpdatedAt.read`).
- Films: **`watched`** with `watchedAt` or status day; episodes: one line per `episodeProgress` entry with `watchedAt` in period.
- Tracks: **`listened`** with status transition day.
- Recipes: **one line per `cookedDates` entry** in period (same recipe twice → two lines if two dates).
- Fitness: **`completed`** with `completedAt` or fallback `calendarDate`.

**Sort within domain section**: `occurredOn` desc, then `title` asc (FR-016).

## Derived: `RecapSection`

| Field | Type | Rules |
|-------|------|-------|
| `domainId` | `RecapDomainId` | |
| `labelFr` | `string` | Section header |
| `count` | `number` | Line count in period |
| `achievements` | `RecapAchievement[]` | Sorted per FR-016 |
| `visible` | `boolean` | `count > 0` — empty domains **omitted** (US6) |

## Derived: `RecapActivityDay` (heatmap)

| Field | Type | Rules |
|-------|------|-------|
| `calendarDate` | `string` | `YYYY-MM-DD` |
| `domainsPresent` | `RecapDomainId[]` | Unique domains with ≥1 achievement that day; **ordered** per stable domain order |
| `eventCount` | `number` | Total achievements that day (tooltip/a11y optional) |
| `isActive` | `boolean` | `domainsPresent.length > 0` |

**Heatmap window** (OD-011-1): consecutive local days from **`today - 364`** through **`today`** inclusive (365 cells). Independent of `RecapPeriod`.

## Derived: `RecapSnapshot`

| Field | Type | Rules |
|-------|------|-------|
| `period` | `RecapPeriod` + bounds | Current UI selection |
| `sections` | `RecapSection[]` | Non-empty domains only |
| `totalCount` | `number` | Sum of achievements |
| `activityDays` | `RecapActivityDay[]` | For heatmap component |
| `empty` | `boolean` | `totalCount === 0` |

## Conceptual: `DomainRecapContributor`

| Responsibility | Detail |
|----------------|--------|
| `domainId` | Stable id |
| `collectAchievements` | `(deps, { startDate, endDate, timeZone }) → RecapAchievement[]` |
| Dependencies | Injected ports: `ItemRepository`, fitness workout repo, etc. |

Registry order MUST match `RecapDomainId` table order.
