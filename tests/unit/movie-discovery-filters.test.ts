import { describe, expect, it } from "vitest";

import {
  filterMoviesByDiscovery,
  isValidMovieDiscoveryFilter,
} from "@/application/movies/discovery-filters";
import { BOOK_MOODS, type Item } from "@/domain/item";

function movie(overrides: Partial<Item> = {}): Item {
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
    tags: ["tag-a"],
    seriesName: null,
    seriesPosition: null,
    pagesRead: null,
    loanedTo: null,
    loanedAt: null,
    mood: BOOK_MOODS[0],
    pace: null,
    franchiseId: null,
    franchiseName: null,
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
    ...overrides,
  };
}

describe("movie discovery filters", () => {
  it("validates mood keys", () => {
    expect(isValidMovieDiscoveryFilter({ mood: BOOK_MOODS[0] })).toBe(true);
    expect(isValidMovieDiscoveryFilter({ mood: "x" as never })).toBe(false);
  });

  it("filters by mood and tag", () => {
    const items = [movie(), movie({ mood: null, tags: null })];
    const filtered = filterMoviesByDiscovery(items, { mood: BOOK_MOODS[0], tags: ["tag-a"] });
    expect(filtered).toHaveLength(1);
  });
});
