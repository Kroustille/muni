import type { PracticeLog } from "@/domain/practice-log";
import type { MusicPracticeLogRepository, Unsubscribe } from "@/application/ports/music-practice-log-repository";
import type { MuniDb } from "./db";

export function createIndexedDbMusicPracticeLogRepository(db: MuniDb): MusicPracticeLogRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("musicPracticeLogs", id),

    async list() {
      const rows = await db.getAll("musicPracticeLogs");
      return rows
        .filter((l) => l.deletedAt === null)
        .sort((a, b) => b.practicedAt.localeCompare(a.practicedAt));
    },

    async upsert(log, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["musicPracticeLogs", "musicPracticeLogOutbox"], "readwrite");
      await tx.objectStore("musicPracticeLogs").put(log);
      if (enqueue) await tx.objectStore("musicPracticeLogOutbox").put({ id: log.id });
      await tx.done;
      notify();
      return log;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("musicPracticeLogOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("musicPracticeLogOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
