import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  mapEntityResponseToDetail,
  mapEntityToMovieHit,
  mapEntitiesResponseToHits,
  mapSearchResponseIds,
} from "@/adapters/wikidata/wikidata-movie-mapper";

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(__dirname, "../fixtures/wikidata", name), "utf8"));
}

describe("wikidata movie mapper", () => {
  it("maps a film entity to a search hit", () => {
    const payload = loadFixture("film-entity.json") as Parameters<typeof mapEntitiesResponseToHits>[0];
    const hits = mapEntitiesResponseToHits(payload, ["Q193048"]);
    expect(hits).toEqual([
      {
        wikidataId: "Q193048",
        title: "Le Fabuleux Destin d'Amélie Poulain",
        imdbId: "tt0211915",
        releaseYear: 2001,
        catalogRating: 8.3,
        mediaKind: "film",
      },
    ]);
  });

  it("maps a television series entity", () => {
    const payload = loadFixture("series-entity.json") as Parameters<typeof mapEntitiesResponseToHits>[0];
    const hits = mapEntitiesResponseToHits(payload, ["Q23640"]);
    expect(hits[0]?.mediaKind).toBe("series");
    expect(hits[0]?.imdbId).toBe("tt0903747");
  });

  it("filters out television episodes", () => {
    const payload = loadFixture("episode-entity.json") as Parameters<typeof mapEntitiesResponseToHits>[0];
    expect(mapEntitiesResponseToHits(payload, ["Q1234567"])).toEqual([]);
  });

  it("includes synopsis on detail mapping", () => {
    const payload = loadFixture("film-entity.json") as Parameters<typeof mapEntityResponseToDetail>[0];
    const detail = mapEntityResponseToDetail(payload, "Q193048");
    expect(detail?.synopsis).toBe("Amélie est une serveuse discrète.");
  });

  it("extracts search result ids", () => {
    expect(
      mapSearchResponseIds({
        search: [{ id: "Q193048", label: "Amélie" }, { id: "invalid" }, { label: "x" }],
      }),
    ).toEqual(["Q193048"]);
  });

  it("returns null when label is missing", () => {
    expect(mapEntityToMovieHit({ claims: { P31: [] } }, "Q1")).toBeNull();
  });
});
