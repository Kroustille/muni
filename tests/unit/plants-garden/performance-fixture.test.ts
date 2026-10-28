import { describe, expect, it } from "vitest";

import { buildCareEvent, buildPlant } from "./fixtures";

/**
 * SC-002 performance checklist: 20 plants × ~10 events each stays bounded for list derivation.
 * Manual UX scroll check in quickstart; this test pins fixture scale only.
 */
describe("plants garden performance fixture", () => {
  it("builds 20 plants and 200 care events for scroll scenarios", () => {
    const plants = Array.from({ length: 20 }, (_, index) =>
      buildPlant({
        id: `aaaaaaaa-bbbb-4ccc-8ddd-${String(index).padStart(12, "0")}`,
        title: `Plante ${index + 1}`,
      }),
    );
    const events = Array.from({ length: 200 }, (_, index) =>
      buildCareEvent({
        id: `bbbbbbbb-bbbb-4ccc-8ddd-${String(index).padStart(12, "0")}`,
        plantId: plants[index % plants.length]!.id,
        occurredAt: `2026-10-${String((index % 28) + 1).padStart(2, "0")}`,
      }),
    );
    expect(plants).toHaveLength(20);
    expect(events).toHaveLength(200);
  });
});
