import { describe, expect, it } from "vitest";

import { musicTracksStaleContributor } from "@/application/suggestions/contributors/music-tracks-stale-contributor";
import type { Item } from "@/domain/item";
import { InMemoryItemRepository } from "../../helpers/in-memory-item-repository";
import { CALENDAR_DAY, TZ, dateOnlyDaysAgo } from "./fixtures";

function track(overrides: Partial<Item> = {}): Item {
  return {
    id: "11111111-1111-4111-8111-111111111101",
    type: "music_track",
    title: "Track",
    createdAt: dateOnlyDaysAgo(90) + "T10:00:00.000Z",
    author: null,
    status: "to_listen",
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
    artist: "Artiste",
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

describe("musicTracksStaleContributor", () => {
  const ctx = { calendarDay: CALENDAR_DAY, timeZone: TZ };

  it("emits listen_backlog for stale to_listen tracks", async () => {
    const items = new InMemoryItemRepository();
    await items.put(
      track({
        fieldsUpdatedAt: { status: dateOnlyDaysAgo(35) + "T10:00:00.000Z" },
      }),
      { enqueue: false },
    );

    const candidates = await musicTracksStaleContributor.listStaleCandidates({ items } as never, ctx);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.kind).toBe("listen_backlog");
    expect(candidates[0]?.subtitle).toBe("Artiste");
  });

  it("ignores listened tracks", async () => {
    const items = new InMemoryItemRepository();
    await items.put(
      track({
        status: "listened",
        fieldsUpdatedAt: { status: dateOnlyDaysAgo(100) + "T10:00:00.000Z" },
      }),
      { enqueue: false },
    );

    const candidates = await musicTracksStaleContributor.listStaleCandidates({ items } as never, ctx);
    expect(candidates).toHaveLength(0);
  });
});
