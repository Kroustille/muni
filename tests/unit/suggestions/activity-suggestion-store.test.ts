import { describe, expect, it } from "vitest";

import type { DailyActivitySuggestionSnapshot } from "@/domain/activity-suggestion";
import { InMemoryActivitySuggestionStore } from "./in-memory-activity-suggestion-store";
import { CALENDAR_DAY, TZ } from "./fixtures";

function snapshot(overrides: Partial<DailyActivitySuggestionSnapshot> = {}): DailyActivitySuggestionSnapshot {
  return {
    calendarDay: CALENDAR_DAY,
    snapshotId: "99999999-9999-4999-8999-999999999999",
    computedAt: "2026-10-28T08:00:00.000Z",
    slots: [],
    blockDismissed: false,
    timeZone: TZ,
    ...overrides,
  };
}

describe("InMemoryActivitySuggestionStore", () => {
  it("returns null when no snapshot exists", async () => {
    const store = new InMemoryActivitySuggestionStore();
    await expect(store.getSnapshot(CALENDAR_DAY)).resolves.toBeNull();
  });

  it("stores and retrieves a snapshot by calendar day", async () => {
    const store = new InMemoryActivitySuggestionStore();
    const saved = snapshot();
    await store.putSnapshot(saved);
    await expect(store.getSnapshot(CALENDAR_DAY)).resolves.toEqual(saved);
  });

  it("marks a slot dismissed without dropping other slots", async () => {
    const store = new InMemoryActivitySuggestionStore();
    await store.putSnapshot(
      snapshot({
        slots: [
          {
            slotId: "slot-a",
            dismissedAt: null,
            candidate: {
              domainId: "book",
              itemId: "11111111-1111-4111-8111-111111111101",
              kind: "start_to_read",
              title: "A",
              subtitle: null,
              staleAnchorDate: "2026-01-01",
              score: 30,
              deepLink: "/items/a",
              primaryActionKey: "suggestions.action.start",
            },
          },
          {
            slotId: "slot-b",
            dismissedAt: null,
            candidate: {
              domainId: "recipe",
              itemId: "22222222-2222-4222-8222-222222222202",
              kind: "cook_first",
              title: "B",
              subtitle: null,
              staleAnchorDate: "2026-01-01",
              score: 45,
              deepLink: "/items/b",
              primaryActionKey: "suggestions.action.cook",
            },
          },
        ],
      }),
    );

    await store.dismissSlot(CALENDAR_DAY, "slot-a", new Date("2026-10-28T09:00:00.000Z"));
    const loaded = await store.getSnapshot(CALENDAR_DAY);
    expect(loaded?.slots).toHaveLength(2);
    expect(loaded?.slots[0]?.dismissedAt).toBe("2026-10-28T09:00:00.000Z");
    expect(loaded?.slots[1]?.dismissedAt).toBeNull();
  });

  it("sets blockDismissed for the calendar day", async () => {
    const store = new InMemoryActivitySuggestionStore();
    await store.putSnapshot(snapshot());
    await store.dismissBlock(CALENDAR_DAY);
    const loaded = await store.getSnapshot(CALENDAR_DAY);
    expect(loaded?.blockDismissed).toBe(true);
  });
});
