import { describe, expect, it } from "vitest";

import { moviesStaleContributor } from "@/application/suggestions/contributors/movies-stale-contributor";
import type { Item } from "@/domain/item";
import { InMemoryItemRepository } from "../../helpers/in-memory-item-repository";
import { CALENDAR_DAY, TZ, dateOnlyDaysAgo, daysAgoIso } from "./fixtures";

function movie(overrides: Partial<Item> = {}): Item {
  return {
    id: "11111111-1111-4111-8111-111111111101",
    type: "movie",
    title: "Film test",
    createdAt: dateOnlyDaysAgo(90) + "T10:00:00.000Z",
    author: null,
    status: "to_watch",
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
    mediaKind: "film",
    artist: null,
    album: null,
    musicBrainzArtistId: null,
    musicBrainzRecordingId: null,
    spotifyUrl: null,
    soundcloudUrl: null,
    ...overrides,
  };
}

describe("moviesStaleContributor", () => {
  const ctx = { calendarDay: CALENDAR_DAY, timeZone: TZ };

  it("emits watch_film for stale to_watch films", async () => {
    const items = new InMemoryItemRepository();
    await items.put(
      movie({
        fieldsUpdatedAt: { status: dateOnlyDaysAgo(35) + "T10:00:00.000Z" },
      }),
      { enqueue: false },
    );

    const candidates = await moviesStaleContributor.listStaleCandidates({ items } as never, ctx);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.kind).toBe("watch_film");
  });

  it("emits continue_series when episode progress is incomplete", async () => {
    const items = new InMemoryItemRepository();
    await items.put(
      movie({
        id: "22222222-2222-4222-8222-222222222202",
        title: "Série",
        mediaKind: "series",
        status: "in_progress",
        episodeProgress: {
          S1E1: { watchedAt: daysAgoIso(20) },
          S1E2: {},
        },
        nextEpisodeKey: "S1E2",
      }),
      { enqueue: false },
    );

    const candidates = await moviesStaleContributor.listStaleCandidates({ items } as never, ctx);
    expect(candidates.some((c) => c.kind === "continue_series")).toBe(true);
  });

  it("emits start_series for to_watch series without progress", async () => {
    const items = new InMemoryItemRepository();
    await items.put(
      movie({
        mediaKind: "series",
        status: "to_watch",
        fieldsUpdatedAt: { status: dateOnlyDaysAgo(40) + "T10:00:00.000Z" },
      }),
      { enqueue: false },
    );

    const candidates = await moviesStaleContributor.listStaleCandidates({ items } as never, ctx);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.kind).toBe("start_series");
  });
});
