import type { PracticePlan } from "@/domain/practice-plan";
import type { MusicPracticePlanRepository, Unsubscribe } from "@/application/ports/music-practice-plan-repository";
import type { MuniDb } from "./db";

export function createIndexedDbMusicPracticePlanRepository(db: MuniDb): MusicPracticePlanRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("musicPracticePlans", id),

    async getActive() {
      const rows = await db.getAll("musicPracticePlans");
      return rows.find((p) => p.isActive && p.deletedAt === null);
    },

    async list() {
      return (await db.getAll("musicPracticePlans")).filter((p) => p.deletedAt === null);
    },

    async upsert(plan, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["musicPracticePlans", "musicPracticePlanOutbox"], "readwrite");
      await tx.objectStore("musicPracticePlans").put(plan);
      if (enqueue) await tx.objectStore("musicPracticePlanOutbox").put({ id: plan.id });
      await tx.done;
      notify();
      return plan;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("musicPracticePlanOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("musicPracticePlanOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
