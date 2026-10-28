import type { DjSet } from "@/domain/dj-set";
import type { MusicPracticeDjSetRepository, Unsubscribe } from "@/application/ports/music-practice-dj-set-repository";
import type { MuniDb } from "./db";

export function createIndexedDbMusicPracticeDjSetRepository(db: MuniDb): MusicPracticeDjSetRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("musicPracticeDjSets", id),

    async list() {
      return (await db.getAll("musicPracticeDjSets")).filter((s) => s.deletedAt === null);
    },

    async upsert(djSet, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["musicPracticeDjSets", "musicPracticeDjSetOutbox"], "readwrite");
      await tx.objectStore("musicPracticeDjSets").put(djSet);
      if (enqueue) await tx.objectStore("musicPracticeDjSetOutbox").put({ id: djSet.id });
      await tx.done;
      notify();
      return djSet;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("musicPracticeDjSetOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("musicPracticeDjSetOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
