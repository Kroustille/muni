import { describe, expect, it } from "vitest";

import { recipesStaleContributor } from "@/application/suggestions/contributors/recipes-stale-contributor";
import type { Item } from "@/domain/item";
import { InMemoryItemRepository } from "../../helpers/in-memory-item-repository";
import { CALENDAR_DAY, TZ, dateOnlyDaysAgo } from "./fixtures";

type RecipeItem = Item & { cookedDates?: string[] | null };

function recipe(overrides: Partial<RecipeItem> = {}): RecipeItem {
  return {
    id: "11111111-1111-4111-8111-111111111101",
    type: "recipe",
    title: "Recette",
    createdAt: dateOnlyDaysAgo(60) + "T10:00:00.000Z",
    author: null,
    status: null,
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
    cookedDates: null,
    ...overrides,
  };
}

describe("recipesStaleContributor", () => {
  const ctx = { calendarDay: CALENDAR_DAY, timeZone: TZ };

  it("emits cook_first when never cooked and stale at least 45 days", async () => {
    const items = new InMemoryItemRepository();
    await items.put(recipe({ createdAt: dateOnlyDaysAgo(50) + "T10:00:00.000Z" }), {
      enqueue: false,
    });

    const candidates = await recipesStaleContributor.listStaleCandidates({ items } as never, ctx);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.kind).toBe("cook_first");
    expect(candidates[0]?.score).toBeGreaterThanOrEqual(45);
  });

  it("emits cook_again from max cookedDates when cooked before", async () => {
    const items = new InMemoryItemRepository();
    await items.put(
      recipe({
        cookedDates: [dateOnlyDaysAgo(40), dateOnlyDaysAgo(35)],
      }),
      { enqueue: false },
    );

    const candidates = await recipesStaleContributor.listStaleCandidates({ items } as never, ctx);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.kind).toBe("cook_again");
    expect(candidates[0]?.staleAnchorDate).toBe(dateOnlyDaysAgo(35));
  });
});
