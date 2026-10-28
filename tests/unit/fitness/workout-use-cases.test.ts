import { describe, expect, it } from "vitest";

import { createFitnessWorkoutUseCases } from "@/application/fitness/workout";
import type { FitnessWorkoutLog } from "@/domain/fitness/workout-log";
import type { PlannedSession } from "@/domain/fitness/program";

function memoryWorkoutRepo() {
  const store = new Map<string, FitnessWorkoutLog>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    getInProgress: () =>
      Promise.resolve([...store.values()].find((w) => w.status === "in_progress" && w.deletedAt === null)),
    list: () => Promise.resolve([...store.values()].filter((w) => w.deletedAt === null)),
    upsert: async (row: FitnessWorkoutLog, _opts?: { enqueue?: boolean }) => {
      store.set(row.id, row);
      return row;
    },
    subscribe: () => () => undefined,
    outbox: () => Promise.resolve([]),
    clearOutbox: () => Promise.resolve(),
    _store: store,
  };
}

const meta = {
  data: new Map<string, unknown>(),
  get: async (key: string) => meta.data.get(key) as never,
  set: async (key: string, value: unknown) => {
    meta.data.set(key, value);
  },
};

const catalog = {
  getVersion: async () => 2,
  getById: async (id: string) => ({ id, nameFr: `Exercice ${id}`, muscleGroups: [] }),
};

describe("fitness workout use cases", () => {
  const now = () => Date.parse("2026-06-15T10:00:00.000Z");
  let idSeq = 0;

  function createUc() {
    const workouts = memoryWorkoutRepo();
    const skips = {
      list: async () => [],
      upsert: async (row: unknown) => row,
      subscribe: () => () => undefined,
      outbox: async () => [],
      clearOutbox: async () => {},
    };
    const settings = {
      get: async () => undefined,
      upsert: async (row: unknown) => row,
      subscribe: () => () => undefined,
    };
    const uc = createFitnessWorkoutUseCases({
      workouts: workouts as never,
      programs: { get: async () => undefined } as never,
      skips: skips as never,
      settings: settings as never,
      catalog: catalog as never,
      meta,
      idGenerator: { newId: () => `00000000-0000-4000-8000-${String(++idSeq).padStart(12, "0")}` },
      now,
    });
    return { uc, workouts };
  }

  it("starts free workout and completes it", async () => {
    const { uc } = createUc();
    const started = await uc.startFreeWorkout();
    expect(started.status).toBe("in_progress");
    const done = await uc.completeWorkout(started.id);
    expect(done.status).toBe("completed");
    expect((await uc.listWorkouts()).length).toBe(1);
  });

  it("starts from plan, updates sets, abandons, skips, duplicates, deletes", async () => {
    const { uc, workouts } = createUc();
    const session: PlannedSession = {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Push",
      weekdays: [1],
      sortOrder: 0,
      exercises: [{ exerciseId: "ex-1", defaultSetCount: 2, targetReps: 8 }],
    };
    const fromPlan = await uc.startWorkoutFromPlan(session);
    expect(fromPlan.loggedExercises[0]?.sets).toHaveLength(2);
    await expect(uc.startFreeWorkout()).rejects.toThrow(/WORKOUT_IN_PROGRESS/);
    await uc.abandonWorkout(fromPlan.id);
    await uc.skipPlannedSession("22222222-2222-4222-8222-222222222222", "  fatigue  ");
    const free = await uc.startFreeWorkout();
    await uc.updateLoggedExercises(free.id, [
      {
        exerciseId: "ex-1",
        nameFrSnapshot: "Pompes",
        sets: [{ reps: 10 }],
      },
    ]);
    await uc.updateRecovery(free.id, { sleep: 4, energy: 3 });
    await uc.completeWorkout(free.id);
    const dup = await uc.duplicateWorkoutAsTemplate(free.id);
    expect(dup.title).toBe(free.title);
    await uc.deleteWorkout(dup.id);
    expect((await workouts.get(dup.id))?.deletedAt).not.toBeNull();
  });

  it("applies remote workouts without enqueue", async () => {
    const { uc } = createUc();
    const remote: FitnessWorkoutLog = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      status: "completed",
      calendarDate: "2026-06-01",
      plannedSessionId: null,
      title: "Remote",
      startedAt: "2026-06-01T10:00:00.000Z",
      completedAt: "2026-06-01T11:00:00.000Z",
      catalogVersion: 1,
      loggedExercises: [],
      recovery: null,
      deletedAt: null,
      fieldsUpdatedAt: { status: "s0" },
    };
    await uc.applyRemoteWorkouts([remote]);
    expect((await uc.getWorkout(remote.id))?.title).toBe("Remote");
  });
});
