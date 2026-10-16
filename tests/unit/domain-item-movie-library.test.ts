import { describe, expect, it } from "vitest";

import { MOVIE_MOODS, MOVIE_PACES, itemWireSchema, newItem, wireToItem } from "@/domain/item";

const ID = "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a11";
const NOW = "2026-01-01T10:00:00.000Z";

function movieWire(overrides: Record<string, unknown> = {}) {
  return {
    id: ID,
    type: "movie",
    title: "Inception",
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
    imdb_id: "tt1375666",
    release_year: 2010,
    catalog_rating: 8.8,
    media_kind: "film",
    server_updated_at: NOW,
    ...overrides,
  };
}

describe("movie library fields on Item", () => {
  it("accepts paused status on films", () => {
    const item = wireToItem(
      itemWireSchema.parse(movieWire({ status: "paused", media_kind: "film" })) as never,
    );
    expect(item.status).toBe("paused");
  });

  it("accepts in_progress only for series", () => {
    expect(
      itemWireSchema.safeParse(movieWire({ status: "in_progress", media_kind: "series" })).success,
    ).toBe(true);
    expect(
      itemWireSchema.safeParse(movieWire({ status: "in_progress", media_kind: "film" })).success,
    ).toBe(false);
  });

  it("accepts library metadata", () => {
    const parsed = itemWireSchema.parse(
      movieWire({
        tags: ["sci-fi", "nolan"],
        franchise_id: "f1",
        franchise_name: "DC",
        franchise_order: 2,
        watched_at: "2026-03-01",
        mood: MOVIE_MOODS[0],
        pace: MOVIE_PACES[0],
        media_kind: "series",
        episode_progress: { S1E1: { watchedAt: "2026-01-02" } },
        next_episode_key: "S1E2",
        director: "Nolan",
        cast: ["DiCaprio"],
      }),
    );
    const item = wireToItem(parsed as never);
    expect(item.tags).toEqual(["sci-fi", "nolan"]);
    expect(item.franchiseName).toBe("DC");
    expect(item.watchedAt).toBe("2026-03-01");
    expect(item.mood).toBe(MOVIE_MOODS[0]);
  });

  it("rejects episode progress on films", () => {
    expect(
      itemWireSchema.safeParse(
        movieWire({
          media_kind: "film",
          episode_progress: { S1E1: { watchedAt: "2026-01-01" } },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects franchise fields on books", () => {
    expect(
      itemWireSchema.safeParse({
        ...movieWire(),
        type: "book",
        status: "to_read",
        franchise_name: "x",
      }).success,
    ).toBe(false);
  });

  it("creates movie with paused via newItem", () => {
    const item = newItem({
      id: ID,
      type: "movie",
      title: "Test",
      createdAt: NOW,
      status: "paused",
      mediaKind: "film",
    });
    expect(item.status).toBe("paused");
  });
});
