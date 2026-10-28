import { describe, expect, it } from "vitest";

import {
  plantCareEventSchema,
  plantCareEventTypes,
  validateOccurredAtNotFuture,
  waterEventOnDay,
} from "@/domain/plant-care-event";
import { buildCareEvent } from "./fixtures";

describe("plant care event domain", () => {
  it("validates eventType enum", () => {
    for (const eventType of plantCareEventTypes) {
      const event = plantCareEventSchema.parse(buildCareEvent({ eventType }));
      expect(event.eventType).toBe(eventType);
    }
  });

  it("rejects future occurredAt", () => {
    expect(validateOccurredAtNotFuture("2026-12-31", "2026-10-20")).toBe("occurredAt must not be future");
    expect(validateOccurredAtNotFuture("2026-10-20", "2026-10-20")).toBeNull();
  });

  it("enforces notes max 2000", () => {
    const ok = plantCareEventSchema.safeParse(buildCareEvent({ notes: "x".repeat(2000) }));
    const bad = plantCareEventSchema.safeParse({
      ...buildCareEvent(),
      notes: "x".repeat(2001),
    });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });

  it("allows multiple care types same calendar day", () => {
    const plantId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const day = "2026-10-20";
    const water = buildCareEvent({ id: "11111111-1111-4111-8111-111111111111", eventType: "water", occurredAt: day, plantId });
    const fertilize = buildCareEvent({
      id: "22222222-2222-4222-8222-222222222222",
      eventType: "fertilize",
      occurredAt: day,
      plantId,
    });
    expect(waterEventOnDay([water, fertilize], plantId, day)?.eventType).toBe("water");
    expect([water, fertilize].every((e) => plantCareEventSchema.safeParse(e).success)).toBe(true);
  });
});
