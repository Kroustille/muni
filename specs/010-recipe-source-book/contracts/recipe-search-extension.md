# Contract: Recipe search by cookbook title (P2)

**Applies to**: FR-011, US6.

## Scope

Extend existing global search use case (`src/application/search.ts`) — **no new route**.

## Index build

When rebuilding search entries for `type === "recipe"`:

1. If `cookbookId` set, resolve cookbook from local repository (synced catalog).
2. Append `normalizeText(cookbook.title)` to `normalizedFields` for that item.
3. Optionally append `normalizeText(cookbook.author)` when author present (spec emphasizes title; author match is additive, not required for acceptance).

Subscribe to **both** `ItemRepository` and `CookbookRepository` so cookbook title edits reindex referencing recipes.

## Query

Same as today: accent-insensitive substring match on any normalized field; ranking unchanged (stable existing order).

## Performance target

SC-005: 500 recipes + ≤200 cookbooks — rebuild and query remain user-perceived instant on mid-tier phone (in-memory index).

## Tests

- Unit: `tests/unit/search-cookbook.test.ts` — two recipes share cookbook; query matches cookbook title returns both.
- E2e: quickstart § P2 step.
