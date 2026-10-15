import { describe, expect, it } from "vitest";

import { newItem } from "@/domain/item";
import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";

describe("movie catalog fields in ItemRepository", () => {
  it("round-trips movie catalog columns through put/get", async () => {
    const repo = new InMemoryItemRepository();
    const item = newItem({
      id: "00000000-0000-4000-8000-000000000099",
      type: "movie",
      title: "Amélie",
      createdAt: "2026-01-01T00:00:00.000Z",
      imdbId: "tt0211915",
      synopsis: "Résumé",
      releaseYear: 2001,
      catalogRating: 8.3,
      mediaKind: "film",
    });
    await repo.put(item, { enqueue: false });
    expect(await repo.get(item.id)).toEqual(item);
  });
});
