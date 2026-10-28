import { describe, expect, it } from "vitest";

import { createPracticeLogUseCases } from "@/application/music-practice/practice-log";
import { resolveTodayExercises } from "@/application/music-practice/practice-today";
import { createPracticePlanUseCases } from "@/application/music-practice/plan";
import type { LearningPiece } from "@/domain/learning-piece";
import type { PracticeLog } from "@/domain/practice-log";
import type { PracticePlan } from "@/domain/practice-plan";
import { buildPlanAssignment, buildPracticePlan } from "./fixtures";

function memoryPlanRepo() {
  const store = new Map<string, PracticePlan>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    getActive: () => Promise.resolve([...store.values()].find((p) => p.isActive && p.deletedAt === null)),
    list: () => Promise.resolve([...store.values()]),
    upsert: async (row: PracticePlan) => {
      store.set(row.id, row);
      return row;
    },
    subscribe: () => () => undefined,
    outbox: () => Promise.resolve([]),
    clearOutbox: () => Promise.resolve(),
  };
}

function memoryLogRepo() {
  const store = new Map<string, PracticeLog>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    list: () => Promise.resolve([...store.values()]),
    upsert: async (row: PracticeLog) => {
      store.set(row.id, row);
      return row;
    },
    subscribe: () => () => undefined,
    outbox: () => Promise.resolve([]),
    clearOutbox: () => Promise.resolve(),
  };
}

function memoryPieceRepo() {
  const store = new Map<string, LearningPiece>();
  return {
    get: () => Promise.resolve(undefined),
    list: () => Promise.resolve([]),
    upsert: async (row: LearningPiece) => row,
    subscribe: () => () => undefined,
    outbox: () => Promise.resolve([]),
    clearOutbox: () => Promise.resolve(),
  };
}

const meta = {
  data: new Map<string, unknown>(),
  get: async (key: string) => meta.data.get(key) as never,
  set: async (key: string, value: unknown) => {
    meta.data.set(key, value);
  },
};

describe("practice today", () => {
  it("resolves weekday assignments", () => {
    const plan = buildPracticePlan({
      assignments: [
        buildPlanAssignment({
          exerciseId: "44444444-4444-4444-8444-444444444444",
          weekdays: [4],
        }),
      ],
    });
    const today = resolveTodayExercises(plan, "2026-01-01");
    expect(today).toHaveLength(1);
    expect(today[0]?.exerciseId).toBe("44444444-4444-4444-8444-444444444444");
  });

  it("markDoneToday creates log for today", async () => {
    const logUc = createPracticeLogUseCases({
      logs: memoryLogRepo(),
      learningPieces: memoryPieceRepo(),
      meta,
      idGenerator: { newId: () => "77777777-7777-4777-8777-777777777777" },
      now: () => new Date("2026-01-01T12:00:00.000Z").getTime(),
    });
    const log = await logUc.markDoneToday({
      exerciseIds: ["44444444-4444-4444-8444-444444444444"],
    });
    expect(log.practicedAt).toBe("2026-01-01");
    expect(log.exerciseIds).toEqual(["44444444-4444-4444-8444-444444444444"]);
  });

  it("createPlan activates plan", async () => {
    const planUc = createPracticePlanUseCases({
      plans: memoryPlanRepo(),
      meta,
      idGenerator: { newId: () => "66666666-6666-4666-8666-666666666666" },
      now: () => 1,
    });
    const plan = await planUc.createPlan({ name: "Semaine" });
    expect(plan.isActive).toBe(true);
  });
});
