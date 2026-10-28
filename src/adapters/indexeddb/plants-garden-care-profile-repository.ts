import type { PlantCareProfile } from "@/domain/plant-care-profile";
import type {
  PlantsGardenCareProfileRepository,
  Unsubscribe,
} from "@/application/ports/plants-garden-care-profile-repository";
import type { MuniDb } from "./db";

export function createIndexedDbPlantsGardenCareProfileRepository(
  db: MuniDb,
): PlantsGardenCareProfileRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("plantCareProfiles", id),

    async list() {
      const rows = await db.getAll("plantCareProfiles");
      return rows.filter((p) => p.deletedAt === null);
    },

    async upsert(profile, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["plantCareProfiles", "plantCareProfileOutbox"], "readwrite");
      await tx.objectStore("plantCareProfiles").put(profile);
      if (enqueue) await tx.objectStore("plantCareProfileOutbox").put({ id: profile.id });
      await tx.done;
      notify();
      return profile;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("plantCareProfileOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("plantCareProfileOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
