import { beforeEach, describe, expect, it } from "vitest";

import { createItemUseCases } from "@/application/items";
import { newItem } from "@/domain/item";

import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";

const DEVICE = "device-a";
const T0 = Date.parse("2026-01-01T10:00:00.000Z");
const IMDB = "tt0211915";

function setup() {
  const repository = new InMemoryItemRepository();
  let clock = T0;
  let counter = 0;
  const useCases = createItemUseCases({
    repository,
    idGenerator: { newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}` },
    now: () => clock,
  });
  return { repository, useCases };
}

let ctx: ReturnType<typeof setup>;

beforeEach(async () => {
  ctx = setup();
  await ctx.repository.meta.set("deviceId", DEVICE);
});

const catalog = {
  imdbId: IMDB,
  title: "Amélie",
  synopsis: "Résumé.",
  releaseYear: 2001,
  catalogRating: 8.3,
  mediaKind: "film" as const,
};

describe("upsertMovieFromCatalog", () => {
  it("updates an active movie with the same imdbId silently", async () => {
    const existing = await ctx.useCases.createItem("movie", "Old title", { imdbId: IMDB });
    const saved = await ctx.useCases.upsertMovieFromCatalog(catalog);
    expect(saved.id).toBe(existing.id);
    expect(saved.title).toBe("Amélie");
    expect(saved.catalogRating).toBe(8.3);
    expect((await ctx.repository.query({ type: "movie" })).length).toBe(1);
  });

  it("restores a soft-deleted movie on the same imdbId", async () => {
    const existing = await ctx.useCases.createItem("movie", "Amélie", { imdbId: IMDB });
    await ctx.useCases.deleteItem(existing.id);
    const saved = await ctx.useCases.upsertMovieFromCatalog({ ...catalog, synopsis: "Restored" });
    expect(saved.id).toBe(existing.id);
    expect(saved.deletedAt).toBeNull();
    expect(saved.synopsis).toBe("Restored");
  });

  it("merges into a manual row when title and year match and imdbId was missing", async () => {
    const manual = await ctx.useCases.createItem("movie", "Amélie", { releaseYear: 2001 });
    const saved = await ctx.useCases.upsertMovieFromCatalog(catalog);
    expect(saved.id).toBe(manual.id);
    expect(saved.imdbId).toBe(IMDB);
    expect((await ctx.repository.query({ type: "movie" })).length).toBe(1);
  });

  it("creates a new row when multiple manual candidates would match", async () => {
    let counter = 10;
    const useCases = createItemUseCases({
      repository: ctx.repository,
      idGenerator: {
        newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`,
      },
      now: () => T0,
    });
    for (const id of ["000000000001", "000000000002"]) {
      await ctx.repository.put(
        newItem({
          id: `00000000-0000-4000-8000-${id}`,
          type: "movie",
          title: "Amélie",
          releaseYear: 2001,
          createdAt: "2026-01-01T00:00:00.000Z",
        }),
        { enqueue: false },
      );
    }
    const saved = await useCases.upsertMovieFromCatalog(catalog);
    expect(saved.id).toBe("00000000-0000-4000-8000-000000000011");
    expect((await ctx.repository.query({ type: "movie" })).length).toBe(3);
  });
});
