import { describe, expect, it } from "vitest";

import { buildMovieYearInReview, computeMovieStats } from "@/application/movies/movie-stats";
import type { Item } from "@/domain/item";

function movie(overrides: Partial<Item> = {}): Item {
  return {
    id: "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a10",
    type: "movie",
    title: "Test",
    createdAt: "2026-01-01T10:00:00.000Z",
    author: null,
    status: "watched",
    recommendedBy: null,
    rating: null,
    notes: null,
    quantity: null,
    checked: false,
    ingredients: null,
    steps: null,
    deletedAt: null,
    fieldsUpdatedAt: { watched: "2026-03-10T10:00:00.000Z" },
    isbn: null,
    synopsis: null,
    genres: null,
    publicationYear: null,
    publisher: null,
    pageCount: null,
    workId: null,
    tags: ["sci-fi"],
    seriesName: null,
    seriesPosition: null,
    pagesRead: null,
    loanedTo: null,
    loanedAt: null,
    mood: null,
    pace: null,
    franchiseId: null,
    franchiseName: "Saga",
    franchiseOrder: null,
    watchedAt: null,
    episodeProgress: null,
    nextEpisodeKey: null,
    streamingProviders: null,
    director: null,
    cast: null,
    imdbId: null,
    releaseYear: 2010,
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

describe("computeMovieStats", () => {
  it("counts watched movies in year", () => {
    const stats = computeMovieStats([movie()], 2026);
    expect(stats.finishedByMonth[2].count).toBe(1);
    expect(stats.tags[0]?.label).toBe("sci-fi");
    expect(stats.franchises[0]?.label).toBe("Saga");
  });

  it("builds year in review", () => {
    const review = buildMovieYearInReview([movie()], 2026);
    expect(review.moviesWatched).toBe(1);
  });
});
