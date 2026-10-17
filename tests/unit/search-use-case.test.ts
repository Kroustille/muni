import { beforeEach, describe, expect, it } from "vitest";

import { createItemUseCases } from "@/application/items";
import { createSearchUseCase } from "@/application/search";

import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";

const DEVICE = "device-a";

function setup() {
  const repository = new InMemoryItemRepository();
  const useCases = createItemUseCases({
    repository,
    idGenerator: { newId: () => crypto.randomUUID() },
    now: () => Date.now(),
  });
  const search = createSearchUseCase({ repository });
  return { repository, useCases, search };
}

let ctx: ReturnType<typeof setup>;

beforeEach(async () => {
  ctx = setup();
  await ctx.repository.meta.set("deviceId", DEVICE);
});

describe("createSearchUseCase metadata fields", () => {
  it("finds books by author only", async () => {
    const book = await ctx.useCases.createItem("book", "Obscure title", { author: "Camus" });
    expect((await ctx.search.search("camus")).map((i) => i.id)).toEqual([book.id]);
  });

  it("finds movies by director only", async () => {
    const movie = await ctx.useCases.createItem("movie", "Obscure film", { director: "Nolan" });
    expect((await ctx.search.search("nolan")).map((i) => i.id)).toEqual([movie.id]);
  });
});
