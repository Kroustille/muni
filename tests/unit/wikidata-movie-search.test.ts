import { describe, expect, it, vi } from "vitest";

import { MovieCatalogSearchError } from "@/application/ports/movie-catalog-search";
import {
  buildWikidataEntitySearchParams,
  buildWikidataGetEntitiesParams,
  createWikidataMovieCatalogSearch,
} from "@/adapters/wikidata/movie-catalog-search";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { InMemoryCatalogCacheRepository } from "../helpers/in-memory-catalog-cache-repository";

const API_BASE = "https://wikidata.test/w/api.php";

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(__dirname, "../fixtures/wikidata", name), "utf8"));
}

describe("Wikidata movie catalog search adapter", () => {
  it("returns empty results for blank queries without calling fetch", async () => {
    const fetch = vi.fn();
    const search = createWikidataMovieCatalogSearch({ fetch, apiBase: API_BASE });
    await expect(search.searchByTitle("   ")).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("caches and returns empty arrays when search finds no entity ids", async () => {
    const fetch = vi.fn(async () => jsonResponse({ search: [] }));
    const cache = new InMemoryCatalogCacheRepository();
    const now = new Date("2026-06-01T00:00:00.000Z");
    const search = createWikidataMovieCatalogSearch({
      fetch,
      apiBase: API_BASE,
      cache,
      now: () => now,
    });

    await expect(search.searchByTitle("introuvable xyz", 5)).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);

    const fetchAfterCache = vi.fn();
    const cachedSearch = createWikidataMovieCatalogSearch({
      fetch: fetchAfterCache,
      apiBase: API_BASE,
      cache,
      now: () => now,
    });
    await expect(cachedSearch.searchByTitle("introuvable xyz", 5)).resolves.toEqual([]);
    expect(fetchAfterCache).not.toHaveBeenCalled();
  });

  it("uses French-first wbsearchentities params", () => {
    expect(buildWikidataEntitySearchParams("Amélie", 10)).toMatchObject({
      action: "wbsearchentities",
      language: "fr",
      uselang: "fr",
      type: "item",
      limit: "10",
    });
  });

  it("uses French-first wbgetentities params", () => {
    expect(buildWikidataGetEntitiesParams(["Q193048"])).toMatchObject({
      action: "wbgetentities",
      languages: "fr|en",
      language: "fr",
      uselang: "fr",
    });
  });

  it("filters non-film entities and over-fetches search ids until enough hits", async () => {
    const filmPayload = loadFixture("film-entity.json");
    const episodePayload = loadFixture("episode-entity.json");
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.searchParams.get("action") === "wbsearchentities") {
        return jsonResponse({
          search: [
            { id: "Q9990001", label: "Episode un" },
            { id: "Q193048", label: "Amélie" },
          ],
        });
      }
      if (url.searchParams.get("action") === "wbgetentities") {
        const ids = url.searchParams.get("ids")?.split("|") ?? [];
        const entities: Record<string, unknown> = {};
        for (const id of ids) {
          if (id === "Q193048") entities[id] = (filmPayload as { entities: Record<string, unknown> }).entities.Q193048;
          if (id === "Q9990001") entities[id] = (episodePayload as { entities: Record<string, unknown> }).entities.Q1234567;
        }
        return jsonResponse({ entities });
      }
      return new Response("missing", { status: 404 });
    });

    const search = createWikidataMovieCatalogSearch({ fetch, apiBase: API_BASE });
    const hits = await search.searchByTitle("Amélie", 1);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.wikidataId).toBe("Q193048");
    expect(hits[0]?.mediaKind).toBe("film");
  });

  it("throws MovieCatalogSearchError on provider HTTP errors", async () => {
    const fetch = vi.fn(async () => new Response("error", { status: 503 }));
    const search = createWikidataMovieCatalogSearch({ fetch, apiBase: API_BASE });
    await expect(search.searchByTitle("Amélie")).rejects.toBeInstanceOf(MovieCatalogSearchError);
  });

  it("returns null for invalid entity ids without fetch", async () => {
    const fetch = vi.fn();
    const search = createWikidataMovieCatalogSearch({ fetch, apiBase: API_BASE });
    await expect(search.getDetail("not-a-qid")).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
