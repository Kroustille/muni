import type { FitnessScheduledSession } from "@/domain/fitness/scheduled-session";
import type { FitnessScheduledSessionRepository, Unsubscribe } from "@/application/ports/fitness-scheduled-session-repository";
import type { MuniDb } from "./db";

export function createIndexedDbFitnessScheduledSessionRepository(db: MuniDb): FitnessScheduledSessionRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("fitnessScheduledSessions", id),

    async list() {
      return (await db.getAll("fitnessScheduledSessions")).filter((s) => s.deletedAt === null);
    },

    async listForDate(calendarDate) {
      const rows = await this.list();
      return rows
        .filter((s) => s.calendarDate === calendarDate)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },

    async upsert(row, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["fitnessScheduledSessions", "fitnessScheduledSessionOutbox"], "readwrite");
      await tx.objectStore("fitnessScheduledSessions").put(row);
      if (enqueue) await tx.objectStore("fitnessScheduledSessionOutbox").put({ id: row.id });
      await tx.done;
      notify();
      return row;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("fitnessScheduledSessionOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("fitnessScheduledSessionOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
