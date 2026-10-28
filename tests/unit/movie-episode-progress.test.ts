import { describe, expect, it } from "vitest";

import { computeNextEpisode, markEpisodeWatched } from "@/application/movies/episode-progress";
import type { Item } from "@/domain/item";

function series(overrides: Partial<Item> = {}): Item {
  return {
    id: "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a12",
    type: "movie",
    title: "Série",
    createdAt: "2026-01-01T10:00:00.000Z",
    author: null,
    status: "in_progress",
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
    tags: null,
    seriesName: null,
    seriesPosition: null,
    pagesRead: null,
    loanedTo: null,
    loanedAt: null,
    mood: null,
    pace: null,
    franchiseId: null,
    franchiseName: null,
    franchiseOrder: null,
    watchedAt: null,
    episodeProgress: null,
    nextEpisodeKey: "S1E1",
    streamingProviders: null,
    director: null,
    cast: null,
    imdbId: null,
    releaseYear: null,
    catalogRating: null,
    mediaKind: "series",
    artist: null,
    album: null,
    musicBrainzArtistId: null,
    musicBrainzRecordingId: null,
    spotifyUrl: null,
    soundcloudUrl: null,
    cookbookId: null,
    sourcePage: null,
    ...overrides,
  };
}

describe("episode progress", () => {
  it("marks episode watched and advances next key", () => {
    const updated = markEpisodeWatched(series(), "S1E1", "2026-01-02");
    expect(updated.episodeProgress?.S1E1?.watchedAt).toBe("2026-01-02");
    expect(updated.nextEpisodeKey).toBe("S1E2");
  });

  it("computes next unwatched episode", () => {
    expect(computeNextEpisode({ S1E1: { watchedAt: "2026-01-01" } })).toBe("S1E2");
  });
});
