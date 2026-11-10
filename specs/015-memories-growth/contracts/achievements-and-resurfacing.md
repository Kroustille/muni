# Contract: Réalisations engine, Ce jour-là, Moments forts

**Applies to**: FR-011/FR-012 (Ce jour-là), FR-019–FR-023 (Réalisations), FR-024 (Moments forts). Research R7, R8, R12.

## Achievement rules

```ts
// src/application/memories-growth/achievement-rules.ts
export type AchievementRule = {
  ruleId: string;            // stable forever
  version: number;           // bump when semantics change; old rows keep their version
  metric: GoalMetric | "goals_completed";
  thresholds: readonly number[];
  titleKey: MessageKey;      // e.g. "progression.achievement.books_read" → « {count} livres lus »
  countEvents(deps): Promise<{ occurredOn: string; sourceLink?: SouvenirLink }[]>; // ascending
};
```

v1 rule table: see [research.md § R7](../research.md). Counting reuses `DomainEventsQuery` over an all-time range (`1970-01-01`..today) except: `movies_watched` counts distinct film items (not episode lines), `recipes_cooked` counts distinct recipes, `goals_completed` uses goal progress.

## Evaluator

```ts
// src/application/memories-growth/evaluate-achievements.ts
evaluateAchievements(deps): Promise<Achievement[] /* newly created */>;
```

For each rule and threshold `t` where `events.length ≥ t`:
1. `id = await deterministicUuid(MEMORIES_NAMESPACE, `${ruleId}:${t}`)`
2. If a row with `id` exists (including soft-deleted) → skip.
3. Else insert `{ origin: "auto", ruleId, ruleVersion, threshold: t, title: format(titleKey, t), earnedOn: events[t-1].occurredOn, links: events[t-1].sourceLink ? [it] : [] }`.

Triggers: app start, after local writes (debounced 2 s via `onLocalWrite`), after a sync pull applies rows. Idempotent and safe to run concurrently (insert uses `put` with the deterministic id; duplicates collapse).

`deterministicUuid` lives in `src/domain/deterministic-uuid.ts` (RFC 4122 v5 via `crypto.subtle.digest("SHA-1")`), with unit tests against known v5 vectors.

## Celebration

- New rows with `earnedOn ≥ today − 7 days` and `celebratedAt === null` queue a celebration on Accueil and any hub page. Dismiss/open sets `celebratedAt` (synced, so other devices don't repeat it).

## Ce jour-là

```ts
// src/application/memories-growth/on-this-day.ts
listOnThisDay(today: string): Promise<{ year: number; yearsAgo: number; entry: Souvenir | Achievement }[]>; // ≤ 3
```

- Match `MM-DD` of `occurredOn` / `earnedOn` with today's, `year < todayYear`; 02-29 matches 02-28 in non-leap years.
- Sorted by year desc; souvenirs before achievements within a year; favourites first.
- Card `data-testid="on-this-day-card"` on Accueil, above suggestions; « Il y a {n} an(s) : {title} »; dismiss button « Masquer pour aujourd'hui » writes `on_this_day_dismissal[today]`.
- Settings → section « Souvenirs » → toggle « Afficher Ce jour-là » (`memories_prefs.onThisDayEnabled`, default on).

## Moments forts (récap 011)

- `RecapSnapshot` gains optional `highlights?: { souvenirs: Souvenir[]; achievements: Achievement[]; goalsCompleted: { goalId; title; completedOn }[] }`, built only for `month` and `year` granularities by a `MemoriesHighlightsQuery` port injected into `buildRecapSnapshot` deps (011 owns rendering; 015 owns the query).
- Order: favourite souvenirs, other souvenirs (newest first, cap 10 with « Voir dans le fil de vie »), achievements, goals.
- Section title « Moments forts »; hidden when all lists are empty. Link « Voir cette période dans le fil de vie » → `/souvenirs?month=YYYY-MM`.
