import { describe, expect, it } from "vitest";

import { createSearchUseCase } from "@/application/search";
import { newItem } from "@/domain/item";
import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";

describe("app search index (L2)", () => {
  it("matches music items by title only, not artist text on tracks", async () => {
    const repo = new InMemoryItemRepository();
    await repo.put(
      newItem({
        id: "00000000-0000-4000-8000-000000000001",
        type: "music_track",
        title: "Time (You and I)",
        artist: "Khruangbin",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      { enqueue: false },
    );
    await repo.put(
      newItem({
        id: "00000000-0000-4000-8000-000000000002",
        type: "music_artist",
        title: "Khruangbin",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      { enqueue: false },
    );
    const search = createSearchUseCase({ repository: repo });
    const byTitle = await search.search("Time");
    expect(byTitle.map((item) => item.type)).toEqual(["music_track"]);
    const byArtistName = await search.search("Khruangbin");
    expect(byArtistName.map((item) => item.type)).toEqual(["music_artist"]);
  });
});
