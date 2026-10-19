import { describe, expect, it } from "vitest";

import { createFitnessProgramUseCases } from "@/application/fitness/program";
import type { FitnessProgram } from "@/domain/fitness/program";

function memoryProgramRepo() {
  const store = new Map<string, FitnessProgram>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    getActive: () => Promise.resolve([...store.values()].find((p) => p.isActive && p.deletedAt === null)),
    list: () => Promise.resolve([...store.values()]),
    upsert: async (program: FitnessProgram) => {
      store.set(program.id, program);
      return program;
    },
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

describe("fitness program use cases", () => {
  it("creates active program", async () => {
    const uc = createFitnessProgramUseCases({
      programs: memoryProgramRepo(),
      meta,
      idGenerator: { newId: () => "11111111-2222-4333-8444-555555555555" },
      now: () => 1,
    });
    const program = await uc.createProgram({ name: "Force" });
    expect(program.isActive).toBe(true);
    expect(program.name).toBe("Force");
  });
});
