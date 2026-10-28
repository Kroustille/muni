import { describe, expect, it } from "vitest";

import { createSearchUseCase } from "@/application/search";
import { newCookbook } from "@/domain/cookbook";
import { newItem } from "@/domain/item";
import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";
import { createMemoryCookbookRepository } from "../helpers/memory-cookbook-repository";

const NOW = "2026-01-01T12:00:00.000Z";
const COOKBOOK = "70000000-0000-4000-8000-000000000001";

describe("search by cookbook title", () => {
  it("returns recipes sharing a cookbook title match", async () => {
    const cookbooks = createMemoryCookbookRepository([
      newCookbook({ id: COOKBOOK, title: "Desserts faciles", createdAt: NOW }),
    ]);
    const items = new InMemoryItemRepository();
    await items.put(
      newItem({
        id: "60000000-0000-4000-8000-000000000001",
        type: "recipe",
        title: "Tarte",
        createdAt: NOW,
        cookbookId: COOKBOOK,
      }),
      { enqueue: false },
    );
    await items.put(
      newItem({
        id: "60000000-0000-4000-8000-000000000002",
        type: "recipe",
        title: "Salade",
        createdAt: NOW,
      }),
      { enqueue: false },
    );
    await items.put(
      newItem({
        id: "60000000-0000-4000-8000-000000000003",
        type: "recipe",
        title: "Mousse",
        createdAt: NOW,
        cookbookId: COOKBOOK,
      }),
      { enqueue: false },
    );

    const search = createSearchUseCase({
      repository: items,
      cookbooks: {
        getCookbook: (id) => cookbooks.get(id),
        subscribe: (listener) => cookbooks.subscribe(listener),
      },
    });

    const results = await search.search("dessert");
    expect(results.map((row) => row.title).sort()).toEqual(["Mousse", "Tarte"]);
  });
});
