import type { PracticeInstrument } from "@/domain/practice-instrument";
import type {
  MusicPracticeInstrumentRepository,
  Unsubscribe,
} from "@/application/ports/music-practice-instrument-repository";
import type { MuniDb } from "./db";

export function createIndexedDbMusicPracticeInstrumentRepository(
  db: MuniDb,
): MusicPracticeInstrumentRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("musicPracticeInstruments", id),

    async list() {
      return (await db.getAll("musicPracticeInstruments")).filter((i) => i.deletedAt === null);
    },

    async upsert(instrument, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["musicPracticeInstruments", "musicPracticeInstrumentOutbox"], "readwrite");
      await tx.objectStore("musicPracticeInstruments").put(instrument);
      if (enqueue) await tx.objectStore("musicPracticeInstrumentOutbox").put({ id: instrument.id });
      await tx.done;
      notify();
      return instrument;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("musicPracticeInstrumentOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("musicPracticeInstrumentOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
