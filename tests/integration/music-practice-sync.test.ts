import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPostgresMusicPracticeCompositionRepository } from "@/adapters/postgres/music-practice-composition-repository";
import { createPostgresMusicPracticeDjSetRepository } from "@/adapters/postgres/music-practice-dj-set-repository";
import { createPostgresMusicPracticeInstrumentRepository } from "@/adapters/postgres/music-practice-instrument-repository";
import { createPostgresMusicPracticeExerciseRepository } from "@/adapters/postgres/music-practice-exercise-repository";
import { createPostgresMusicPracticePlanRepository } from "@/adapters/postgres/music-practice-plan-repository";
import { createPostgresMusicPracticeLogRepository } from "@/adapters/postgres/music-practice-log-repository";
import { createPostgresMusicPracticeLearningPieceRepository } from "@/adapters/postgres/music-practice-learning-piece-repository";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import { mergeDjSet, djSetToWire, djSetWireSchema } from "@/domain/dj-set";
import { createMusicPracticeSyncService } from "@/application/server/music-practice-sync-service";
import { musicCompositionToWire } from "@/domain/music-composition";
import { buildDjSet } from "../unit/music-practice/fixtures";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";

const NOW = new Date("2026-01-01T12:00:00.000Z");

let testDb: TestDatabase | undefined;
let userId: string;

describe("music practice sync", () => {
  beforeAll(async () => {
    testDb = await createTestDatabase();
    const users = createPostgresUserRepository(testDb.db);
    userId = (
      await users.create({
        id: "10000000-0000-4000-8000-000000000088",
        email: "music-practice-sync@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  it("pushes and pulls composition", async () => {
    if (testDb === undefined) return;
    const sync = createMusicPracticeSyncService({
      compositions: createPostgresMusicPracticeCompositionRepository(testDb.db),
      djSets: createPostgresMusicPracticeDjSetRepository(testDb.db),
      instruments: createPostgresMusicPracticeInstrumentRepository(testDb.db),
      exercises: createPostgresMusicPracticeExerciseRepository(testDb.db),
      plans: createPostgresMusicPracticePlanRepository(testDb.db),
      logs: createPostgresMusicPracticeLogRepository(testDb.db),
      learningPieces: createPostgresMusicPracticeLearningPieceRepository(testDb.db),
      now: () => NOW,
    });

    const wire = musicCompositionToWire({
      id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      title: "Ambient sketch",
      status: "idea",
      startedAt: null,
      finishedAt: null,
      lastWorkedAt: null,
      genreStyle: null,
      tempoBpm: null,
      mood: null,
      notes: null,
      externalUrl: null,
      sessionNotes: [],
      linkedTrackIds: null,
      deletedAt: null,
      fieldsUpdatedAt: { title: "2026-01-01T12:00:00.000Z-0-dev" },
    });

    await sync.push(userId, {
      compositions: [wire],
      djSets: [],
      instruments: [],
      exercises: [],
      plans: [],
      logs: [],
      learningPieces: [],
    });
    const pulled = await sync.pull(userId, null, 100);
    expect(pulled.compositions.some((c) => c.id === wire.id)).toBe(true);
  });

  it("merges dj set fields with LWW on concurrent push", async () => {
    if (testDb === undefined) return;
    const sync = createMusicPracticeSyncService({
      compositions: createPostgresMusicPracticeCompositionRepository(testDb.db),
      djSets: createPostgresMusicPracticeDjSetRepository(testDb.db),
      instruments: createPostgresMusicPracticeInstrumentRepository(testDb.db),
      exercises: createPostgresMusicPracticeExerciseRepository(testDb.db),
      plans: createPostgresMusicPracticePlanRepository(testDb.db),
      logs: createPostgresMusicPracticeLogRepository(testDb.db),
      learningPieces: createPostgresMusicPracticeLearningPieceRepository(testDb.db),
      now: () => NOW,
    });

    const base = buildDjSet({
      id: "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      title: "Original title",
      setlist: [{ sortOrder: 0, text: "Line A" }],
    });
    const baseWire = djSetToWire(base);
    expect(djSetWireSchema.safeParse(baseWire).success).toBe(true);
    await sync.push(userId, {
      compositions: [],
      djSets: [baseWire],
      instruments: [],
      exercises: [],
      plans: [],
      logs: [],
      learningPieces: [],
    });

    const titleEdit = {
      ...baseWire,
      title: "Remote title",
      fields_updated_at: {
        ...baseWire.fields_updated_at,
        title: "2026-01-02T12:00:00.000Z-1-dev",
      },
    };
    const notesEdit = {
      ...baseWire,
      notes: "Set notes from device B",
      fields_updated_at: {
        ...baseWire.fields_updated_at,
        notes: "2026-01-02T12:00:00.000Z-2-dev",
      },
    };

    await sync.push(userId, {
      compositions: [],
      djSets: [titleEdit],
      instruments: [],
      exercises: [],
      plans: [],
      logs: [],
      learningPieces: [],
    });
    await sync.push(userId, {
      compositions: [],
      djSets: [notesEdit],
      instruments: [],
      exercises: [],
      plans: [],
      logs: [],
      learningPieces: [],
    });

    const pulled = await sync.pull(userId, null, 100);
    const merged = pulled.djSets.find((row) => row.id === base.id);
    expect(merged).toBeDefined();
    expect(merged?.title).toBe("Remote title");
    expect(merged?.notes).toBe("Set notes from device B");
    expect(mergeDjSet(titleEdit, notesEdit).title).toBe("Remote title");
  });
});
