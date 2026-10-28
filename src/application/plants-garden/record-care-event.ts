import type { PlantsGardenCareEventRepository } from "@/application/ports/plants-garden-care-event-repository";
import type { PlantsGardenPlantRepository } from "@/application/ports/plants-garden-plant-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import { createFitnessHlc } from "@/application/fitness/hlc";
import { localCalendarDate } from "@/application/fitness/today";
import {
  lastWateredDate,
  plantCareEventSchema,
  validateOccurredAtNotFuture,
  waterEventOnDay,
  type PlantCareEvent,
  type PlantCareEventType,
} from "@/domain/plant-care-event";

export type RecordCareEventUseCasesDeps = {
  careEvents: PlantsGardenCareEventRepository;
  plants: PlantsGardenPlantRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type RecordCareEventResult =
  | { kind: "created"; event: PlantCareEvent }
  | { kind: "deduped"; event: PlantCareEvent };

export type RecordCareEventUseCases = {
  listEventsForPlant(plantId: string): Promise<PlantCareEvent[]>;
  lastWateredForPlant(plantId: string): Promise<string | null>;
  recordPlantWatered(plantId: string, occurredAt: string): Promise<RecordCareEventResult>;
  recordCareEvent(input: {
    plantId: string;
    eventType: PlantCareEventType;
    occurredAt: string;
    notes?: string | null;
    seasonalHintId?: string | null;
  }): Promise<RecordCareEventResult>;
};

export function createRecordCareEventUseCases(deps: RecordCareEventUseCasesDeps): RecordCareEventUseCases {
  const hlc = createFitnessHlc(deps.meta, deps.idGenerator, deps.now);

  async function ensurePlant(plantId: string): Promise<void> {
    const plant = await deps.plants.get(plantId);
    if (plant === undefined || plant.deletedAt !== null) throw new Error("plant not found");
  }

  async function appendEvent(input: {
    plantId: string;
    eventType: PlantCareEventType;
    occurredAt: string;
    notes?: string | null;
    seasonalHintId?: string | null;
  }): Promise<RecordCareEventResult> {
    await ensurePlant(input.plantId);
    const today = localCalendarDate(deps.now());
    const dateErr = validateOccurredAtNotFuture(input.occurredAt, today);
    if (dateErr !== null) throw new Error(dateErr);

    const existing = await deps.careEvents.listByPlant(input.plantId);
    if (input.eventType === "water") {
      const dup = waterEventOnDay(existing, input.plantId, input.occurredAt);
      if (dup !== undefined) return { kind: "deduped", event: dup };
    }

    const stamp = await hlc.nextFieldStamp();
    const event = plantCareEventSchema.parse({
      id: deps.idGenerator.newId(),
      plantId: input.plantId,
      eventType: input.eventType,
      occurredAt: input.occurredAt,
      notes: input.notes ?? null,
      seasonalHintId: input.seasonalHintId ?? null,
      deletedAt: null,
      fieldsUpdatedAt: {
        plantId: stamp,
        eventType: stamp,
        occurredAt: stamp,
        notes: stamp,
        seasonalHintId: stamp,
      },
    }) as PlantCareEvent;
    const saved = await deps.careEvents.upsert(event);
    return { kind: "created", event: saved };
  }

  return {
    listEventsForPlant: (plantId) => deps.careEvents.listByPlant(plantId),

    async lastWateredForPlant(plantId) {
      const events = await deps.careEvents.listByPlant(plantId);
      return lastWateredDate(events);
    },

    recordPlantWatered: (plantId, occurredAt) =>
      appendEvent({ plantId, eventType: "water", occurredAt }),

    recordCareEvent: (input) => appendEvent(input),
  };
}
