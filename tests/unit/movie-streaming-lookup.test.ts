import { describe, expect, it } from "vitest";

import { lookupMovieStreaming } from "@/application/movies/streaming-lookup";

describe("lookupMovieStreaming", () => {
  it("returns empty providers and caches stub result", async () => {
    const cache = {
      store: new Map<string, unknown>(),
      async get(provider: string, key: string) {
        return this.store.get(`${provider}:${key}`) ?? null;
      },
      async upsert(record: { provider: string; cacheKey: string; payload: unknown }) {
        this.store.set(`${record.provider}:${record.cacheKey}`, record.payload);
      },
    };

    const first = await lookupMovieStreaming("tt0211915", { cache });
    expect(first).toEqual([]);
    const second = await lookupMovieStreaming("tt0211915", { cache });
    expect(second).toEqual([]);
    expect(cache.store.get("movie_streaming:tt0211915")).toEqual([]);
  });
});
