import type { VegetableCulture } from "@/domain/vegetable-culture";
import type {
  PlantsGardenCultureRepository,
  Unsubscribe,
} from "@/application/ports/plants-garden-culture-repository";
import type { MuniDb } from "./db";

export function createIndexedDbPlantsGardenCultureRepository(db: MuniDb): PlantsGardenCultureRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("vegetableCultures", id),

    async list() {
      const rows = await db.getAll("vegetableCultures");
      return rows.filter((c) => c.deletedAt === null);
    },

    async upsert(culture, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["vegetableCultures", "vegetableCultureOutbox"], "readwrite");
      await tx.objectStore("vegetableCultures").put(culture);
      if (enqueue) await tx.objectStore("vegetableCultureOutbox").put({ id: culture.id });
      await tx.done;
      notify();
      return culture;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("vegetableCultureOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("vegetableCultureOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
