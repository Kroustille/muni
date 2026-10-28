import type { LearningPiece } from "@/domain/learning-piece";
import type {
  MusicPracticeLearningPieceRepository,
  Unsubscribe,
} from "@/application/ports/music-practice-learning-piece-repository";
import type { MuniDb } from "./db";

export function createIndexedDbMusicPracticeLearningPieceRepository(
  db: MuniDb,
): MusicPracticeLearningPieceRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("musicPracticeLearningPieces", id),

    async list() {
      return (await db.getAll("musicPracticeLearningPieces")).filter((p) => p.deletedAt === null);
    },

    async upsert(piece, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(
        ["musicPracticeLearningPieces", "musicPracticeLearningPieceOutbox"],
        "readwrite",
      );
      await tx.objectStore("musicPracticeLearningPieces").put(piece);
      if (enqueue) await tx.objectStore("musicPracticeLearningPieceOutbox").put({ id: piece.id });
      await tx.done;
      notify();
      return piece;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("musicPracticeLearningPieceOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("musicPracticeLearningPieceOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
