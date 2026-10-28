import { describe, expect, it } from "vitest";

import { createCookbookSyncEngine } from "@/application/cookbook-sync";
import { cookbookToWire } from "@/domain/cookbook";
import { InMemoryItemRepository } from "../../helpers/in-memory-item-repository";
import { createMemoryCookbookRepository } from "../../helpers/memory-cookbook-repository";

describe("cookbook sync engine", () => {
  it("runs push and pull via quote sync engine", async () => {
    const repository = createMemoryCookbookRepository();
    const metaRepo = new InMemoryItemRepository();
    const applied: unknown[] = [];
    const row = await repository.upsert(
      {
        id: "90000000-0000-4000-8000-000000000001",
        title: "Ouvrage",
        author: null,
        isbn: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        deletedAt: null,
        fieldsUpdatedAt: { title: "2026-01-01T00:00:00.000Z-0-a" },
      },
      { enqueue: true },
    );
    const engine = createCookbookSyncEngine({
      repository,
      meta: metaRepo.meta,
      remote: {
        push: async (cookbooks) => cookbooks.map((c) => ({ ...c, server_updated_at: new Date().toISOString() })),
        pull: async () => ({ cookbooks: [], cursor: "" }),
      },
      cookbooks: {
        applyRemote: async (rows) => {
          applied.push(...rows);
        },
      },
      pullLimit: 10,
      sleep: async () => {},
    });
    await engine.run();
    expect(await repository.outbox()).toEqual([]);
    expect(applied.length).toBeGreaterThan(0);
    expect(cookbookToWire(row).title).toBe("Ouvrage");
  });
});
