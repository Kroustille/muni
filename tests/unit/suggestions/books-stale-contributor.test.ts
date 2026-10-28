import { describe, expect, it } from "vitest";

import { booksStaleContributor } from "@/application/suggestions/contributors/books-stale-contributor";
import type { Item } from "@/domain/item";
import { InMemoryItemRepository } from "../../helpers/in-memory-item-repository";
import { CALENDAR_DAY, TZ, dateOnlyDaysAgo } from "./fixtures";

function book(overrides: Partial<Item> = {}): Item {
  return {
    id: "11111111-1111-4111-8111-111111111101",
    type: "book",
    title: "Test book",
    createdAt: dateOnlyDaysAgo(90) + "T10:00:00.000Z",
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
    mediaKind: null,
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

describe("booksStaleContributor", () => {
  const ctx = { calendarDay: CALENDAR_DAY, timeZone: TZ };

  it("emits start_to_read when to_read and stale at least 30 days", async () => {
    const items = new InMemoryItemRepository();
    await items.put(
      book({
        fieldsUpdatedAt: { status: dateOnlyDaysAgo(31) + "T10:00:00.000Z" },
      }),
      { enqueue: false },
    );

    const candidates = await booksStaleContributor.listStaleCandidates({ items } as never, ctx);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.kind).toBe("start_to_read");
    expect(candidates[0]?.score).toBeGreaterThanOrEqual(30);
  });

  it("emits resume_reading for reading status after 14 inactive days", async () => {
    const items = new InMemoryItemRepository();
    await items.put(
      book({
        status: "reading",
        fieldsUpdatedAt: { status: dateOnlyDaysAgo(20) + "T10:00:00.000Z" },
      }),
      { enqueue: false },
    );

    const candidates = await booksStaleContributor.listStaleCandidates({ items } as never, ctx);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.kind).toBe("resume_reading");
    expect(candidates[0]?.score).toBeGreaterThanOrEqual(14);
  });

  it("excludes read books and soft-deleted rows", async () => {
    const items = new InMemoryItemRepository();
    await items.put(
      book({
        status: "read",
        fieldsUpdatedAt: { status: dateOnlyDaysAgo(100) + "T10:00:00.000Z" },
      }),
      { enqueue: false },
    );
    await items.put(
      book({
        id: "22222222-2222-4222-8222-222222222202",
        deletedAt: dateOnlyDaysAgo(1) + "T10:00:00.000Z",
        fieldsUpdatedAt: { status: dateOnlyDaysAgo(40) + "T10:00:00.000Z" },
      }),
      { enqueue: false },
    );

    const candidates = await booksStaleContributor.listStaleCandidates({ items } as never, ctx);
    expect(candidates).toHaveLength(0);
  });
});
