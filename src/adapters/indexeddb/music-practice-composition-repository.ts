import type { MusicComposition } from "@/domain/music-composition";
import type {
  MusicPracticeCompositionRepository,
  Unsubscribe,
} from "@/application/ports/music-practice-composition-repository";
import type { MuniDb } from "./db";

export function createIndexedDbMusicPracticeCompositionRepository(
  db: MuniDb,
): MusicPracticeCompositionRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("musicPracticeCompositions", id),

    async list() {
      return (await db.getAll("musicPracticeCompositions")).filter((c) => c.deletedAt === null);
    },

    async upsert(composition, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["musicPracticeCompositions", "musicPracticeCompositionOutbox"], "readwrite");
      await tx.objectStore("musicPracticeCompositions").put(composition);
      if (enqueue) await tx.objectStore("musicPracticeCompositionOutbox").put({ id: composition.id });
      await tx.done;
      notify();
      return composition;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("musicPracticeCompositionOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("musicPracticeCompositionOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
