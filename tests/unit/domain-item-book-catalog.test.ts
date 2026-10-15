import { describe, expect, it } from "vitest";

import { itemWireSchema, newItem, updateItem, wireToItem } from "@/domain/item";

const ID = "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a10";
const NOW = "2026-01-01T10:00:00.000Z";

function bookWire(overrides: Record<string, unknown> = {}) {
  return {
    id: ID,
    type: "book",
    title: "L'Étranger",
    created_at: NOW,
    author: "Camus",
    status: "to_read",
    recommended_by: null,
    rating: null,
    notes: null,
    quantity: null,
    checked: false,
    ingredients: null,
    steps: null,
    deleted_at: null,
    fields_updated_at: {},
    isbn: null,
    synopsis: null,
    genres: null,
    publication_year: null,
    publisher: null,
    page_count: null,
    server_updated_at: NOW,
    ...overrides,
  };
}

describe("book catalog fields on Item", () => {
  it("accepts full catalog metadata on a book", () => {
    const parsed = itemWireSchema.parse(
      bookWire({
        isbn: "9782070368228",
        synopsis: "Un roman.",
        genres: ["Roman", "Classique"],
        publication_year: 1942,
        publisher: "Gallimard",
        page_count: 184,
      }),
    );
    expect(parsed.isbn).toBe("9782070368228");
    expect(parsed.genres).toEqual(["Roman", "Classique"]);
    expect(parsed.page_count).toBe(184);
  });

  it("treats an empty genres array as null", () => {
    const item = wireToItem(itemWireSchema.parse(bookWire({ genres: [] })) as never);
    expect(item.genres).toBeNull();
  });

  it.each([999, 2101, 0])("rejects publication_year %j", (publication_year) => {
    expect(itemWireSchema.safeParse(bookWire({ publication_year })).success).toBe(false);
  });

  it.each([0, -1])("rejects page_count %j", (page_count) => {
    expect(itemWireSchema.safeParse(bookWire({ page_count })).success).toBe(false);
  });

  it("rejects an invalid ISBN on books", () => {
    expect(itemWireSchema.safeParse(bookWire({ isbn: "not-valid" })).success).toBe(false);
    expect(itemWireSchema.safeParse(bookWire({ isbn: "9782070368229" })).success).toBe(false);
  });

  it.each([
    ["shopping", { isbn: "9782070368228" }],
    ["movie", { synopsis: "x" }],
    ["recipe", { genres: ["Roman"] }],
    ["shopping", { publication_year: 2000 }],
    ["movie", { page_count: 100 }],
  ])("rejects catalog fields on non-book type %s", (type, extra) => {
    expect(
      itemWireSchema.safeParse(
        bookWire({ type, author: type === "book" ? "Camus" : null, status: null, ...extra }),
      ).success,
    ).toBe(false);
  });

  it("defaults catalog fields to null on new books", () => {
    const item = newItem({ id: ID, type: "book", title: "Dune", createdAt: NOW });
    expect(item).toMatchObject({
      isbn: null,
      synopsis: null,
      genres: null,
      publicationYear: null,
      publisher: null,
      pageCount: null,
    });
  });

  it("updateItem applies catalog patches on books", () => {
    const item = newItem({ id: ID, type: "book", title: "Dune", createdAt: NOW });
    const next = updateItem(item, {
      isbn: "9780306406157",
      synopsis: "Desert planet.",
      pageCount: 412,
    });
    expect(next.isbn).toBe("9780306406157");
    expect(next.pageCount).toBe(412);
  });
});
