import type { MusicPracticeLogRepository } from "@/application/ports/music-practice-log-repository";
import type { MusicPracticeLearningPieceRepository } from "@/application/ports/music-practice-learning-piece-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import { practiceLogSchema, validatePracticeLog, type PracticeLog } from "@/domain/practice-log";
import { learningPieceSchema } from "@/domain/learning-piece";
import { localCalendarDate } from "@/domain/music-practice-dates";
import { createMusicPracticeHlc } from "./hlc";

export type PracticeLogUseCasesDeps = {
  logs: MusicPracticeLogRepository;
  learningPieces: MusicPracticeLearningPieceRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type MarkDoneTodayInput = {
  exerciseIds: string[];
  instrumentId?: string | null;
  learningPieceId?: string | null;
  durationMinutes?: number | null;
  notes?: string | null;
};

export type PracticeLogUseCases = {
  listLogs(): Promise<PracticeLog[]>;
  getLog(id: string): Promise<PracticeLog | undefined>;
  upsertLog(log: PracticeLog): Promise<PracticeLog>;
  deleteLog(id: string): Promise<PracticeLog>;
  markDoneToday(input: MarkDoneTodayInput): Promise<PracticeLog>;
  restoreLog(id: string): Promise<PracticeLog>;
};

export function createPracticeLogUseCases(deps: PracticeLogUseCasesDeps): PracticeLogUseCases {
  const hlc = createMusicPracticeHlc(deps.meta, deps.idGenerator, deps.now);

  async function touchLearningPiece(log: PracticeLog): Promise<void> {
    if (log.learningPieceId === null) return;
    const piece = await deps.learningPieces.get(log.learningPieceId);
    if (piece === undefined || piece.deletedAt !== null) return;
    if (piece.lastPracticedAt !== null && piece.lastPracticedAt >= log.practicedAt) return;
    const stamp = await hlc.nextFieldStamp();
    await deps.learningPieces.upsert(
      learningPieceSchema.parse({
        ...piece,
        lastPracticedAt: log.practicedAt,
        fieldsUpdatedAt: { ...piece.fieldsUpdatedAt, lastPracticedAt: stamp },
      }),
    );
  }

  return {
    listLogs: () => deps.logs.list(),
    getLog: (id) => deps.logs.get(id),

    async markDoneToday(input) {
      const stamp = await hlc.nextFieldStamp();
      const today = localCalendarDate(deps.now());
      const log = practiceLogSchema.parse({
        id: deps.idGenerator.newId(),
        practicedAt: today,
        practiceKind: "structured",
        instrumentId: input.instrumentId ?? null,
        exerciseIds: input.exerciseIds,
        learningPieceId: input.learningPieceId ?? null,
        durationMinutes: input.durationMinutes ?? null,
        notes: input.notes ?? null,
        deletedAt: null,
        fieldsUpdatedAt: {
          practicedAt: stamp,
          exerciseIds: stamp,
          instrumentId: stamp,
          learningPieceId: stamp,
        },
      }) as PracticeLog;
      const err = validatePracticeLog(log, today);
      if (err !== null) throw new Error(err);
      const saved = await deps.logs.upsert(log);
      await touchLearningPiece(saved);
      return saved;
    },

    async upsertLog(log) {
      const err = validatePracticeLog(log, localCalendarDate(deps.now()));
      if (err !== null) throw new Error(err);
      const stamp = await hlc.nextFieldStamp();
      const saved = await deps.logs.upsert(
        practiceLogSchema.parse({
          ...log,
          fieldsUpdatedAt: { ...log.fieldsUpdatedAt, practicedAt: stamp },
        }) as PracticeLog,
      );
      await touchLearningPiece(saved);
      return saved;
    },

    async deleteLog(id) {
      const current = await deps.logs.get(id);
      if (current === undefined) throw new Error("log not found");
      const stamp = await hlc.nextFieldStamp();
      return deps.logs.upsert(
        practiceLogSchema.parse({
          ...current,
          deletedAt: new Date(deps.now()).toISOString(),
          fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
        }) as PracticeLog,
      );
    },

    async restoreLog(id) {
      const current = await deps.logs.get(id);
      if (current === undefined) throw new Error("log not found");
      const stamp = await hlc.nextFieldStamp();
      const restored = practiceLogSchema.parse({
        ...current,
        deletedAt: null,
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      }) as PracticeLog;
      const err = validatePracticeLog(restored, localCalendarDate(deps.now()));
      if (err !== null) throw new Error(err);
      return deps.logs.upsert(restored);
    },
  };
}
