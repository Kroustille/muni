import type {
  PlantsGardenCareEventRepository,
  Unsubscribe,
} from "@/application/ports/plants-garden-care-event-repository";
import type { MuniDb } from "./db";

function inCalendarRange(occurredAt: string, from: string, to: string): boolean {
  return occurredAt >= from && occurredAt <= to;
}

export function createIndexedDbPlantsGardenCareEventRepository(db: MuniDb): PlantsGardenCareEventRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("plantCareEvents", id),

    async listByPlant(plantId) {
      const rows = await db.getAllFromIndex("plantCareEvents", "plantId", plantId);
      return rows.filter((e) => e.deletedAt === null);
    },

    async listAll() {
      const rows = await db.getAll("plantCareEvents");
      return rows.filter((e) => e.deletedAt === null);
    },

    async listInRange(from, to) {
      const rows = await db.getAll("plantCareEvents");
      return rows.filter(
        (e) => e.deletedAt === null && inCalendarRange(e.occurredAt, from, to),
      );
    },

    async upsert(event, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["plantCareEvents", "plantCareEventOutbox"], "readwrite");
      await tx.objectStore("plantCareEvents").put(event);
      if (enqueue) await tx.objectStore("plantCareEventOutbox").put({ id: event.id });
      await tx.done;
      notify();
      return event;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("plantCareEventOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("plantCareEventOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
