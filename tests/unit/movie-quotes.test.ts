import { describe, expect, it } from "vitest";

import { createMovieQuoteUseCases } from "@/application/movies/movie-quotes";
import { InMemoryMovieQuoteRepository } from "../helpers/in-memory-movie-quote-repository";
import type { Item } from "@/domain/item";

const MOVIE_ID = "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a10";

function movieItem(): Item {
  return {
    id: MOVIE_ID,
    type: "movie",
    title: "Film",
    createdAt: "2026-01-01T10:00:00.000Z",
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
  cookbookId: null,
  sourcePage: null,
  };
}

describe("movie quotes use cases", () => {
  it("adds and lists quotes", async () => {
    const quotes = new InMemoryMovieQuoteRepository();
    const items = {
      get: async (id: string) => (id === MOVIE_ID ? movieItem() : undefined),
      meta: {
        get: async () => undefined,
        set: async () => undefined,
      },
    };
    const uc = createMovieQuoteUseCases({
      quotes,
      items,
      idGenerator: { newId: () => "7f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a11" },
      now: () => 1_700_000_000_000,
    });
    const created = await uc.addQuote(MOVIE_ID, { text: "Hello", context: "scène" });
    expect(created.text).toBe("Hello");
    expect((await uc.listQuotes(MOVIE_ID))).toHaveLength(1);
  });
});
