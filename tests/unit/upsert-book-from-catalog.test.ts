import { beforeEach, describe, expect, it } from "vitest";

import { createItemUseCases } from "@/application/items";
import { newItem } from "@/domain/item";

import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";

const DEVICE = "device-a";
const T0 = Date.parse("2026-01-01T10:00:00.000Z");
const ISBN = "9782070368228";

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
  isbn: ISBN,
  title: "L'Étranger",
  author: "Camus",
  synopsis: "Un roman.",
  genres: ["Roman"],
  publicationYear: 1942,
  publisher: "Gallimard",
  pageCount: 184,
};

describe("upsertBookFromCatalog", () => {
  it("updates an active book with the same ISBN silently", async () => {
    const existing = await ctx.useCases.createItem("book", "Old title", { isbn: ISBN });
    const saved = await ctx.useCases.upsertBookFromCatalog(catalog);
    expect(saved.id).toBe(existing.id);
    expect(saved.title).toBe("L'Étranger");
    expect(saved.synopsis).toBe("Un roman.");
    expect((await ctx.repository.query({ type: "book" })).length).toBe(1);
  });

  it("restores a soft-deleted book and refreshes metadata on the same ISBN", async () => {
    const existing = await ctx.useCases.createItem("book", "L'Étranger", { isbn: ISBN });
    await ctx.useCases.deleteItem(existing.id);
    const saved = await ctx.useCases.upsertBookFromCatalog({
      ...catalog,
      synopsis: "Restored synopsis",
    });
    expect(saved.id).toBe(existing.id);
    expect(saved.deletedAt).toBeNull();
    expect(saved.synopsis).toBe("Restored synopsis");
  });

  it("merges into a manual row when title and author match and ISBN was missing", async () => {
    const manual = await ctx.useCases.createItem("book", "L'Étranger", { author: "Camus" });
    const saved = await ctx.useCases.upsertBookFromCatalog(catalog);
    expect(saved.id).toBe(manual.id);
    expect(saved.isbn).toBe(ISBN);
    expect((await ctx.repository.query({ type: "book" })).length).toBe(1);
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
    await ctx.repository.put(
      newItem({
        id: "00000000-0000-4000-8000-000000000001",
        type: "book",
        title: "L'Étranger",
        author: "Camus",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      { enqueue: false },
    );
    await ctx.repository.put(
      newItem({
        id: "00000000-0000-4000-8000-000000000002",
        type: "book",
        title: "L'Étranger",
        author: "Camus",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      { enqueue: false },
    );
    const saved = await useCases.upsertBookFromCatalog(catalog);
    expect(saved.id).toBe("00000000-0000-4000-8000-000000000011");
    expect((await ctx.repository.query({ type: "book" })).length).toBe(3);
  });
});
