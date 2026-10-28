import type { PlantWire } from "@/domain/plant";
import type { PlantCareEventWire } from "@/domain/plant-care-event";
import type { PlantCareProfileWire } from "@/domain/plant-care-profile";
import type { VegetableCultureWire } from "@/domain/vegetable-culture";
import type { VegetableMilestoneWire } from "@/domain/vegetable-milestone";
import { RemoteStoreError, type RowError } from "@/application/ports/remote-store";

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

export function createHttpPlantsGardenRemoteStore(deps: {
  fetch: typeof globalThis.fetch;
  baseUrl: string;
}): PlantsGardenRemoteStore {
  const joinUrl = (path: string) => `${deps.baseUrl.replace(/\/$/, "")}${path}`;

  async function request(url: string, init?: RequestInit): Promise<unknown> {
    try {
      const response = await deps.fetch(url, { credentials: "include", ...init });
      if (response.status === 401) throw new RemoteStoreError("unauthenticated");
      const text = await response.text();
      const body = text ? JSON.parse(text) : undefined;
      if (response.status === 422) {
        throw new RemoteStoreError("validation", (body as { errors?: RowError[] })?.errors ?? []);
      }
      if (!response.ok) throw new RemoteStoreError("network", [], `HTTP ${response.status}`);
      return body;
    } catch (error) {
      if (error instanceof RemoteStoreError) throw error;
      if (error instanceof TypeError) throw new RemoteStoreError("network");
      throw error;
    }
  }

  return {
    async push(body) {
      const result = await request(joinUrl("/api/sync/plants-garden/push"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return result as PlantsGardenPullResult;
    },

    async pull(since, limit) {
      const params = new URLSearchParams();
      if (since !== null) params.set("since", since);
      params.set("limit", String(limit));
      const query = params.toString();
      const path = query ? `/api/sync/plants-garden/pull?${query}` : "/api/sync/plants-garden/pull";
      const result = await request(joinUrl(path));
      return result as PlantsGardenPullResult;
    },
  };
}
