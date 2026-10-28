import { plantCareEventSchema, type PlantCareEvent } from "@/domain/plant-care-event";
import { plantSchema, type Plant } from "@/domain/plant";

const STAMP = "2026-01-01T12:00:00.000Z-0-dev";

export function buildPlant(overrides: Partial<Plant> = {}): Plant {
  return plantSchema.parse({
    id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    title: "Monstera",
    locationTag: "indoor",
    notes: null,
    careProfileId: null,
    seasonalHints: [],
    deletedAt: null,
    fieldsUpdatedAt: { title: STAMP, locationTag: STAMP },
    ...overrides,
  }) as Plant;
}

export function buildCareEvent(overrides: Partial<PlantCareEvent> = {}): PlantCareEvent {
  return plantCareEventSchema.parse({
    id: "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    plantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    eventType: "water",
    occurredAt: "2026-10-20",
    notes: null,
    seasonalHintId: null,
    deletedAt: null,
    fieldsUpdatedAt: { occurredAt: STAMP, eventType: STAMP },
    ...overrides,
  }) as PlantCareEvent;
}
