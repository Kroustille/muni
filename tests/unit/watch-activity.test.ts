import { describe, expect, it } from "vitest";

import {
  deriveWatchActivityDays,
  watchActivityFieldStamps,
} from "@/application/movies/watch-activity";
import type { Item } from "@/domain/item";

const base: Item = {
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
  fieldsUpdatedAt: { status: "2026-03-01T12:00:00.000Z", watched: "2026-03-01T12:00:00.000Z" },
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
  watchedAt: "2026-03-01",
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
};

describe("watch activity", () => {
  it("derives activity days from status and watchedAt", () => {
    const days = deriveWatchActivityDays([base]);
    expect(days.has("2026-03-01")).toBe(true);
  });

  it("stamps watched on status transition", () => {
    const stamps = watchActivityFieldStamps(
      { ...base, status: "to_watch" },
      { status: "watched" },
      "2026-03-02T10:00:00.000Z",
    );
    expect(stamps.watched).toBe("2026-03-02T10:00:00.000Z");
  });
});
