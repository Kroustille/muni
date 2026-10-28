import { describe, expect, it } from "vitest";

import { createMusicPracticeSyncApply } from "@/application/music-practice-sync";
import { musicCompositionToWire } from "@/domain/music-composition";
import { djSetToWire } from "@/domain/dj-set";
import { practiceInstrumentToWire } from "@/domain/practice-instrument";
import { practiceExerciseToWire } from "@/domain/practice-exercise";
import { practicePlanToWire } from "@/domain/practice-plan";
import { practiceLogToWire } from "@/domain/practice-log";
import { learningPieceToWire } from "@/domain/learning-piece";
import {
  buildDjSet,
  buildLearningPiece,
  buildMusicComposition,
  buildPracticeExercise,
  buildPracticeInstrument,
  buildPracticeLog,
  buildPracticePlan,
} from "./fixtures";

function memoryRepo<T extends { id: string }>() {
  const store = new Map<string, T>();
  const outbox = new Set<string>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    list: () => Promise.resolve([...store.values()]),
    upsert: (row: T, options?: { enqueue?: boolean }) => {
      store.set(row.id, row);
      if (options?.enqueue !== false) outbox.add(row.id);
      return Promise.resolve(row);
    },
    subscribe: () => () => {},
    outbox: () => Promise.resolve([...outbox]),
    clearOutbox: (ids: string[]) => {
      for (const id of ids) outbox.delete(id);
      return Promise.resolve();
    },
  };
}

describe("music practice sync apply", () => {
  it("collects outbox and applies remote payload", async () => {
    type CompositionRow = ReturnType<typeof buildMusicComposition>;
    const compositions = memoryRepo<CompositionRow>();
    const djSets = memoryRepo();
    const instruments = memoryRepo();
    const exercises = memoryRepo();
    const plans = memoryRepo();
    const logs = memoryRepo();
    const learningPieces = memoryRepo();
    const sync = createMusicPracticeSyncApply({
      compositions: compositions as never,
      djSets: djSets as never,
      instruments: instruments as never,
      exercises: exercises as never,
      plans: plans as never,
      logs: logs as never,
      learningPieces: learningPieces as never,
    });

    const row = buildMusicComposition({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    await compositions.upsert(row, { enqueue: true });
    const payload = await sync.collectPushPayload();
    expect(payload.compositions).toHaveLength(1);

    await sync.applyRemote({
      compositions: [musicCompositionToWire({ ...row, title: "Remote title" })],
      djSets: [djSetToWire(buildDjSet({ id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" }))],
      instruments: [
        practiceInstrumentToWire(
          buildPracticeInstrument({ id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }),
        ),
      ],
      exercises: [
        practiceExerciseToWire(
          buildPracticeExercise({ id: "ffffffff-ffff-4fff-8fff-ffffffffffff" }),
        ),
      ],
      plans: [practicePlanToWire(buildPracticePlan({ id: "10101010-1010-4101-8101-010101010101" }))],
      logs: [practiceLogToWire(buildPracticeLog({ id: "20202020-2020-4202-8202-020202020202" }))],
      learningPieces: [
        learningPieceToWire(buildLearningPiece({ id: "30303030-3030-4303-8303-030303030303" })),
      ],
    });
    expect((await compositions.get(row.id))?.title).toBe("Remote title");
    expect(await djSets.get("dddddddd-dddd-4ddd-8ddd-dddddddddddd")).toBeDefined();
    await sync.clearOutboxes({
      compositionIds: [row.id],
      djSetIds: ["dddddddd-dddd-4ddd-8ddd-dddddddddddd"],
      instrumentIds: ["eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"],
      exerciseIds: ["ffffffff-ffff-4fff-8fff-ffffffffffff"],
      planIds: ["10101010-1010-4101-8101-010101010101"],
      logIds: ["20202020-2020-4202-8202-020202020202"],
      learningPieceIds: ["30303030-3030-4303-8303-030303030303"],
    });
    expect(await compositions.outbox()).toEqual([]);
  });

  it("collects only rows still present in repositories", async () => {
    type CompositionRow = ReturnType<typeof buildMusicComposition>;
    const compositions = memoryRepo<CompositionRow>();
    const sync = createMusicPracticeSyncApply({
      compositions: compositions as never,
      djSets: memoryRepo() as never,
      instruments: memoryRepo() as never,
      exercises: memoryRepo() as never,
      plans: memoryRepo() as never,
      logs: memoryRepo() as never,
      learningPieces: memoryRepo() as never,
    });
    const row = buildMusicComposition({ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" });
    await compositions.upsert(row, { enqueue: true });
    compositions.get = async () => undefined;
    const payload = await sync.collectPushPayload();
    expect(payload.compositions).toEqual([]);
  });
});
