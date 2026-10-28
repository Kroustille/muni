import { describe, expect, it } from "vitest";

import type { Item } from "@/domain/item";
import {
  buildActivityHeatmap,
  computeStreak,
  countBooksFinishedInYear,
  heatmapForYear,
  longestStreakInRange,
} from "@/application/books/reading-insights";

const BOOK_ID = "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a10";

function book(overrides: Partial<Item> = {}): Item {
  return {
    id: BOOK_ID,
    type: "book",
    title: "Test",
    createdAt: "2026-01-01T10:00:00.000Z",
    author: null,
    status: "to_read",
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
    imdbId: null,
    releaseYear: null,
    catalogRating: null,
    mediaKind: null,
    artist: null,
    album: null,
    musicBrainzArtistId: null,
    musicBrainzRecordingId: null,
    spotifyUrl: null,
    franchiseId: null,
    franchiseName: null,
    franchiseOrder: null,
    watchedAt: null,
    episodeProgress: null,
    nextEpisodeKey: null,
    streamingProviders: null,
    director: null,
    cast: null,
    soundcloudUrl: null,
    cookbookId: null,
    sourcePage: null,
    cookedDates: null,
    ...overrides,
  };
}

describe("reading insights aggregation", () => {
  it("computes streak ending on anchor day", () => {
    const days = new Set(["2026-03-01", "2026-03-02", "2026-03-03", "2026-03-05"]);
    expect(computeStreak(days, "2026-03-03")).toBe(3);
    expect(computeStreak(days, "2026-03-05")).toBe(1);
    expect(computeStreak(days, "2026-03-04")).toBe(0);
  });

  it("builds heatmap cells for inclusive date range", () => {
    const cells = buildActivityHeatmap(new Set(["2026-01-02"]), "2026-01-01", "2026-01-03");
    expect(cells).toHaveLength(3);
    expect(cells[1]).toEqual({ date: "2026-01-02", active: true });
    expect(cells[0].active).toBe(false);
  });

  it("counts books finished in calendar year", () => {
    const items = [
      book({
        status: "read",
        fieldsUpdatedAt: { read: "2026-06-01T10:00:00.000Z" },
      }),
      book({
        id: "other",
        status: "read",
        fieldsUpdatedAt: { read: "2025-06-01T10:00:00.000Z" },
      }),
    ];
    expect(countBooksFinishedInYear(items, 2026)).toBe(1);
  });

  it("builds yearly heatmap from items", () => {
    const items = [
      book({
        status: "reading",
        fieldsUpdatedAt: { pagesRead: "2026-02-10T12:00:00.000Z" },
        pagesRead: 5,
      }),
    ];
    const cells = heatmapForYear(items, 2026);
    const active = cells.filter((c) => c.active);
    expect(active.some((c) => c.date === "2026-02-10")).toBe(true);
  });

  it("finds longest streak in range", () => {
    const days = new Set(["2026-04-01", "2026-04-02", "2026-04-05", "2026-04-06", "2026-04-07"]);
    expect(longestStreakInRange(days, "2026-04-01", "2026-04-07")).toBe(3);
  });
});
