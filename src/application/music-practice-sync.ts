import {
  musicCompositionToWire,
  wireToMusicComposition,
  type MusicCompositionWire,
} from "@/domain/music-composition";
import { djSetToWire, wireToDjSet, type DjSetWire } from "@/domain/dj-set";
import {
  practiceInstrumentToWire,
  wireToPracticeInstrument,
  type PracticeInstrumentWire,
} from "@/domain/practice-instrument";
import {
  practiceExerciseToWire,
  wireToPracticeExercise,
  type PracticeExerciseWire,
} from "@/domain/practice-exercise";
import {
  practicePlanToWire,
  wireToPracticePlan,
  type PracticePlanWire,
} from "@/domain/practice-plan";
import { practiceLogToWire, wireToPracticeLog, type PracticeLogWire } from "@/domain/practice-log";
import {
  learningPieceToWire,
  wireToLearningPiece,
  type LearningPieceWire,
} from "@/domain/learning-piece";
import type { MusicPracticeCompositionRepository } from "@/application/ports/music-practice-composition-repository";
import type { MusicPracticeDjSetRepository } from "@/application/ports/music-practice-dj-set-repository";
import type { MusicPracticeInstrumentRepository } from "@/application/ports/music-practice-instrument-repository";
import type { MusicPracticeExerciseRepository } from "@/application/ports/music-practice-exercise-repository";
import type { MusicPracticePlanRepository } from "@/application/ports/music-practice-plan-repository";
import type { MusicPracticeLogRepository } from "@/application/ports/music-practice-log-repository";
import type { MusicPracticeLearningPieceRepository } from "@/application/ports/music-practice-learning-piece-repository";
import type { MusicPracticeSyncPayload } from "@/application/ports/music-practice-remote-store";

export type { MusicPracticeSyncPayload };

export type MusicPracticeSyncApplyDeps = {
  compositions: MusicPracticeCompositionRepository;
  djSets: MusicPracticeDjSetRepository;
  instruments: MusicPracticeInstrumentRepository;
  exercises: MusicPracticeExerciseRepository;
  plans: MusicPracticePlanRepository;
  logs: MusicPracticeLogRepository;
  learningPieces: MusicPracticeLearningPieceRepository;
};

export type MusicPracticeSyncApply = {
  applyRemote(payload: MusicPracticeSyncPayload): Promise<void>;
  collectPushPayload(): Promise<MusicPracticeSyncPayload>;
  clearOutboxes(payload: {
    compositionIds: string[];
    djSetIds: string[];
    instrumentIds: string[];
    exerciseIds: string[];
    planIds: string[];
    logIds: string[];
    learningPieceIds: string[];
  }): Promise<void>;
};

async function loadByOutbox<T>(
  ids: string[],
  get: (id: string) => Promise<T | undefined>,
): Promise<T[]> {
  return (await Promise.all(ids.map((id) => get(id)))).filter(
    (row): row is NonNullable<typeof row> => row !== undefined,
  );
}

export function createMusicPracticeSyncApply(deps: MusicPracticeSyncApplyDeps): MusicPracticeSyncApply {
  return {
    async applyRemote(payload) {
      for (const wire of payload.compositions) {
        await deps.compositions.upsert(wireToMusicComposition(wire), { enqueue: false });
      }
      for (const wire of payload.djSets) {
        await deps.djSets.upsert(wireToDjSet(wire), { enqueue: false });
      }
      for (const wire of payload.instruments) {
        await deps.instruments.upsert(wireToPracticeInstrument(wire), { enqueue: false });
      }
      for (const wire of payload.exercises) {
        await deps.exercises.upsert(wireToPracticeExercise(wire), { enqueue: false });
      }
      for (const wire of payload.plans) {
        await deps.plans.upsert(wireToPracticePlan(wire), { enqueue: false });
      }
      for (const wire of payload.logs) {
        await deps.logs.upsert(wireToPracticeLog(wire), { enqueue: false });
      }
      for (const wire of payload.learningPieces) {
        await deps.learningPieces.upsert(wireToLearningPiece(wire), { enqueue: false });
      }
    },

    async collectPushPayload() {
      const [
        compositionIds,
        djSetIds,
        instrumentIds,
        exerciseIds,
        planIds,
        logIds,
        learningPieceIds,
      ] = await Promise.all([
        deps.compositions.outbox(),
        deps.djSets.outbox(),
        deps.instruments.outbox(),
        deps.exercises.outbox(),
        deps.plans.outbox(),
        deps.logs.outbox(),
        deps.learningPieces.outbox(),
      ]);
      const [compositions, djSets, instruments, exercises, plans, logs, learningPieces] =
        await Promise.all([
          loadByOutbox(compositionIds, (id) => deps.compositions.get(id)),
          loadByOutbox(djSetIds, (id) => deps.djSets.get(id)),
          loadByOutbox(instrumentIds, (id) => deps.instruments.get(id)),
          loadByOutbox(exerciseIds, (id) => deps.exercises.get(id)),
          loadByOutbox(planIds, (id) => deps.plans.get(id)),
          loadByOutbox(logIds, (id) => deps.logs.get(id)),
          loadByOutbox(learningPieceIds, (id) => deps.learningPieces.get(id)),
        ]);
      return {
        compositions: compositions.map((c) => musicCompositionToWire(c)),
        djSets: djSets.map((s) => djSetToWire(s)),
        instruments: instruments.map((i) => practiceInstrumentToWire(i)),
        exercises: exercises.map((e) => practiceExerciseToWire(e)),
        plans: plans.map((p) => practicePlanToWire(p)),
        logs: logs.map((l) => practiceLogToWire(l)),
        learningPieces: learningPieces.map((p) => learningPieceToWire(p)),
      };
    },

    async clearOutboxes(payload) {
      await Promise.all([
        deps.compositions.clearOutbox(payload.compositionIds),
        deps.djSets.clearOutbox(payload.djSetIds),
        deps.instruments.clearOutbox(payload.instrumentIds),
        deps.exercises.clearOutbox(payload.exerciseIds),
        deps.plans.clearOutbox(payload.planIds),
        deps.logs.clearOutbox(payload.logIds),
        deps.learningPieces.clearOutbox(payload.learningPieceIds),
      ]);
    },
  };
}
