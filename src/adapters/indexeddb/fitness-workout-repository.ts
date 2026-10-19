import type { FitnessWorkoutLog } from "@/domain/fitness/workout-log";
import type { FitnessWorkoutRepository, Unsubscribe } from "@/application/ports/fitness-workout-repository";
import type { MuniDb } from "./db";

export function createIndexedDbFitnessWorkoutRepository(db: MuniDb): FitnessWorkoutRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("fitnessWorkoutLogs", id),

    async list() {
      const rows = await db.getAll("fitnessWorkoutLogs");
      return rows
        .filter((l) => l.deletedAt === null)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    },

    async getInProgress() {
      const rows = await db.getAllFromIndex("fitnessWorkoutLogs", "status", "in_progress");
      return rows.find((l) => l.deletedAt === null);
    },

    async upsert(log, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["fitnessWorkoutLogs", "fitnessWorkoutOutbox"], "readwrite");
      await tx.objectStore("fitnessWorkoutLogs").put(log);
      if (enqueue) await tx.objectStore("fitnessWorkoutOutbox").put({ id: log.id });
      await tx.done;
      notify();
      return log;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("fitnessWorkoutOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("fitnessWorkoutOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
