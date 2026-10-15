import { describe, expect, it } from "vitest";

import { itemWireSchema, newItem, updateItem, wireToItem } from "@/domain/item";

const ID = "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a11";
const NOW = "2026-01-01T10:00:00.000Z";

function movieWire(overrides: Record<string, unknown> = {}) {
  return {
    id: ID,
    type: "movie",
    title: "Le Fabuleux Destin d'Amélie Poulain",
    created_at: NOW,
    author: null,
    status: "to_watch",
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

describe("movie catalog fields on Item", () => {
  it("accepts full catalog metadata on a movie", () => {
    const parsed = itemWireSchema.parse(
      movieWire({
        imdb_id: "tt0211915",
        synopsis: "Amélie est une serveuse discret.",
        release_year: 2001,
        catalog_rating: 8.3,
        media_kind: "film",
      }),
    );
    expect(parsed.imdb_id).toBe("tt0211915");
    expect(parsed.catalog_rating).toBe(8.3);
    expect(parsed.media_kind).toBe("film");
  });

  it("defaults catalog fields to null on new movies", () => {
    const item = newItem({ id: ID, type: "movie", title: "Alien", createdAt: NOW });
    expect(item).toMatchObject({
      imdbId: null,
      synopsis: null,
      releaseYear: null,
      catalogRating: null,
      mediaKind: null,
    });
  });

  it("updateItem applies catalog patches on movies", () => {
    const item = newItem({ id: ID, type: "movie", title: "Alien", createdAt: NOW });
    const next = updateItem(item, {
      imdbId: "tt0078748",
      synopsis: "In space no one can hear you scream.",
      releaseYear: 1979,
      mediaKind: "film",
    });
    expect(next.imdbId).toBe("tt0078748");
    expect(next.releaseYear).toBe(1979);
  });

  it.each(["tt", "ttabc", "nm123"])("rejects invalid imdb_id %j", (imdb_id) => {
    expect(itemWireSchema.safeParse(movieWire({ imdb_id })).success).toBe(false);
  });

  it.each([999, 2101])("rejects release_year %j", (release_year) => {
    expect(itemWireSchema.safeParse(movieWire({ release_year })).success).toBe(false);
  });

  it.each([-0.1, 10.1])("rejects catalog_rating %j", (catalog_rating) => {
    expect(itemWireSchema.safeParse(movieWire({ catalog_rating })).success).toBe(false);
  });

  it("rejects invalid media_kind", () => {
    expect(itemWireSchema.safeParse(movieWire({ media_kind: "episode" })).success).toBe(false);
  });

  it.each([
    ["shopping", { imdb_id: "tt0211915" }],
    ["book", { imdb_id: "tt0211915" }],
    ["movie", { isbn: "9782070368228" }],
    ["movie", { page_count: 100 }],
    ["recipe", { release_year: 2000 }],
  ])("rejects catalog fields on wrong type %s", (type, extra) => {
    expect(
      itemWireSchema.safeParse(
        movieWire({
          type,
          author: type === "book" ? "Camus" : null,
          status: type === "book" ? "to_read" : type === "movie" ? "to_watch" : null,
          ...extra,
        }),
      ).success,
    ).toBe(false);
  });

  it("round-trips movie catalog fields through wireToItem", () => {
    const item = wireToItem(
      itemWireSchema.parse(
        movieWire({
          synopsis: "Résumé.",
          imdb_id: "tt1375666",
          release_year: 2010,
          catalog_rating: 8.8,
          media_kind: "film",
        }),
      ) as never,
    );
    expect(item.synopsis).toBe("Résumé.");
    expect(item.imdbId).toBe("tt1375666");
  });
});
