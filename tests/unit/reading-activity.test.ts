import { describe, expect, it } from "vitest";

import type { Item } from "@/domain/item";
import { deriveReadingActivityDays } from "@/application/books/reading-activity";

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
    soundcloudUrl: null,
    ...overrides,
  };
}

describe("deriveReadingActivityDays", () => {
  it("marks a day active when status changes on that local day", () => {
    const items = [
      book({
        fieldsUpdatedAt: { status: "2026-03-15T10:00:00.000Z" },
        status: "reading",
      }),
    ];
    const days = deriveReadingActivityDays(items, "Europe/Paris");
    expect(days.has("2026-03-15")).toBe(true);
  });

  it("marks a day active when pagesRead updates", () => {
    const items = [
      book({
        status: "reading",
        pagesRead: 10,
        fieldsUpdatedAt: { pagesRead: "2026-04-01T12:00:00.000Z" },
      }),
    ];
    const days = deriveReadingActivityDays(items, "Europe/Paris");
    expect(days.has("2026-04-01")).toBe(true);
  });

  it("marks transition to read on the status update day", () => {
    const items = [
      book({
        status: "read",
        fieldsUpdatedAt: { status: "2026-05-10T08:00:00.000Z" },
      }),
    ];
    const days = deriveReadingActivityDays(items, "Europe/Paris");
    expect(days.has("2026-05-10")).toBe(true);
  });

  it("ignores non-book items and deleted books", () => {
    const items = [
      book({
        deletedAt: "2026-01-02T00:00:00.000Z",
        fieldsUpdatedAt: { status: "2026-01-02T00:00:00.000Z" },
      }),
      {
        ...book(),
        type: "movie",
        status: "to_watch",
        fieldsUpdatedAt: { status: "2026-01-03T00:00:00.000Z" },
      } as Item,
    ];
    const days = deriveReadingActivityDays(items, "Europe/Paris");
    expect(days.size).toBe(0);
  });

  it("includes paused status updates", () => {
    const items = [
      book({
        status: "paused",
        fieldsUpdatedAt: { status: "2026-07-01T12:00:00.000Z" },
      }),
    ];
    expect(deriveReadingActivityDays(items, "Europe/Paris").has("2026-07-01")).toBe(true);
  });
});
