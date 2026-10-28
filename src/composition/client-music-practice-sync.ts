import { createUuidIdGenerator } from "../adapters/browser/id-generator";
import type { MuniDb } from "../adapters/indexeddb/db";
import { createHttpMusicPracticeRemoteStore } from "../adapters/http/music-practice-remote-store";
import { createIndexedDbMusicPracticeCompositionRepository } from "../adapters/indexeddb/music-practice-composition-repository";
import { createIndexedDbMusicPracticeDjSetRepository } from "../adapters/indexeddb/music-practice-dj-set-repository";
import { createIndexedDbMusicPracticeInstrumentRepository } from "../adapters/indexeddb/music-practice-instrument-repository";
import { createIndexedDbMusicPracticeExerciseRepository } from "../adapters/indexeddb/music-practice-exercise-repository";
import { createIndexedDbMusicPracticePlanRepository } from "../adapters/indexeddb/music-practice-plan-repository";
import { createIndexedDbMusicPracticeLogRepository } from "../adapters/indexeddb/music-practice-log-repository";
import { createIndexedDbMusicPracticeLearningPieceRepository } from "../adapters/indexeddb/music-practice-learning-piece-repository";
import { createMusicPracticeSyncApply } from "../application/music-practice-sync";
import { createMusicPracticeSyncEngine } from "../application/sync/music-practice-sync-engine";
import type { ItemRepository } from "../application/ports/item-repository";
import type { PausableSyncEngine } from "./sync-run";
import {
  createMusicCompositionUseCases,
  type MusicCompositionUseCases,
} from "../application/music-practice/composition";
import { createDjSetUseCases, type DjSetUseCases } from "../application/music-practice/dj-set";
import {
  createPracticeInstrumentUseCases,
  type PracticeInstrumentUseCases,
} from "../application/music-practice/instrument";
import {
  createPracticeExerciseUseCases,
  type PracticeExerciseUseCases,
} from "../application/music-practice/exercise";
import { createPracticePlanUseCases, type PracticePlanUseCases } from "../application/music-practice/plan";
import { createPracticeLogUseCases, type PracticeLogUseCases } from "../application/music-practice/practice-log";
import {
  createLearningPieceUseCases,
  type LearningPieceUseCases,
} from "../application/music-practice/learning-piece";

export type ClientMusicPracticeBundle = {
  musicPracticeEngine: PausableSyncEngine;
  compositionUseCases: MusicCompositionUseCases;
  djSetUseCases: DjSetUseCases;
  instrumentUseCases: PracticeInstrumentUseCases;
  exerciseUseCases: PracticeExerciseUseCases;
  planUseCases: PracticePlanUseCases;
  logUseCases: PracticeLogUseCases;
  learningPieceUseCases: LearningPieceUseCases;
};

const MUTATION_METHODS = [
  "upsertComposition",
  "deleteComposition",
  "createComposition",
  "updateComposition",
  "appendSessionNote",
  "restoreComposition",
  "upsertDjSet",
  "deleteDjSet",
  "createDjSet",
  "updateDjSet",
  "markPerformed",
  "cancelDjSet",
  "restoreDjSet",
  "transitionPlannedToPerformed",
  "upsertInstrument",
  "deleteInstrument",
  "createQuick",
  "restoreInstrument",
  "upsertExercise",
  "deleteExercise",
  "restoreExercise",
  "upsertPlan",
  "deletePlan",
  "createPlan",
  "restorePlan",
  "upsertLog",
  "deleteLog",
  "markDoneToday",
  "restoreLog",
  "upsertLearningPiece",
  "deleteLearningPiece",
  "createPiece",
  "updatePiece",
  "restoreLearningPiece",
] as const;

export function wireClientMusicPracticeSync(deps: {
  db: MuniDb;
  items: ItemRepository;
  pullLimit: number;
  onLocalWrite: () => void;
  fetch?: typeof fetch;
  baseUrl?: string;
}): ClientMusicPracticeBundle {
  const fetchFn = deps.fetch ?? globalThis.fetch.bind(globalThis);
  const baseUrl = deps.baseUrl ?? "";
  const compositions = createIndexedDbMusicPracticeCompositionRepository(deps.db);
  const djSets = createIndexedDbMusicPracticeDjSetRepository(deps.db);
  const instruments = createIndexedDbMusicPracticeInstrumentRepository(deps.db);
  const exercises = createIndexedDbMusicPracticeExerciseRepository(deps.db);
  const plans = createIndexedDbMusicPracticePlanRepository(deps.db);
  const logs = createIndexedDbMusicPracticeLogRepository(deps.db);
  const learningPieces = createIndexedDbMusicPracticeLearningPieceRepository(deps.db);
  const remote = createHttpMusicPracticeRemoteStore({ fetch: fetchFn, baseUrl });
  const idGenerator = createUuidIdGenerator();
  const now = () => Date.now();

  const syncApply = createMusicPracticeSyncApply({
    compositions,
    djSets,
    instruments,
    exercises,
    plans,
    logs,
    learningPieces,
  });

  const useCaseDeps = {
    meta: deps.items.meta,
    idGenerator,
    now,
  };

  const baseComposition = createMusicCompositionUseCases({ compositions, ...useCaseDeps });
  const baseDjSet = createDjSetUseCases({ djSets, ...useCaseDeps });
  const baseInstrument = createPracticeInstrumentUseCases({ instruments, ...useCaseDeps });
  const baseExercise = createPracticeExerciseUseCases({ exercises, ...useCaseDeps });
  const basePlan = createPracticePlanUseCases({ plans, ...useCaseDeps });
  const baseLog = createPracticeLogUseCases({ logs, learningPieces, ...useCaseDeps });
  const baseLearningPiece = createLearningPieceUseCases({ learningPieces, ...useCaseDeps });

  const musicPracticeEngine = createMusicPracticeSyncEngine({
    meta: deps.items.meta,
    remote,
    sync: syncApply,
    pullLimit: deps.pullLimit,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  });

  const wrapWrites = <T extends MusicCompositionUseCases | DjSetUseCases | PracticeInstrumentUseCases | PracticeExerciseUseCases | PracticePlanUseCases | PracticeLogUseCases | LearningPieceUseCases>(
    useCases: T,
  ): T => {
    const wrapped = { ...useCases };
    for (const key of MUTATION_METHODS) {
      const fn = (useCases as Record<string, unknown>)[key];
      if (typeof fn !== "function") continue;
      (wrapped as Record<string, unknown>)[key] = async (...args: unknown[]) => {
        const result = await (fn as (...a: unknown[]) => Promise<unknown>)(...args);
        deps.onLocalWrite();
        return result;
      };
    }
    return wrapped;
  };

  return {
    musicPracticeEngine,
    compositionUseCases: wrapWrites(baseComposition),
    djSetUseCases: wrapWrites(baseDjSet),
    instrumentUseCases: wrapWrites(baseInstrument),
    exerciseUseCases: wrapWrites(baseExercise),
    planUseCases: wrapWrites(basePlan),
    logUseCases: wrapWrites(baseLog),
    learningPieceUseCases: wrapWrites(baseLearningPiece),
  };
}
