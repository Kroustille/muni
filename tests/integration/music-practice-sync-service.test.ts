import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPostgresMusicPracticeCompositionRepository } from "@/adapters/postgres/music-practice-composition-repository";
import { createPostgresMusicPracticeDjSetRepository } from "@/adapters/postgres/music-practice-dj-set-repository";
import { createPostgresMusicPracticeInstrumentRepository } from "@/adapters/postgres/music-practice-instrument-repository";
import { createPostgresMusicPracticeExerciseRepository } from "@/adapters/postgres/music-practice-exercise-repository";
import { createPostgresMusicPracticePlanRepository } from "@/adapters/postgres/music-practice-plan-repository";
import { createPostgresMusicPracticeLogRepository } from "@/adapters/postgres/music-practice-log-repository";
import { createPostgresMusicPracticeLearningPieceRepository } from "@/adapters/postgres/music-practice-learning-piece-repository";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import {
  createMusicPracticeSyncService,
  validatePushMusicPractice,
} from "@/application/server/music-practice-sync-service";
import {
  practiceExerciseToWire,
} from "@/domain/practice-exercise";
import { practiceInstrumentToWire } from "@/domain/practice-instrument";
import { practicePlanToWire } from "@/domain/practice-plan";
import { practiceLogToWire } from "@/domain/practice-log";
import { learningPieceToWire } from "@/domain/learning-piece";
import { musicCompositionToWire } from "@/domain/music-composition";
import { djSetToWire } from "@/domain/dj-set";
import {
  buildDjSet,
  buildLearningPiece,
  buildMusicComposition,
  buildPlanAssignment,
  buildPracticeExercise,
  buildPracticeInstrument,
  buildPracticeLog,
  buildPracticePlan,
} from "../unit/music-practice/fixtures";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";

const NOW = new Date("2026-03-01T12:00:00.000Z");

let testDb: TestDatabase | undefined;
let userId: string;

function service() {
  if (testDb === undefined) throw new Error("no db");
  return createMusicPracticeSyncService({
    compositions: createPostgresMusicPracticeCompositionRepository(testDb.db),
    djSets: createPostgresMusicPracticeDjSetRepository(testDb.db),
    instruments: createPostgresMusicPracticeInstrumentRepository(testDb.db),
    exercises: createPostgresMusicPracticeExerciseRepository(testDb.db),
    plans: createPostgresMusicPracticePlanRepository(testDb.db),
    logs: createPostgresMusicPracticeLogRepository(testDb.db),
    learningPieces: createPostgresMusicPracticeLearningPieceRepository(testDb.db),
    now: () => NOW,
  });
}

describe("music practice sync service", () => {
  beforeAll(async () => {
    testDb = await createTestDatabase();
    const users = createPostgresUserRepository(testDb.db);
    userId = (
      await users.create({
        id: "10000000-0000-4000-8000-000000000077",
        email: "mp-service@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  it("pushes apprentissage entities and demotes previous active plan", async () => {
    const sync = service();
    const instrument = buildPracticeInstrument({
      id: "a1111111-1111-4111-8111-111111111111",
    });
    const exercise = buildPracticeExercise({
      id: "a2222222-2222-4222-8222-222222222222",
      instrumentId: instrument.id,
    });
    const planA = buildPracticePlan({
      id: "a3333333-3333-4333-8333-333333333333",
      isActive: true,
      assignments: [buildPlanAssignment({ exerciseId: exercise.id })],
    });
    const planB = buildPracticePlan({
      id: "a4444444-4444-4444-8444-444444444444",
      isActive: true,
      assignments: [],
    });
    const log = buildPracticeLog({ id: "a5555555-5555-4555-8555-555555555555" });
    const piece = buildLearningPiece({ id: "a6666666-6666-4666-8666-666666666666" });

    validatePushMusicPractice({
      compositions: [],
      djSets: [],
      instruments: [practiceInstrumentToWire(instrument)],
      exercises: [practiceExerciseToWire(exercise)],
      plans: [practicePlanToWire(planA)],
      logs: [practiceLogToWire(log)],
      learningPieces: [learningPieceToWire(piece)],
    });

    await sync.push(userId, {
      compositions: [],
      djSets: [],
      instruments: [practiceInstrumentToWire(instrument)],
      exercises: [practiceExerciseToWire(exercise)],
      plans: [practicePlanToWire(planA)],
      logs: [practiceLogToWire(log)],
      learningPieces: [learningPieceToWire(piece)],
    });

    await sync.push(userId, {
      compositions: [],
      djSets: [],
      instruments: [],
      exercises: [],
      plans: [practicePlanToWire(planB)],
      logs: [],
      learningPieces: [],
    });

    const pulled = await sync.pull(userId, null, 50);
    const active = pulled.plans.filter((p) => p.is_active);
    expect(active.filter((p) => p.is_active).length).toBe(1);
    expect(active[0]?.id).toBe(planB.id);
  });

  it("pushes composition and dj set batches", async () => {
    const sync = service();
    const composition = buildMusicComposition({
      id: "f1111111-1111-4111-8111-111111111111",
    });
    const dj = buildDjSet({ id: "f2222222-2222-4222-8222-222222222222" });
    await sync.push(userId, {
      compositions: [musicCompositionToWire(composition)],
      djSets: [djSetToWire(dj)],
      instruments: [],
      exercises: [],
      plans: [],
      logs: [],
      learningPieces: [],
    });
    const pulled = await sync.pull(userId, null, 10);
    expect(pulled.compositions.some((c) => c.id === composition.id)).toBe(true);
    expect(pulled.djSets.some((d) => d.id === dj.id)).toBe(true);
  });
});
