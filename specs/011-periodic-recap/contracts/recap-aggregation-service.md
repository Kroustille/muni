# Contract: Recap aggregation service

**Applies to**: Application layer (`src/application/recap/*`), domain types (`src/domain/recap.ts`).

## Purpose

Single read-only pipeline that powers **`/recap`** list sections and **activity heatmap** without duplicating domain rules (FR-003, FR-006, FR-013).

## Public use cases

### `buildRecapSnapshot`

```text
Input:
  period: { granularity, anchorDate }
  timeZone?: string  // default Europe/Paris
  deps: RecapDeps

Output: RecapSnapshot (see data-model.md)
```

**Behavior**:

1. Resolve inclusive `[startDate, endDate]` from `period` + `timeZone`.
2. For each registered **contributor** (stable order), call `collectAchievements`.
3. Concatenate, apply global soft-delete filter, bucket dates in `timeZone`.
4. Group into `RecapSection[]`; omit sections with zero rows (US6).
5. Build `activityDays` via `buildActivityDays(achievements, heatmapWindow)` where heatmap window is **trailing 365 local days** ending today (OD-011-1).

### `navigatePeriod`

```text
Input: current period, direction: 'prev' | 'next'
Output: new RecapPeriod (same granularity, shifted anchor)
```

### `setPeriodGranularity`

```text
Input: current anchorDate, new granularity
Output: RecapPeriod with sensible default anchor (e.g. today for week/month/day; Jan 1 for year when switching to year)
```

## `RecapDeps` (ports)

| Port | Used by |
|------|---------|
| `ItemRepository.listAll()` (or existing list use case) | book, movie, music tracks, recipe contributors |
| `FitnessWorkoutRepository.listCompleted()` | fitness contributor |
| **012** `MusicCompositionRepository`, `DjSetRepository`, `PracticeLogRepository` (list non-deleted) | music practice contributor |
| `PlantsRecapRepository` (or equivalent port over plant stores) | plants contributor — care events + milestones in date range ([013](../013-plants-garden/research.md)) |

No network calls. Reads reflect current IndexedDB (+ in-memory fitness + **012** + **013** stores) state.

## Contributor interface

Each file under `contributors/` exports:

```typescript
export const booksRecapContributor: DomainRecapContributor = {
  domainId: "book",
  collectAchievements(deps, range) { /* ... */ },
};
```

**Registry** (`contributors/index.ts`): ordered array `[books, movies, musicTracks, musicPractice, recipes, fitness, plants]`.

**Musique grouping**: `musicTracks` and `musicPractice` both emit `domainId: "music_track"` (French section **Musique**). Snapshot builder merges into one `RecapSection` and dedupes **`domainsPresent`** to a single Musique entry per calendar day for heatmap.

Adding a domain = new contributor + i18n section label + heatmap accent mapping — **no change** to route or snapshot orchestrator signature.

## Domain-specific rules (normative pointers)

| Contributor | Spec / code precedent |
|-------------|----------------------|
| Books | Finish `read`; instant from `fieldsUpdatedAt.read` ?? status transition ([002](../002-books-library/spec.md)) |
| Movies | `watchedAt`, episode `episodeProgress` ([003](../003-films-tv-library/spec.md)); **one line per episode** |
| Music (004) | Tracks `listened` only ([004](../004-music-artists-tracks/spec.md)); `domainId` **`music_track`** |
| Music practice (012) | `music_composition` **`finished`** + **`finishedAt`**; `dj_set` **`performed`** + **`performedAt`**; each **`practice_log`** with **`practicedAt`** (incl. **`improvisation`**) ([012](../012-music-practice/data-model.md)); same **`music_track`** domainId; **one line per log** (dedupe log id only) |
| Recipes | `cookedDates` entries ([recipe-cooked-dates.md](recipe-cooked-dates.md)) |
| Fitness | `completed` + `completedAt` / `calendarDate` ([008](../008-fitness-training/spec.md)) |
| Plants | `plant_care_event`, `vegetable_milestone` — `occurredAt` ([013](../013-plants-garden/research.md)) |

## Performance

- Single scan of items array per snapshot; contributors filter in memory.
- Target: 500 achievements / period without blocking main thread >2s (SC-001) — consider incremental render in UI if needed; aggregation itself should stay O(n).

## Testing (contract)

| Test file | Covers |
|-----------|--------|
| `tests/unit/recap/period.test.ts` | ISO week, month edges, prev/next |
| `tests/unit/recap/*-contributor.test.ts` | Books, movies, recipes, fitness, **plants** edge cases |
| `tests/unit/recap/music-tracks-contributor.test.ts` | 004 listened |
| `tests/unit/recap/music-practice-contributor.test.ts` | 012 finished / performed / practice_log |
| `tests/unit/recap/plants-contributor.test.ts` | 013 care events + vegetable milestones |
| `tests/unit/recap/build-recap-snapshot.test.ts` | Grouping, sort, omit empty sections, soft delete |
| `tests/unit/recap/activity-days.test.ts` | Multi-domain same day, 365 window |

## FR mapping

| FR | Mechanism |
|----|-----------|
| FR-003 | Local deps only |
| FR-006–FR-008 | Contributors + `RecapAchievement` shape |
| FR-011 | `timeZone` parameter |
| FR-013 | Contributor registry |
| FR-014 | Skip deleted sources in each contributor |
| FR-016 | Section order + sort in snapshot builder |
