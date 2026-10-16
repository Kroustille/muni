import { describe, expect, it } from "vitest";

import type { Item } from "@/domain/item";
import { buildYearInReview, computeBookStats } from "@/application/books/book-stats";

const BOOK_ID = "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a10";

function book(overrides: Partial<Item> = {}): Item {
  return {
    id: BOOK_ID,
    type: "book",
    title: "Test",
    createdAt: "2026-01-01T10:00:00.000Z",
    author: "Camus",
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
    genres: ["roman"],
    publicationYear: null,
    publisher: null,
    pageCount: 200,
    workId: null,
    tags: ["classique"],
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
    ...overrides,
  };
}

describe("book stats", () => {
  it("aggregates monthly finishes and dimensions", () => {
    const items = [
      book({
        id: "a",
        status: "read",
        author: "Camus",
        tags: ["classique"],
        genres: ["roman"],
        pagesRead: 180,
        fieldsUpdatedAt: { read: "2026-03-10T10:00:00.000Z" },
      }),
      book({
        id: "b",
        title: "Other",
        status: "read",
        author: "Hugo",
        tags: ["classique", "histoire"],
        genres: ["roman", "historique"],
        pageCount: 400,
        fieldsUpdatedAt: { read: "2026-03-20T10:00:00.000Z" },
      }),
    ];
    const stats = computeBookStats(items, 2026);
    expect(stats.finishedByMonth[2].count).toBe(2);
    expect(stats.authors.find((row) => row.label === "Camus")?.count).toBe(1);
    expect(stats.tags.find((row) => row.label === "classique")?.count).toBe(2);
    expect(stats.genres.find((row) => row.label === "roman")?.count).toBe(2);
    expect(stats.pagesReadTotal).toBe(580);
  });

  it("builds year in review summary", () => {
    const items = [
      book({
        status: "read",
        fieldsUpdatedAt: { read: "2026-01-05T10:00:00.000Z" },
        pagesRead: 50,
      }),
    ];
    const review = buildYearInReview(items, 2026);
    expect(review.booksRead).toBe(1);
    expect(review.pagesRead).toBe(50);
    expect(review.topTags[0]?.label).toBe("classique");
  });
});
