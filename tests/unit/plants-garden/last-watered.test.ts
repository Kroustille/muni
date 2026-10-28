import { describe, expect, it } from "vitest";

import { lastWateredDate } from "@/domain/plant-care-event";
import { buildCareEvent } from "./fixtures";

describe("last watered", () => {
  it("uses max occurredAt among water events", () => {
    const events = [
      buildCareEvent({ id: "11111111-1111-4111-8111-111111111111", occurredAt: "2026-10-01", eventType: "water" }),
      buildCareEvent({ id: "22222222-2222-4222-8222-222222222222", occurredAt: "2026-10-15", eventType: "water" }),
      buildCareEvent({ id: "33333333-3333-4333-8333-333333333333", occurredAt: "2026-10-10", eventType: "fertilize" }),
    ];
    expect(lastWateredDate(events)).toBe("2026-10-15");
  });

  it("returns null when no water events", () => {
    expect(lastWateredDate([])).toBeNull();
    expect(
      lastWateredDate([
        buildCareEvent({ eventType: "fertilize", occurredAt: "2026-10-01" }),
      ]),
    ).toBeNull();
  });
});
