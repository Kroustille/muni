import type { MusicPracticeLearningPieceRepository } from "@/application/ports/music-practice-learning-piece-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import {
  learningPieceSchema,
  validateLearningPiece,
  type LearningPiece,
  type LearningPieceStatus,
} from "@/domain/learning-piece";
import { localCalendarDate } from "@/domain/music-practice-dates";
import { createMusicPracticeHlc } from "./hlc";

export type LearningPieceUseCasesDeps = {
  learningPieces: MusicPracticeLearningPieceRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type LearningPiecePatch = Partial<
  Pick<
    LearningPiece,
    "title" | "instrumentId" | "status" | "linkedTrackId" | "startedAt" | "notes"
  >
>;

export type LearningPieceUseCases = {
  listLearningPieces(): Promise<LearningPiece[]>;
  getLearningPiece(id: string): Promise<LearningPiece | undefined>;
  upsertLearningPiece(piece: LearningPiece): Promise<LearningPiece>;
  deleteLearningPiece(id: string): Promise<LearningPiece>;
  createPiece(input: { title: string; instrumentId?: string | null }): Promise<LearningPiece>;
  updatePiece(id: string, patch: LearningPiecePatch): Promise<LearningPiece>;
  restoreLearningPiece(id: string): Promise<LearningPiece>;
};

export function createLearningPieceUseCases(deps: LearningPieceUseCasesDeps): LearningPieceUseCases {
  const hlc = createMusicPracticeHlc(deps.meta, deps.idGenerator, deps.now);

  async function save(piece: LearningPiece): Promise<LearningPiece> {
    const err = validateLearningPiece(piece, localCalendarDate(deps.now()));
    if (err !== null) throw new Error(err);
    return deps.learningPieces.upsert(learningPieceSchema.parse(piece) as LearningPiece);
  }

  return {
    listLearningPieces: () => deps.learningPieces.list(),
    getLearningPiece: (id) => deps.learningPieces.get(id),

    async createPiece(input) {
      const stamp = await hlc.nextFieldStamp();
      return save({
        id: deps.idGenerator.newId(),
        title: input.title.trim(),
        instrumentId: input.instrumentId ?? null,
        status: "learning" satisfies LearningPieceStatus,
        linkedTrackId: null,
        startedAt: null,
        lastPracticedAt: null,
        notes: null,
        deletedAt: null,
        fieldsUpdatedAt: { title: stamp, status: stamp },
      });
    },

    async updatePiece(id, patch) {
      const current = await deps.learningPieces.get(id);
      if (current === undefined || current.deletedAt !== null) throw new Error("learning piece not found");
      const stamp = await hlc.nextFieldStamp();
      const next: LearningPiece = { ...current, fieldsUpdatedAt: { ...current.fieldsUpdatedAt } };
      const assign = <K extends keyof LearningPiecePatch>(key: K, value: LearningPiecePatch[K]) => {
        if (value === undefined) return;
        (next as Record<string, unknown>)[key as string] = value;
        next.fieldsUpdatedAt[key as string] = stamp;
      };
      assign("title", patch.title?.trim());
      assign("instrumentId", patch.instrumentId);
      assign("status", patch.status);
      assign("linkedTrackId", patch.linkedTrackId);
      assign("startedAt", patch.startedAt);
      assign("notes", patch.notes);
      return save(next);
    },

    async upsertLearningPiece(piece) {
      const err = validateLearningPiece(piece, localCalendarDate(deps.now()));
      if (err !== null) throw new Error(err);
      const stamp = await hlc.nextFieldStamp();
      return deps.learningPieces.upsert(
        learningPieceSchema.parse({
          ...piece,
          fieldsUpdatedAt: { ...piece.fieldsUpdatedAt, title: stamp, status: stamp },
        }) as LearningPiece,
      );
    },

    async deleteLearningPiece(id) {
      const current = await deps.learningPieces.get(id);
      if (current === undefined) throw new Error("learning piece not found");
      const stamp = await hlc.nextFieldStamp();
      return deps.learningPieces.upsert(
        learningPieceSchema.parse({
          ...current,
          deletedAt: new Date(deps.now()).toISOString(),
          fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
        }) as LearningPiece,
      );
    },

    async restoreLearningPiece(id) {
      const current = await deps.learningPieces.get(id);
      if (current === undefined) throw new Error("learning piece not found");
      const stamp = await hlc.nextFieldStamp();
      return save({
        ...current,
        deletedAt: null,
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      });
    },
  };
}
