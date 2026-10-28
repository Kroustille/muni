import { describe, expect, it } from "vitest";

import { mergePlant } from "@/domain/plant";
import { mergePlantCareEvent } from "@/domain/plant-care-event";
import type { PlantWire } from "@/domain/plant";
import type { PlantCareEventWire } from "@/domain/plant-care-event";

describe("plants merge LWW", () => {
  it("mergePlant picks newer title stamp", () => {
    const local: PlantWire = {
      id: "11111111-2222-4333-8444-555555555555",
      title: "Local",
      location_tag: "indoor",
      notes: null,
      care_profile_id: null,
      seasonal_hints: [],
      deleted_at: null,
      fields_updated_at: { title: "2026-01-01T00:00:00.000Z-1-a" },
    };
    const remote: PlantWire = {
      ...local,
      title: "Remote",
      fields_updated_at: { title: "2026-01-02T00:00:00.000Z-1-b" },
    };
    const merged = mergePlant(local, remote);
    expect(merged.title).toBe("Remote");
  });

  it("mergePlantCareEvent keeps remote occurred_at when newer", () => {
    const local: PlantCareEventWire = {
      id: "22222222-3333-4333-8444-555555555555",
      plant_id: "11111111-2222-4333-8444-555555555555",
      event_type: "water",
      occurred_at: "2026-10-01",
      notes: null,
      seasonal_hint_id: null,
      deleted_at: null,
      fields_updated_at: { occurred_at: "2026-01-01T00:00:00.000Z-1-a" },
    };
    const remote: PlantCareEventWire = {
      ...local,
      occurred_at: "2026-10-02",
      fields_updated_at: { occurred_at: "2026-01-02T00:00:00.000Z-1-b" },
    };
    expect(mergePlantCareEvent(local, remote).occurred_at).toBe("2026-10-02");
  });
});
