import type { PracticeExercise } from "@/domain/practice-exercise";
import type {
  MusicPracticeExerciseRepository,
  Unsubscribe,
} from "@/application/ports/music-practice-exercise-repository";
import type { MuniDb } from "./db";

export function createIndexedDbMusicPracticeExerciseRepository(
  db: MuniDb,
): MusicPracticeExerciseRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("musicPracticeExercises", id),

    async list() {
      return (await db.getAll("musicPracticeExercises")).filter((e) => e.deletedAt === null);
    },

    async upsert(exercise, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["musicPracticeExercises", "musicPracticeExerciseOutbox"], "readwrite");
      await tx.objectStore("musicPracticeExercises").put(exercise);
      if (enqueue) await tx.objectStore("musicPracticeExerciseOutbox").put({ id: exercise.id });
      await tx.done;
      notify();
      return exercise;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("musicPracticeExerciseOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("musicPracticeExerciseOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
