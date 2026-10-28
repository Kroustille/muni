# Contract: Suggestions local store (IndexedDB)

**Applies to**: `src/application/ports/activity-suggestion-store.ts`, `src/adapters/indexeddb/activity-suggestion-store.ts`

## Purpose

Persist **daily snapshot** and dismiss mutations **client-only** (spec Out of Scope: no server sync MVP).

## Object stores

| Store name | Key | Value |
|------------|-----|-------|
| `activity_suggestion_snapshot` | `calendarDay` (string) | `DailyActivitySuggestionSnapshot` JSON |
| `activity_suggestion_dismiss` | `[calendarDay, slotId]` composite | optional if dismiss embedded in snapshot only |

**Plan default**: Single store `activity_suggestion_snapshot` with dismiss on slots; second store **not required** if slot `dismissedAt` suffices.

## Port methods

```typescript
interface ActivitySuggestionStore {
  getSnapshot(calendarDay: string): Promise<DailyActivitySuggestionSnapshot | null>;
  putSnapshot(snapshot: DailyActivitySuggestionSnapshot): Promise<void>;
  dismissSlot(calendarDay: string, slotId: string, dismissedAt: Date): Promise<void>;
  dismissBlock(calendarDay: string): Promise<void>;  // blockDismissed = true
  pruneOlderThan(keepDays: number): Promise<void>;   // optional, default 7
}
```

## Migration

Bump IndexedDB version in `src/adapters/indexeddb/db.ts` when adding stores — **no** Kysely migration.

## Multi-device

Unsynced dismiss may re-show on another device same day — acceptable MVP (spec Assumptions).

## Tests

`tests/unit/suggestions/activity-suggestion-store.test.ts` with fake indexeddb or in-memory adapter implementing same port.
