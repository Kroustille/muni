import { describe, expect, it } from "vitest";

import { createPracticeExerciseUseCases } from "@/application/music-practice/exercise";
import { createPracticeInstrumentUseCases } from "@/application/music-practice/instrument";
import type { PracticeExercise } from "@/domain/practice-exercise";
import type { PracticeInstrument } from "@/domain/practice-instrument";

const meta = {
  data: new Map<string, unknown>(),
  get: async (key: string) => meta.data.get(key) as never,
  set: async (key: string, value: unknown) => {
    meta.data.set(key, value);
  },
};

function memoryInstrumentRepo() {
  const store = new Map<string, PracticeInstrument>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    list: () => Promise.resolve([...store.values()]),
    upsert: async (row: PracticeInstrument) => {
      store.set(row.id, row);
      return row;
    },
    subscribe: () => () => undefined,
    outbox: () => Promise.resolve([]),
    clearOutbox: () => Promise.resolve(),
  };
}

function memoryExerciseRepo() {
  const store = new Map<string, PracticeExercise>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    list: () => Promise.resolve([...store.values()]),
    upsert: async (row: PracticeExercise) => {
      store.set(row.id, row);
      return row;
    },
    subscribe: () => () => undefined,
    outbox: () => Promise.resolve([]),
    clearOutbox: () => Promise.resolve(),
  };
}

describe("exercise library quick add", () => {
  it("creates instrument and exercise", async () => {
    const instrumentUc = createPracticeInstrumentUseCases({
      instruments: memoryInstrumentRepo(),
      meta,
      idGenerator: { newId: () => "33333333-3333-4333-8333-333333333333" },
      now: () => 1,
    });
    const exerciseUc = createPracticeExerciseUseCases({
      exercises: memoryExerciseRepo(),
      meta,
      idGenerator: { newId: () => "44444444-4444-4444-8444-444444444444" },
      now: () => 1,
    });
    const instrument = await instrumentUc.createQuick({ name: "Guitare" });
    const exercise = await exerciseUc.createQuick({
      title: "Gamme pentatonique",
      instrumentId: instrument.id,
    });
    expect(instrument.name).toBe("Guitare");
    expect(exercise.title).toBe("Gamme pentatonique");
    expect(exercise.instrumentId).toBe(instrument.id);
  });
});
