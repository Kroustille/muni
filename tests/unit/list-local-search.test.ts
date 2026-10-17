import { describe, expect, it } from "vitest";

import { filterItemsForListLocalSearch } from "@/domain/list-local-search";
import { newItem } from "@/domain/item";

describe("filterItemsForListLocalSearch", () => {
  const book = newItem({
    id: "00000000-0000-4000-8000-000000000001",
    type: "book",
    title: "Les Misérables",
    createdAt: "2026-01-01T00:00:00.000Z",
    author: "Victor Hugo",
  });
  const movie = newItem({
    id: "00000000-0000-4000-8000-000000000002",
    type: "movie",
    title: "Inception",
    createdAt: "2026-01-01T00:00:00.000Z",
    director: "Christopher Nolan",
  });
  const track = newItem({
    id: "00000000-0000-4000-8000-000000000003",
    type: "music_track",
    title: "Paranoid Android",
    createdAt: "2026-01-01T00:00:00.000Z",
    artist: "Radiohead",
  });
  const artist = newItem({
    id: "00000000-0000-4000-8000-000000000004",
    type: "music_artist",
    title: "Radiohead",
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  const shopping = newItem({
    id: "00000000-0000-4000-8000-000000000005",
    type: "shopping",
    title: "Lait",
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  const recipe = newItem({
    id: "00000000-0000-4000-8000-000000000006",
    type: "recipe",
    title: "Crêpes",
    createdAt: "2026-01-01T00:00:00.000Z",
  });

  const all = [book, movie, track, artist, shopping, recipe];

  it("returns all items when query is empty", () => {
    expect(filterItemsForListLocalSearch(all, "")).toEqual(all);
    expect(filterItemsForListLocalSearch(all, "   ")).toEqual(all);
  });

  it("matches book title and author", () => {
    expect(filterItemsForListLocalSearch(all, "misérables").map((i) => i.id)).toEqual([
      "00000000-0000-4000-8000-000000000001",
    ]);
    expect(filterItemsForListLocalSearch(all, "hugo").map((i) => i.id)).toEqual([
      "00000000-0000-4000-8000-000000000001",
    ]);
  });

  it("matches movie title and director", () => {
    expect(filterItemsForListLocalSearch(all, "inception").map((i) => i.id)).toEqual([
      "00000000-0000-4000-8000-000000000002",
    ]);
    expect(filterItemsForListLocalSearch(all, "nolan").map((i) => i.id)).toEqual([
      "00000000-0000-4000-8000-000000000002",
    ]);
  });

  it("matches music track title and artist", () => {
    expect(filterItemsForListLocalSearch(all, "paranoid").map((i) => i.id)).toEqual([
      "00000000-0000-4000-8000-000000000003",
    ]);
    expect(filterItemsForListLocalSearch(all, "radiohead").map((i) => i.id)).toEqual([
      "00000000-0000-4000-8000-000000000003",
      "00000000-0000-4000-8000-000000000004",
    ]);
  });

  it("matches music artist title only", () => {
    expect(filterItemsForListLocalSearch([artist], "radio").map((i) => i.id)).toEqual([
      "00000000-0000-4000-8000-000000000004",
    ]);
  });

  it("matches shopping and recipe by title", () => {
    expect(filterItemsForListLocalSearch(all, "lait").map((i) => i.id)).toEqual([
      "00000000-0000-4000-8000-000000000005",
    ]);
    expect(filterItemsForListLocalSearch(all, "crêpe").map((i) => i.id)).toEqual([
      "00000000-0000-4000-8000-000000000006",
    ]);
  });

  it("is accent-insensitive", () => {
    expect(filterItemsForListLocalSearch([book], "miserables").map((i) => i.id)).toEqual([
      "00000000-0000-4000-8000-000000000001",
    ]);
  });
});
