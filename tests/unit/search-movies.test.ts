import { describe, expect, it, vi } from "vitest";

import {
  createFetchMovieCatalogDetail,
  createSearchMovies,
} from "@/application/movies/search-movies";
import type { MovieCatalogSearch } from "@/application/ports/movie-catalog-search";

describe("searchMovies use case", () => {
  const catalog: MovieCatalogSearch = {
    searchByTitle: vi.fn(),
    getDetail: vi.fn(),
  };

  it("returns empty results for blank queries without calling the catalog", async () => {
    const searchMovies = createSearchMovies({ catalog });
    await expect(searchMovies("   ")).resolves.toEqual([]);
    expect(catalog.searchByTitle).not.toHaveBeenCalled();
  });

  it("delegates trimmed queries to the catalog port", async () => {
    vi.mocked(catalog.searchByTitle).mockResolvedValue([
      { wikidataId: "Q193048", title: "Amélie", mediaKind: "film" },
    ]);
    const searchMovies = createSearchMovies({ catalog });
    await expect(searchMovies("  amélie ", 10)).resolves.toHaveLength(1);
    expect(catalog.searchByTitle).toHaveBeenCalledWith("amélie", 10);
  });

  it("fetchMovieCatalogDetail delegates to getDetail", async () => {
    vi.mocked(catalog.getDetail).mockResolvedValue({
      wikidataId: "Q193048",
      title: "Amélie",
      mediaKind: "film",
      synopsis: "Résumé",
    });
    const fetchDetail = createFetchMovieCatalogDetail({ catalog });
    await expect(fetchDetail("Q193048")).resolves.toMatchObject({ synopsis: "Résumé" });
  });
});
