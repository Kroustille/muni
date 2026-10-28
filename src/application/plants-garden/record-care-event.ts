import type { PlantsGardenCareEventRepository } from "@/application/ports/plants-garden-care-event-repository";
import type { PlantCareEvent } from "@/domain/plant-care-event";

export type RecordCareEventUseCasesDeps = {
  careEvents: PlantsGardenCareEventRepository;
};

export type RecordCareEventUseCases = {
  recordPlantWatered(plantId: string, occurredAt: string): Promise<PlantCareEvent>;
  recordCareEvent(input: {
    plantId: string;
    eventType: PlantCareEvent["eventType"];
    occurredAt: string;
  }): Promise<PlantCareEvent>;
};

export function createRecordCareEventUseCases(_deps: RecordCareEventUseCasesDeps): RecordCareEventUseCases {
  return {
    recordPlantWatered: async () => {
      throw new Error("recordPlantWatered not implemented");
    },
    recordCareEvent: async () => {
      throw new Error("recordCareEvent not implemented");
    },
  };
}
