import { describe, expect, it } from "vitest";

import { buildDailySuggestions } from "@/application/suggestions/build-daily-suggestions";
import { InMemoryItemRepository } from "../../helpers/in-memory-item-repository";
import { InMemoryActivitySuggestionStore } from "./in-memory-activity-suggestion-store";
import { CALENDAR_DAY, TZ, dateOnlyDaysAgo } from "./fixtures";
import type { Item } from "@/domain/item";

function testIdGenerator() {
  let seq = 0;
  return {
    newId: () => {
      seq += 1;
      return `aaaaaaaa-bbbb-4ccc-8ddd-${String(seq).padStart(12, "0")}`;
    },
  };
}

function bookItem(overrides: Partial<Item> = {}): Item {
  return {
    id: "11111111-1111-4111-8111-111111111101",
    type: "book",
    title: "Livre stale",
    createdAt: dateOnlyDaysAgo(60) + "T12:00:00.000Z",
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
    fieldsUpdatedAt: { status: dateOnlyDaysAgo(35) + "T12:00:00.000Z" },
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

describe("snapshot idempotency (014)", () => {
  it("returns the same snapshotId on same calendar day revisit", async () => {
    const items = new InMemoryItemRepository();
    await items.put(bookItem(), { enqueue: false });
    await items.put(
      bookItem({
        id: "22222222-2222-4222-8222-222222222202",
        title: "Autre livre",
        fieldsUpdatedAt: { status: dateOnlyDaysAgo(40) + "T12:00:00.000Z" },
      }),
      { enqueue: false },
    );

    const deps = {
      items,
      suggestionStore: new InMemoryActivitySuggestionStore(),
      idGenerator: testIdGenerator(),
      now: () => Date.parse(`${CALENDAR_DAY}T10:00:00.000Z`),
    };

    const first = await buildDailySuggestions(deps, {
      calendarDay: CALENDAR_DAY,
      timeZone: TZ,
      trigger: "accueil_first_visit",
    });
    const second = await buildDailySuggestions(deps, {
      calendarDay: CALENDAR_DAY,
      timeZone: TZ,
      trigger: "accueil_first_visit",
    });

    expect(second.snapshotId).toBe(first.snapshotId);
    expect(second.slots.map((s) => s.candidate.itemId)).toEqual(
      first.slots.map((s) => s.candidate.itemId),
    );
  });
});
