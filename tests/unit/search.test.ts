import { beforeEach, describe, expect, it } from "vitest";

import { createItemUseCases } from "@/application/items";
import { createSearchUseCase } from "@/application/search";
import { itemToWire, newItem } from "@/domain/item";

import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";

const DEVICE = "device-a";
const T0 = Date.parse("2026-01-01T10:00:00.000Z");

function setup() {
  const repository = new InMemoryItemRepository();
  let clock = T0;
  let counter = 0;
  const idGenerator = {
    newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`,
  };
  const useCases = createItemUseCases({ repository, idGenerator, now: () => clock });
  const search = createSearchUseCase({ repository });
  return {
    repository,
    useCases,
    search,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

let ctx: ReturnType<typeof setup>;

beforeEach(async () => {
  ctx = setup();
  await ctx.repository.meta.set("deviceId", DEVICE);
});

describe("createSearchUseCase", () => {
  it('finds "Éléphant" when searching "elephant" (accent-insensitive)', async () => {
    const item = await ctx.useCases.createItem("book", "Éléphant");
    const results = await ctx.search.search("elephant");
    expect(results.map((i) => i.id)).toEqual([item.id]);
  });

  it("matches case-insensitively on title", async () => {
    const item = await ctx.useCases.createItem("movie", "The DARK Knight");
    expect((await ctx.search.search("dark")).map((i) => i.id)).toEqual([item.id]);
    expect((await ctx.search.search("KNIGHT")).map((i) => i.id)).toEqual([item.id]);
  });

  it("returns matches across all list types", async () => {
    const shopping = await ctx.useCases.createItem("shopping", "Milk elephant brand");
    const book = await ctx.useCases.createItem("book", "Water for Elephants");
    const movie = await ctx.useCases.createItem("movie", "Elephant Dream");
    const recipe = await ctx.useCases.createItem("recipe", "Elephant ears pastry");
    const results = await ctx.search.search("elephant");
    expect(results.map((i) => i.id).sort()).toEqual(
      [shopping.id, book.id, movie.id, recipe.id].sort(),
    );
  });

  it("matches title only, not author, recommendedBy or notes", async () => {
    await ctx.useCases.createItem("book", "Quiet title", {
      author: "elephant",
      recommendedBy: "elephant",
      notes: "elephant",
    });
    await ctx.useCases.createItem("movie", "Another quiet title", {
      recommendedBy: "elephant",
      notes: "elephant",
    });
    expect(await ctx.search.search("elephant")).toEqual([]);
  });

  it("returns an empty array when nothing matches", async () => {
    await ctx.useCases.createItem("book", "La Peste");
    expect(await ctx.search.search("giraffe")).toEqual([]);
  });

  it("excludes soft-deleted items", async () => {
    const item = await ctx.useCases.createItem("book", "Elephant");
    await ctx.useCases.deleteItem(item.id);
    expect(await ctx.search.search("elephant")).toEqual([]);
  });

  it("reflects local writes in the index", async () => {
    expect(await ctx.search.search("pesto")).toEqual([]);
    const item = await ctx.useCases.createItem("recipe", "Basil pesto");
    expect((await ctx.search.search("pesto")).map((i) => i.id)).toEqual([item.id]);

    await ctx.useCases.updateItem(item.id, { title: "Red pesto" });
    expect(await ctx.search.search("basil")).toEqual([]);
    expect((await ctx.search.search("red")).map((i) => i.id)).toEqual([item.id]);

    await ctx.useCases.deleteItem(item.id);
    expect(await ctx.search.search("pesto")).toEqual([]);
  });

  it("reflects applyRemote merges in the index", async () => {
    const local = await ctx.useCases.createItem("book", "Old title");
    await ctx.repository.clearOutbox([local.id]);
    const remote = itemToWire(
      {
        ...local,
        title: "Elephant book",
        fieldsUpdatedAt: { ...local.fieldsUpdatedAt, title: `${T0 + 5000}-0-device-b` },
      },
      "2026-01-01T11:00:00.000Z",
    );
    await ctx.useCases.applyRemote([remote]);
    expect((await ctx.search.search("elephant")).map((i) => i.id)).toEqual([local.id]);
    expect(await ctx.search.search("old")).toEqual([]);
  });

  it("indexes items introduced only via applyRemote", async () => {
    const remote = newItem({
      id: "00000000-0000-4000-8000-000000000099",
      type: "movie",
      title: "Elephant Man",
      createdAt: "2026-01-01T09:00:00.000Z",
    });
    const wire = itemToWire(
      { ...remote, fieldsUpdatedAt: { title: "1-0-device-b" } },
      "2026-01-01T09:00:01.000Z",
    );
    await ctx.useCases.applyRemote([wire]);
    expect((await ctx.search.search("elephant")).map((i) => i.id)).toEqual([remote.id]);
  });

  it("returns search results within 1 s for 5,000 items (SC-006)", async () => {
    for (let i = 0; i < 5000; i += 1) {
      ctx.advance(1);
      await ctx.useCases.createItem("shopping", `Item ${i}`);
    }
    await ctx.useCases.createItem("book", "Target elephant");

    const start = performance.now();
    const results = await ctx.search.search("elephant");
    const elapsed = performance.now() - start;

    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe("Target elephant");
    expect(elapsed).toBeLessThan(1000);
  });
});
