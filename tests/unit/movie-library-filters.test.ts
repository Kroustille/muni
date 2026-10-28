import { describe, expect, it } from "vitest";

import {
  collectLibraryFranchiseNames,
  collectLibraryTags,
  filterMoviesByTagOrFranchise,
} from "@/application/movies/movie-library-filters";
import type { Item } from "@/domain/item";

function movie(tags: string[] | null, franchiseName: string | null): Item {
  return {
    id: "1",
    type: "movie",
    title: "T",
    createdAt: "2026-01-01T10:00:00.000Z",
    author: null,
    status: "to_watch",
    recommendedBy: null,
    rating: null,
    notes: null,
    quantity: null,
    checked: false,
    ingredients: null,
    steps: null,
    deletedAt: null,
    fieldsUpdatedAt: {},
    isbn: null,
    synopsis: null,
    genres: null,
    publicationYear: null,
    publisher: null,
    pageCount: null,
    workId: null,
    tags,
    seriesName: null,
    seriesPosition: null,
    pagesRead: null,
    loanedTo: null,
    loanedAt: null,
    mood: null,
    pace: null,
    franchiseId: null,
    franchiseName,
    franchiseOrder: null,
    watchedAt: null,
    episodeProgress: null,
    nextEpisodeKey: null,
    streamingProviders: null,
    director: null,
    cast: null,
    imdbId: null,
    releaseYear: null,
    catalogRating: null,
    mediaKind: "film",
    artist: null,
    album: null,
    musicBrainzArtistId: null,
    musicBrainzRecordingId: null,
    spotifyUrl: null,
    soundcloudUrl: null,
    cookbookId: null,
    sourcePage: null,
    cookedDates: null,
  };
}

describe("movie library filters", () => {
  const items = [movie(["a"], "Saga"), movie(null, null)];

  it("collects tags and franchise names", () => {
    expect(collectLibraryTags(items)).toEqual(["a"]);
    expect(collectLibraryFranchiseNames(items)).toEqual(["Saga"]);
  });

  it("filters by tag or franchise", () => {
    expect(filterMoviesByTagOrFranchise(items, { tag: "a" })).toHaveLength(1);
    expect(filterMoviesByTagOrFranchise(items, { franchiseName: "Saga" })).toHaveLength(1);
  });
});
