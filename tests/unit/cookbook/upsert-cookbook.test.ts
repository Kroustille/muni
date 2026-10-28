import { describe, expect, it } from "vitest";

import { createUpsertCookbook } from "@/application/cookbooks/upsert-cookbook";
import { newCookbook } from "@/domain/cookbook";
import { createMemoryCookbookRepository } from "../../helpers/memory-cookbook-repository";

describe("upsertCookbook", () => {
  it("propagates author change for display consumers", async () => {
    const repository = createMemoryCookbookRepository();
    const meta = {
      get: async () => undefined,
      set: async () => undefined,
    };
    const upsert = createUpsertCookbook({
      repository,
      meta,
      idGenerator: { newId: () => "70000000-0000-4000-8000-000000000099" },
      now: () => Date.parse("2026-01-01T12:00:00.000Z"),
    });

    const created = await upsert.upsertCookbook({ title: "Ouvrage" });
    const updated = await upsert.upsertCookbook({
      id: created.id,
      title: created.title,
      author: "Paul Bocuse",
    });

    expect(updated.author).toBe("Paul Bocuse");
    const stored = await repository.get(created.id);
    expect(stored?.author).toBe("Paul Bocuse");
  });
});
