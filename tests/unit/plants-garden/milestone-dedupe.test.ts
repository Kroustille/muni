import { describe, expect, it } from "vitest";

import { milestoneOnDay } from "@/domain/vegetable-milestone";
import { vegetableMilestoneSchema } from "@/domain/vegetable-milestone";

describe("milestone dedupe", () => {
  it("dedupes per cultureId milestoneType calendar day", () => {
    const cultureId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const day = "2026-06-01";
    const first = vegetableMilestoneSchema.parse({
      id: "11111111-1111-4111-8111-111111111111",
      cultureId,
      milestoneType: "sow",
      occurredAt: day,
      notes: null,
      deletedAt: null,
      fieldsUpdatedAt: { occurredAt: "2026-01-01T12:00:00.000Z-0-dev" },
    });
    const second = vegetableMilestoneSchema.parse({
      ...first,
      id: "22222222-2222-4222-8222-222222222222",
    });
    expect(milestoneOnDay([first], cultureId, "sow", day)?.id).toBe(first.id);
    expect(milestoneOnDay([first, second], cultureId, "sow", day)?.id).toBe(first.id);
    expect(milestoneOnDay([first], cultureId, "harvest", day)).toBeUndefined();
  });
});
