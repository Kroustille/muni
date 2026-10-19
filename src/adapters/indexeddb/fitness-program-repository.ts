import type { FitnessProgram } from "@/domain/fitness/program";
import type { FitnessProgramRepository, Unsubscribe } from "@/application/ports/fitness-program-repository";
import type { MuniDb } from "./db";

export function createIndexedDbFitnessProgramRepository(db: MuniDb): FitnessProgramRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("fitnessPrograms", id),

    async getActive() {
      const rows = await db.getAll("fitnessPrograms");
      return rows.find((p) => p.isActive && p.deletedAt === null);
    },

    async list() {
      return (await db.getAll("fitnessPrograms")).filter((p) => p.deletedAt === null);
    },

    async upsert(program, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["fitnessPrograms", "fitnessProgramOutbox"], "readwrite");
      await tx.objectStore("fitnessPrograms").put(program);
      if (enqueue) await tx.objectStore("fitnessProgramOutbox").put({ id: program.id });
      await tx.done;
      notify();
      return program;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("fitnessProgramOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("fitnessProgramOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
