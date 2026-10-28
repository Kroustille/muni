import { describe, expect, it } from "vitest";

import { suggestMovies } from "@/application/movies/recommendations";
import type { Item } from "@/domain/item";

function movie(partial: Partial<Item>): Item {
  return {
    id: partial.id ?? "1",
    type: "movie",
    title: partial.title ?? "T",
    createdAt: "2026-01-01T10:00:00.000Z",
    author: null,
    status: partial.status ?? "to_watch",
    recommendedBy: null,
    rating: null,
    notes: null,
    quantity: null,
    checked: false,
    ingredients: null,
    steps: null,
    deletedAt: null,
    fieldsUpdatedAt: partial.fieldsUpdatedAt ?? {},
    isbn: null,
    synopsis: null,
    genres: null,
    publicationYear: null,
    publisher: null,
    pageCount: null,
    workId: null,
    tags: partial.tags ?? null,
    seriesName: null,
    seriesPosition: null,
    pagesRead: null,
    loanedTo: null,
    loanedAt: null,
    mood: partial.mood ?? null,
    pace: null,
    franchiseId: null,
    franchiseName: partial.franchiseName ?? null,
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
    mediaKind: partial.mediaKind ?? "film",
    artist: null,
    album: null,
    musicBrainzArtistId: null,
    musicBrainzRecordingId: null,
    spotifyUrl: null,
    soundcloudUrl: null,
    cookbookId: null,
    sourcePage: null,
    cookedDates: null,
  };
}

describe("suggestMovies", () => {
  it("suggests to_watch titles sharing tags with recently watched", () => {
    const items = [
      movie({
        id: "w",
        status: "watched",
        tags: ["nolan"],
        fieldsUpdatedAt: { watched: "2026-02-01T10:00:00.000Z" },
      }),
      movie({ id: "c", status: "to_watch", tags: ["nolan"] }),
      movie({ id: "x", status: "to_watch", tags: ["other"] }),
    ];
    const picks = suggestMovies(items, { now: new Date("2026-06-01T00:00:00.000Z"), random: () => 0 });
    expect(picks.map((i) => i.id)).toContain("c");
    expect(picks.map((i) => i.id)).not.toContain("x");
  });
});
