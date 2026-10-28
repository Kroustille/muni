import { describe, expect, it } from "vitest";

import { waterEventOnDay } from "@/domain/plant-care-event";
import { buildCareEvent } from "./fixtures";

describe("water dedupe", () => {
  it("finds at most one water event per plant per calendar day", () => {
    const plantId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const day = "2026-10-20";
    const first = buildCareEvent({ id: "11111111-1111-4111-8111-111111111111", plantId, occurredAt: day });
    const second = buildCareEvent({
      id: "22222222-2222-4222-8222-222222222222",
      plantId,
      occurredAt: day,
    });
    expect(waterEventOnDay([first], plantId, day)?.id).toBe(first.id);
    expect(waterEventOnDay([first, second], plantId, day)?.id).toBe(first.id);
  });
});
