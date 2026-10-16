import { describe, expect, it } from "vitest";

import {
  bookQuoteWireSchema,
  newBookQuote,
  wireToBookQuote,
} from "@/domain/book-quote";

const QUOTE_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const BOOK_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
const NOW = "2026-06-01T12:00:00.000Z";

describe("BookQuote domain", () => {
  it("creates a quote with trimmed text", () => {
    const quote = newBookQuote({
      id: QUOTE_ID,
      bookItemId: BOOK_ID,
      text: "  Un passage marquant.  ",
      createdAt: NOW,
      page: 42,
    });
    expect(quote.text).toBe("Un passage marquant.");
    expect(quote.page).toBe(42);
  });

  it("round-trips wire format", () => {
    const wire = bookQuoteWireSchema.parse({
      id: QUOTE_ID,
      book_item_id: BOOK_ID,
      text: "Citation",
      page: null,
      created_at: NOW,
      deleted_at: null,
      fields_updated_at: { text: NOW },
    });
    const quote = wireToBookQuote(wire);
    expect(quote.bookItemId).toBe(BOOK_ID);
    expect(quote.fieldsUpdatedAt.text).toBe(NOW);
  });

  it("rejects empty text", () => {
    expect(
      bookQuoteWireSchema.safeParse({
        id: QUOTE_ID,
        book_item_id: BOOK_ID,
        text: "   ",
        page: null,
        created_at: NOW,
        deleted_at: null,
        fields_updated_at: {},
      }).success,
    ).toBe(false);
  });

  it("rejects invalid page", () => {
    expect(
      bookQuoteWireSchema.safeParse({
        id: QUOTE_ID,
        book_item_id: BOOK_ID,
        text: "Ok",
        page: 0,
        created_at: NOW,
        deleted_at: null,
        fields_updated_at: {},
      }).success,
    ).toBe(false);
  });
});
