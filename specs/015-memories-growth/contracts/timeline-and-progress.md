# Contract: Timeline projection & goal progress (application layer)

**Applies to**: FR-007–FR-009 (Fil de vie), FR-013–FR-017 (Objectifs). Research R1, R2, R5, R6.

## Shared port

Both features read domain events exclusively through récap (011) contributors:

```ts
// src/application/memories-growth/domain-events.ts
export type DomainEventsQuery = {
  list(range: RecapDateRange, domains?: readonly RecapDomainId[]): Promise<RecapAchievement[]>;
};
// Implementation: run every DomainRecapContributor (src/application/recap/contributors) for `range`,
// filtered by `domains`, flattening results. No new domain rules here.
```

## Timeline use case

```ts
// src/application/memories-growth/timeline.ts
listTimelineMonth(input: { year: number; month: number; filter: TimelineFilter; timeZone: string })
  : Promise<{ days: { date: string; entries: TimelineEntry[] }[]; hasEarlier: boolean }>;

type TimelineFilter = { souvenirs: boolean; achievements: boolean; goals: boolean; domains: RecapDomainId[] };
```

- Range = first..last day of the month (clamped to today).
- Sources: souvenirs (non-deleted, `occurredOn` in range), achievements (`earnedOn` in range), goals completed in range (derived `completedOn`), `DomainEventsQuery.list(range, filter.domains)`.
- Ordering per [data-model.md](../data-model.md) § Timeline entry.
- `hasEarlier` = any souvenir/achievement/goal or domain event before the month's start (cheap check: earliest `occurredOn` among souvenirs and earliest item `createdAt`).

## Goal progress use case

```ts
// src/application/memories-growth/goal-progress.ts
computeGoalProgress(goal: Goal | VirtualGoal, deps): Promise<{
  count: number; target: number | null; isComplete: boolean; completedOn: string | null; countedEvents: GoalCountedEvent[];
}>;
```

| targetKind | count |
|---|---|
| `domain_count`, metric ∈ récap domains | `DomainEventsQuery.list({startDate, min(endDate, today)}, [metric]).length` |
| `domain_count`, metric `souvenirs` | souvenirs with `occurredOn` in period |
| `checkin_count` | non-deleted check-ins with `occurredOn` in period |
| `done` | 1 if any check-in else 0; target 1 |

- `completedOn` = `occurredOn` of the `target`-th counted event sorted ascending (stable tie-break by `sortInstant`).
- Metric `movies` counts what récap counts (films + each episode line) — documented in the goal form helper text « films et épisodes ».

## Reactivity

- Hub pages subscribe to item/fitness/plants/practice/souvenir stores' change notifications (existing `subscribe` patterns) and recompute the visible month / visible goals; no background polling.
