import { describe, expect, it } from "vitest";

import { allStaleContributors } from "@/application/suggestions/contributors";
import {
  buildDailySuggestions,
  getSuggestionsViewModel,
} from "@/application/suggestions/build-daily-suggestions";
import type { DailyActivitySuggestionSnapshot } from "@/domain/activity-suggestion";
import { SUGGESTION_DOMAIN_IDS } from "@/domain/activity-suggestion";
import type { Item } from "@/domain/item";
import { InMemoryItemRepository } from "../../helpers/in-memory-item-repository";
import { InMemoryActivitySuggestionStore } from "./in-memory-activity-suggestion-store";
import { CALENDAR_DAY, TZ, dateOnlyDaysAgo } from "./fixtures";

function testIdGenerator() {
  let seq = 0;
  return {
    newId: () => {
      seq += 1;
      return `aaaaaaaa-bbbb-4ccc-8ddd-${String(seq).padStart(12, "0")}`;
    },
  };
}

function baseItem(type: Item["type"], id: string, overrides: Partial<Item> = {}): Item {
  return {
    id,
    type,
    title: "Titre",
    createdAt: dateOnlyDaysAgo(60) + "T10:00:00.000Z",
    author: null,
    status: type === "book" ? "to_read" : type === "music_track" ? "to_listen" : "to_watch",
    recommendedBy: null,
    rating: null,
    notes: null,
    quantity: null,
    checked: false,
    ingredients: null,
    steps: null,
    deletedAt: null,
    fieldsUpdatedAt:
      type === "recipe"
        ? {}
        : { status: dateOnlyDaysAgo(40) + "T10:00:00.000Z" },
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
    mediaKind: type === "movie" ? "film" : null,
    artist: type === "music_track" ? "Artiste" : null,
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

describe("buildDailySuggestions integration", () => {
  it("merges contributor pools and picks a cross-domain pair", async () => {
    const items = new InMemoryItemRepository();
    await items.put(
      baseItem("book", "11111111-1111-4111-8111-111111111101", {
        title: "Livre",
        fieldsUpdatedAt: { status: dateOnlyDaysAgo(35) + "T10:00:00.000Z" },
      }),
      { enqueue: false },
    );
    await items.put(
      baseItem("recipe", "22222222-2222-4222-8222-222222222202", {
        title: "Recette",
        status: null,
        createdAt: dateOnlyDaysAgo(50) + "T10:00:00.000Z",
      }),
      { enqueue: false },
    );

    const deps = {
      items,
      suggestionStore: new InMemoryActivitySuggestionStore(),
      idGenerator: testIdGenerator(),
      now: () => Date.parse(`${CALENDAR_DAY}T10:00:00.000Z`),
    };

    const snapshot = await buildDailySuggestions(deps, {
      calendarDay: CALENDAR_DAY,
      timeZone: TZ,
      trigger: "accueil_first_visit",
    });

    expect(snapshot.slots).toHaveLength(2);
    const domains = snapshot.slots.map((s) => s.candidate.domainId);
    expect(new Set(domains).size).toBe(2);
    expect(domains).toEqual(expect.arrayContaining(["book", "recipe"]));
  });

  it("never includes shopping in the merged candidate pool (FR-004)", async () => {
    const items = new InMemoryItemRepository();
    await items.put(
      baseItem("shopping", "33333333-3333-4333-8333-333333333303", {
        title: "Courses",
        status: null,
        createdAt: dateOnlyDaysAgo(200) + "T10:00:00.000Z",
      }),
      { enqueue: false },
    );
    await items.put(
      baseItem("book", "11111111-1111-4111-8111-111111111101", {
        fieldsUpdatedAt: { status: dateOnlyDaysAgo(35) + "T10:00:00.000Z" },
      }),
      { enqueue: false },
    );

    const ctx = { calendarDay: CALENDAR_DAY, timeZone: TZ };
    const merged = [];
    for (const contributor of allStaleContributors) {
      merged.push(...(await contributor.listStaleCandidates({ items } as never, ctx)));
    }

    expect(merged.some((c) => (c.domainId as string) === "shopping")).toBe(false);
    expect(SUGGESTION_DOMAIN_IDS).not.toContain("shopping");
  });

  it("snapshot shape has no recap achievement fields (FR-011 stub)", async () => {
    const items = new InMemoryItemRepository();
    await items.put(
      baseItem("book", "11111111-1111-4111-8111-111111111101", {
        fieldsUpdatedAt: { status: dateOnlyDaysAgo(35) + "T10:00:00.000Z" },
      }),
      { enqueue: false },
    );

    const snapshot = await buildDailySuggestions(
      {
        items,
        suggestionStore: new InMemoryActivitySuggestionStore(),
        idGenerator: testIdGenerator(),
        now: () => Date.parse(`${CALENDAR_DAY}T10:00:00.000Z`),
      },
      { calendarDay: CALENDAR_DAY, timeZone: TZ, trigger: "accueil_first_visit" },
    );

    const allowedKeys: (keyof DailyActivitySuggestionSnapshot)[] = [
      "calendarDay",
      "snapshotId",
      "computedAt",
      "slots",
      "blockDismissed",
      "timeZone",
    ];
    expect(Object.keys(snapshot).sort()).toEqual([...allowedKeys].sort());
    expect(getSuggestionsViewModel(snapshot).visibleSlots.every((s) => !("achievement" in s))).toBe(
      true,
    );
  });
});
