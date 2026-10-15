import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { createMusicBrainzCatalogSearch } from "@/adapters/musicbrainz/music-catalog-search";
import { InMemoryCatalogCacheRepository } from "../helpers/in-memory-catalog-cache-repository";

const FIXTURES = join(process.cwd(), "tests/fixtures/musicbrainz");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURES, name), "utf8"));
}

describe("MusicBrainz catalog search", () => {
  it("maps artist search fixtures", async () => {
    const fetchFn: typeof fetch = vi.fn(async (input) => {
      expect(String(input)).toContain("/artist?");
      return new Response(JSON.stringify(loadFixture("artist-search.json")), { status: 200 });
    }) as typeof fetch;
    const catalog = createMusicBrainzCatalogSearch({ fetch: fetchFn, apiBase: "https://mb.test/ws/2" });
    const hits = await catalog.searchArtists("Khruangbin");
    expect(hits).toEqual([
      {
        musicBrainzArtistId: "53565d2a-ba1c-4e77-9b8a-7a53b4c34512",
        name: "Khruangbin",
        disambiguation: "US trio",
      },
    ]);
  });

  it("maps recording search fixtures", async () => {
    const fetchFn: typeof fetch = vi.fn(async (input) => {
      expect(String(input)).toContain("/recording?");
      return new Response(JSON.stringify(loadFixture("recording-search.json")), { status: 200 });
    }) as typeof fetch;
    const catalog = createMusicBrainzCatalogSearch({ fetch: fetchFn, apiBase: "https://mb.test/ws/2" });
    const hits = await catalog.searchRecordings("Time");
    expect(hits[0]).toMatchObject({
      musicBrainzRecordingId: "a1b2c3d4-e5f6-4789-a012-3456789abcde",
      title: "Time (You and I)",
      artist: "Khruangbin",
      album: "Mordechai",
      releaseYear: 2020,
    });
  });

  it("uses cache on repeated artist queries", async () => {
    const fetch = vi.fn(async () =>
      Response.json(loadFixture("artist-search.json")),
    );
    const cache = new InMemoryCatalogCacheRepository();
    const now = new Date("2026-01-01T00:00:00.000Z");
    const catalog = createMusicBrainzCatalogSearch({
      fetch,
      cache,
      apiBase: "https://mb.test/ws/2",
      now: () => now,
    });
    await catalog.searchArtists("Khruangbin");
    await catalog.searchArtists("Khruangbin");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
