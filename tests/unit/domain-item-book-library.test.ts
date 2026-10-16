import { describe, expect, it } from "vitest";

import { BOOK_MOODS, BOOK_PACES, itemWireSchema, newItem, wireToItem } from "@/domain/item";

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
    imdb_id: null,
    release_year: null,
    catalog_rating: null,
    media_kind: null,
    server_updated_at: NOW,
    ...overrides,
  };
}

describe("book library fields on Item", () => {
  it("accepts paused status", () => {
    const item = wireToItem(itemWireSchema.parse(bookWire({ status: "paused" })) as never);
    expect(item.status).toBe("paused");
  });

  it("accepts library metadata", () => {
    const parsed = itemWireSchema.parse(
      bookWire({
        work_id: "OL45804W",
        tags: ["classique", "philosophie"],
        series_name: "Folio",
        series_position: 2,
        pages_read: 42,
        loaned_to: "Marie",
        loaned_at: "2026-03-01",
        mood: BOOK_MOODS[0],
        pace: BOOK_PACES[0],
      }),
    );
    const item = wireToItem(parsed as never);
    expect(item.workId).toBe("OL45804W");
    expect(item.tags).toEqual(["classique", "philosophie"]);
    expect(item.pagesRead).toBe(42);
    expect(item.loanedTo).toBe("Marie");
    expect(item.mood).toBe(BOOK_MOODS[0]);
  });

  it("treats empty tags array as null", () => {
    const item = wireToItem(itemWireSchema.parse(bookWire({ tags: [] })) as never);
    expect(item.tags).toBeNull();
  });

  it("trims and rejects oversized tags", () => {
    const long = "x".repeat(41);
    expect(itemWireSchema.safeParse(bookWire({ tags: [long] })).success).toBe(false);
    const item = wireToItem(
      itemWireSchema.parse(bookWire({ tags: ["  roman  ", "roman"] })) as never,
    );
    expect(item.tags).toEqual(["roman", "roman"]);
  });

  it.each([0, 120])("accepts pages_read %j", (pages_read) => {
    expect(itemWireSchema.safeParse(bookWire({ pages_read })).success).toBe(true);
  });

  it.each([-1, 1.5])("rejects pages_read %j", (pages_read) => {
    expect(itemWireSchema.safeParse(bookWire({ pages_read })).success).toBe(false);
  });

  it("rejects pages_read above page_count when both set", () => {
    expect(
      itemWireSchema.safeParse(bookWire({ page_count: 100, pages_read: 101 })).success,
    ).toBe(false);
  });

  it("requires loaned_at when loaned_to is set only as optional pair", () => {
    expect(itemWireSchema.safeParse(bookWire({ loaned_to: "Marie", loaned_at: null })).success).toBe(
      true,
    );
    expect(
      itemWireSchema.safeParse(bookWire({ loaned_to: null, loaned_at: "2026-01-01" })).success,
    ).toBe(false);
  });

  it("rejects invalid mood and pace keys", () => {
    expect(itemWireSchema.safeParse(bookWire({ mood: "unknown" })).success).toBe(false);
    expect(itemWireSchema.safeParse(bookWire({ pace: "fast" })).success).toBe(false);
  });

  it("rejects library fields on non-book types", () => {
    expect(
      itemWireSchema.safeParse({
        ...bookWire(),
        type: "movie",
        status: "to_watch",
        tags: ["x"],
      }).success,
    ).toBe(false);
  });

  it("creates a book with paused via newItem", () => {
    const item = newItem({
      id: ID,
      type: "book",
      title: "Test",
      createdAt: NOW,
      status: "paused",
      pagesRead: 0,
    });
    expect(item.status).toBe("paused");
    expect(item.pagesRead).toBe(0);
  });
});
