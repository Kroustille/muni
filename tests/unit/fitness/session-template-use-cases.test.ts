import { describe, expect, it } from "vitest";

import { createFitnessSessionTemplateUseCases } from "@/application/fitness/session-template";
import type { FitnessSessionTemplate } from "@/domain/fitness/session-template";

function memoryTemplateRepo() {
  const store = new Map<string, FitnessSessionTemplate>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    list: () => Promise.resolve([...store.values()].filter((t) => t.deletedAt === null)),
    upsert: async (template: FitnessSessionTemplate) => {
      store.set(template.id, template);
      return template;
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

describe("fitness session template use cases", () => {
  it("creates template", async () => {
    const uc = createFitnessSessionTemplateUseCases({
      templates: memoryTemplateRepo(),
      meta,
      idGenerator: { newId: () => "11111111-2222-4333-8444-555555555555" },
      now: () => 1,
    });
    const template = await uc.createTemplate({ title: "Force" });
    expect(template.title).toBe("Force");
    expect(template.sortOrder).toBe(0);
  });
});
