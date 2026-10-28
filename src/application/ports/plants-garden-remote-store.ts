import type { PlantWire } from "@/domain/plant";
import type { PlantCareEventWire } from "@/domain/plant-care-event";
import type { PlantCareProfileWire } from "@/domain/plant-care-profile";
import type { VegetableCultureWire } from "@/domain/vegetable-culture";
import type { VegetableMilestoneWire } from "@/domain/vegetable-milestone";

export type PlantsGardenPullResult = {
  plants: PlantWire[];
  careEvents: PlantCareEventWire[];
  careProfiles: PlantCareProfileWire[];
  cultures: VegetableCultureWire[];
  milestones: VegetableMilestoneWire[];
  cursor: string;
};

export type PlantsGardenRemoteStore = {
  push(body: {
    plants: PlantWire[];
    careEvents: PlantCareEventWire[];
    careProfiles: PlantCareProfileWire[];
    cultures: VegetableCultureWire[];
    milestones: VegetableMilestoneWire[];
  }): Promise<PlantsGardenPullResult>;
  pull(since: string | null, limit: number): Promise<PlantsGardenPullResult>;
};
