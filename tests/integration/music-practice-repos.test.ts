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
  buildDjSet,
  buildLearningPiece,
  buildMusicComposition,
  buildPracticeExercise,
  buildPracticeInstrument,
  buildPracticeLog,
  buildPracticePlan,
} from "../unit/music-practice/fixtures";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";

const NOW = new Date("2026-04-01T12:00:00.000Z");

let testDb: TestDatabase | undefined;
let userId: string;

describe("music practice postgres repositories", () => {
  beforeAll(async () => {
    testDb = await createTestDatabase();
    const users = createPostgresUserRepository(testDb.db);
    userId = (
      await users.create({
        id: "10000000-0000-4000-8000-000000000066",
        email: "mp-repos@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  it("upserts, updates via findByIds, and pulls each entity family", async () => {
    if (testDb === undefined) return;
    const compositionRepo = createPostgresMusicPracticeCompositionRepository(testDb.db);
    const djRepo = createPostgresMusicPracticeDjSetRepository(testDb.db);
    const instrumentRepo = createPostgresMusicPracticeInstrumentRepository(testDb.db);
    const exerciseRepo = createPostgresMusicPracticeExerciseRepository(testDb.db);
    const planRepo = createPostgresMusicPracticePlanRepository(testDb.db);
    const logRepo = createPostgresMusicPracticeLogRepository(testDb.db);
    const pieceRepo = createPostgresMusicPracticeLearningPieceRepository(testDb.db);

    const composition = buildMusicComposition({ id: "c1111111-1111-4111-8111-111111111111" });
    const dj = buildDjSet({ id: "d2222222-2222-4222-8222-222222222222" });
    const instrument = buildPracticeInstrument({ id: "a3333333-3333-4333-8333-333333333333" });
    const exercise = buildPracticeExercise({ id: "b4444444-4444-4444-8444-444444444444" });
    const plan = buildPracticePlan({ id: "e5555555-5555-4555-8555-555555555555" });
    const log = buildPracticeLog({ id: "f6666666-6666-4666-8666-666666666666" });
    const piece = buildLearningPiece({ id: "ab777777-7777-4777-8777-777777777777" });

    await compositionRepo.transaction(async (repo) => {
      await repo.upsert(userId, composition);
      await repo.upsert(userId, { ...composition, title: "Updated composition" });
      const rows = await repo.findByIds(userId, [composition.id]);
      expect(rows[0]?.title).toBe("Updated composition");
    });
    await djRepo.transaction(async (repo) => {
      await repo.upsert(userId, dj);
      await repo.upsert(userId, { ...dj, title: "Updated dj" });
      expect((await repo.findByIds(userId, [dj.id]))[0]?.title).toBe("Updated dj");
    });
    await instrumentRepo.transaction(async (repo) => {
      await repo.upsert(userId, instrument);
      await repo.upsert(userId, { ...instrument, name: "Updated instrument" });
      expect((await repo.findByIds(userId, [instrument.id]))[0]?.name).toBe("Updated instrument");
    });
    await exerciseRepo.transaction(async (repo) => {
      await repo.upsert(userId, exercise);
      await repo.upsert(userId, { ...exercise, title: "Updated exercise" });
      expect((await repo.findByIds(userId, [exercise.id]))[0]?.title).toBe("Updated exercise");
    });
    await planRepo.transaction(async (repo) => {
      await repo.upsert(userId, plan);
      await repo.upsert(userId, { ...plan, name: "Updated plan" });
      expect((await repo.findByIds(userId, [plan.id]))[0]?.name).toBe("Updated plan");
    });
    await logRepo.transaction(async (repo) => {
      await repo.upsert(userId, log);
      await repo.upsert(userId, { ...log, notes: "Updated log" });
      expect((await repo.findByIds(userId, [log.id]))[0]?.notes).toBe("Updated log");
    });
    await pieceRepo.transaction(async (repo) => {
      await repo.upsert(userId, piece);
      await repo.upsert(userId, { ...piece, title: "Updated piece" });
      expect((await repo.findByIds(userId, [piece.id]))[0]?.title).toBe("Updated piece");
    });

    const since = new Date(NOW.getTime() - 60_000);
    expect(await compositionRepo.pullSince(userId, since, 10)).toHaveLength(1);
    expect(await djRepo.pullSince(userId, since, 10)).toHaveLength(1);
    expect(await instrumentRepo.pullSince(userId, since, 10)).toHaveLength(1);
    expect(await exerciseRepo.pullSince(userId, since, 10)).toHaveLength(1);
    expect(await planRepo.pullSince(userId, since, 10)).toHaveLength(1);
    expect(await logRepo.pullSince(userId, since, 10)).toHaveLength(1);
    expect(await pieceRepo.pullSince(userId, since, 10)).toHaveLength(1);
    expect(await compositionRepo.pullSince(userId, null, 10)).toHaveLength(1);
  });
});
