import type { FitnessSkipRecord } from "@/domain/fitness/workout-log";
import type { FitnessSkipRepository, Unsubscribe } from "@/application/ports/fitness-skip-repository";
import type { MuniDb } from "./db";

export function createIndexedDbFitnessSkipRepository(db: MuniDb): FitnessSkipRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("fitnessSkipRecords", id),

    async list() {
      return (await db.getAll("fitnessSkipRecords")).filter((r) => r.deletedAt === null);
    },

    async upsert(record, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["fitnessSkipRecords", "fitnessSkipOutbox"], "readwrite");
      await tx.objectStore("fitnessSkipRecords").put(record);
      if (enqueue) await tx.objectStore("fitnessSkipOutbox").put({ id: record.id });
      await tx.done;
      notify();
      return record;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("fitnessSkipOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("fitnessSkipOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
