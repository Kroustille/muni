import { describe, expect, it } from "vitest";

import {
  movieQuoteWireSchema,
  newMovieQuote,
  wireToMovieQuote,
} from "@/domain/movie-quote";

const MOVIE_ID = "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a10";

describe("MovieQuote domain", () => {
  it("round-trips wire format", () => {
    const wire = movieQuoteWireSchema.parse({
      id: MOVIE_ID,
      movie_item_id: "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a11",
      text: "Citation",
      context: "Acte II",
      created_at: "2026-01-01T10:00:00.000Z",
      deleted_at: null,
      fields_updated_at: {},
    });
    const quote = wireToMovieQuote(wire);
    expect(quote.context).toBe("Acte II");
  });

  it("creates quotes", () => {
    const quote = newMovieQuote({
      id: MOVIE_ID,
      movieItemId: "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a11",
      text: "Hi",
      createdAt: "2026-01-01T10:00:00.000Z",
    });
    expect(quote.text).toBe("Hi");
  });
});
