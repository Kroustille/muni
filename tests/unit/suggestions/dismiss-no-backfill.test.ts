import { describe, expect, it } from "vitest";

import { buildDailySuggestions } from "@/application/suggestions/build-daily-suggestions";
import { createSuggestionsUseCases } from "@/application/suggestions/use-cases";
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

function staleBook(id: string, title: string, days: number): Item {
  return {
    id,
    type: "book",
    title,
    createdAt: dateOnlyDaysAgo(90) + "T12:00:00.000Z",
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
    fieldsUpdatedAt: { status: dateOnlyDaysAgo(days) + "T12:00:00.000Z" },
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
  };
}

describe("dismiss without backfill (FR-012)", () => {
  it("does not add a third slot after dismiss until manual refresh", async () => {
    const items = new InMemoryItemRepository();
    await items.put(staleBook("11111111-1111-4111-8111-111111111101", "A", 35), {
      enqueue: false,
    });
    await items.put(staleBook("22222222-2222-4222-8222-222222222202", "B", 34), {
      enqueue: false,
    });
    await items.put(staleBook("33333333-3333-4333-8333-333333333303", "C", 33), {
      enqueue: false,
    });

    const store = new InMemoryActivitySuggestionStore();
    const deps = {
      items,
      suggestionStore: store,
      idGenerator: testIdGenerator(),
      now: () => Date.parse(`${CALENDAR_DAY}T10:00:00.000Z`),
    };
    const useCases = createSuggestionsUseCases(deps);

    const initial = await buildDailySuggestions(deps, {
      calendarDay: CALENDAR_DAY,
      timeZone: TZ,
      trigger: "accueil_first_visit",
    });
    expect(initial.slots).toHaveLength(2);

    const dismissedSlotId = initial.slots[0]!.slotId;
    await useCases.dismissSlot(CALENDAR_DAY, dismissedSlotId);

    const afterDismiss = await buildDailySuggestions(deps, {
      calendarDay: CALENDAR_DAY,
      timeZone: TZ,
      trigger: "accueil_first_visit",
    });
    expect(afterDismiss.slots).toHaveLength(2);
    expect(afterDismiss.slots.filter((s) => s.dismissedAt === null)).toHaveLength(1);

    const afterRefresh = await buildDailySuggestions(deps, {
      calendarDay: CALENDAR_DAY,
      timeZone: TZ,
      trigger: "manual_refresh",
    });
    expect(afterRefresh.slots).toHaveLength(2);
    expect(afterRefresh.slots.filter((s) => s.dismissedAt === null)).toHaveLength(1);
    expect(afterRefresh.slots.some((s) => s.dismissedAt !== null)).toBe(true);
  });
});
