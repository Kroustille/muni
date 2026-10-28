# Contract: Plants recap query port (011 integration)

**Applies to**: FR-012; consumed by [011 recap aggregation](../../011-periodic-recap/contracts/recap-aggregation-service.md) **`plants`** contributor ([T1115](../../011-periodic-recap/tasks.md)).

**Owner**: 013 implements port + adapters; 011 implements `plants-contributor.ts` mapping to `RecapAchievement`.

## Port: `PlantsRecapRepository`

```typescript
listCareEventsInRange(from: Date, to: Date): Promise<PlantCareEventRecapRow[]>;
listMilestonesInRange(from: Date, to: Date): Promise<VegetableMilestoneRecapRow[]>;
```

Rows MUST include parent title and soft-delete state resolved:

| Row field | Source |
|-----------|--------|
| `occurredAt` | care event / milestone |
| `title` | plant.title or culture.title |
| `subtitleKey` | i18n key from `eventType` or `milestoneType` |
| `plantId` / `cultureId` | for deep link |
| `deleted` | exclude from contributor when parent deleted |

## Contributor output (normative)

Align with [research.md](../research.md) § Recap signals:

| Source | `RecapDomainId` | Section header (French) |
|--------|-----------------|-------------------------|
| Care events + milestones | `plants` | Plantes |

Stable domain order in 011: … → `fitness` → **`plants`** ([011 plan OD-011-5](../../011-periodic-recap/plan.md)).

## Heatmap

Each calendar day with ≥1 eligible row adds **`plants`** to `domainsPresent` ([011 recap-activity-heatmap](../../011-periodic-recap/contracts/recap-activity-heatmap.md), accent `#16a34a`).

## Tests

| File | Owner |
|------|-------|
| `tests/unit/recap/plants-contributor.test.ts` | 011 T1115 (may stub port until 013 T1316) |
| `tests/unit/plants-garden/recap-query.test.ts` | 013 — port over fixtures |

## Cross-feature tasks

| Feature | Task | Depends on |
|---------|------|------------|
| 013 | T1316 `plants-recap-query.ts` + repo methods | T1314 foundation |
| 011 | T1115 `plants-contributor.ts` | 013 port or stub |
| 011 | T1114 heatmap multi-domain | care events in fixtures |

## FR mapping

| FR | Port |
|----|------|
| FR-012 | Event shapes + dates only — no recap-only table |
