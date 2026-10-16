import { describe, expect, it } from "vitest";

import { computeStreak, countMoviesFinishedInYear } from "@/application/movies/watch-insights";
import type { Item } from "@/domain/item";

const movie: Item = {
  id: "1",
  type: "movie",
  title: "T",
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
  fieldsUpdatedAt: { watched: "2026-03-01T10:00:00.000Z" },
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
};

describe("watch insights", () => {
  it("counts finished movies in year", () => {
    expect(countMoviesFinishedInYear([movie], 2026)).toBe(1);
  });

  it("computes streak", () => {
    const days = new Set(["2026-03-01", "2026-02-28", "2026-02-27"]);
    expect(computeStreak(days, "2026-03-01")).toBe(3);
  });
});
