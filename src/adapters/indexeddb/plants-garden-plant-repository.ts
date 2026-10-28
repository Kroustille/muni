import type { Plant } from "@/domain/plant";
import type { PlantsGardenPlantRepository, Unsubscribe } from "@/application/ports/plants-garden-plant-repository";
import type { MuniDb } from "./db";

export function createIndexedDbPlantsGardenPlantRepository(db: MuniDb): PlantsGardenPlantRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("plants", id),

    async list(includeDeleted = false) {
      const rows = await db.getAll("plants");
      if (includeDeleted) return rows;
      return rows.filter((p) => p.deletedAt === null);
    },

    async upsert(plant, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["plants", "plantsOutbox"], "readwrite");
      await tx.objectStore("plants").put(plant);
      if (enqueue) await tx.objectStore("plantsOutbox").put({ id: plant.id });
      await tx.done;
      notify();
      return plant;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("plantsOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("plantsOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
