import { describe, expect, it, vi } from "vitest";

import {
  createSearchMusicArtists,
  createSearchMusicTracks,
} from "@/application/music/search-music";
import type { MusicCatalogSearch } from "@/application/ports/music-catalog-search";

describe("search music use cases", () => {
  it("delegates artist search to the catalog port", async () => {
    const catalog: MusicCatalogSearch = {
      searchArtists: vi.fn(async () => [
        { musicBrainzArtistId: "53565d2a-ba1c-4e77-9b8a-7a53b4c34512", name: "Khruangbin" },
      ]),
      searchRecordings: vi.fn(),
    };
    const search = createSearchMusicArtists({ catalog });
    const hits = await search("Khruangbin", 5);
    expect(hits).toHaveLength(1);
    expect(catalog.searchArtists).toHaveBeenCalledWith("Khruangbin", 5);
  });

  it("returns empty for blank track queries", async () => {
    const catalog: MusicCatalogSearch = {
      searchArtists: vi.fn(),
      searchRecordings: vi.fn(),
    };
    const search = createSearchMusicTracks({ catalog });
    expect(await search("   ")).toEqual([]);
    expect(catalog.searchRecordings).not.toHaveBeenCalled();
  });
});
