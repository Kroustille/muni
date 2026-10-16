import { describe, expect, it } from "vitest";

import { suggestBooks } from "@/application/books/recommendations";
import { newItem, type Item } from "@/domain/item";

const NOW = "2026-01-01T10:00:00.000Z";

function book(overrides: Partial<Item> = {}): Item {
  return newItem({
    id: overrides.id ?? "00000000-0000-4000-8000-000000000001",
    type: "book",
    title: overrides.title ?? "Test",
    createdAt: NOW,
    fieldsUpdatedAt: {},
    ...overrides,
  });
}

describe("suggestBooks", () => {
  const now = new Date("2026-06-01T12:00:00.000Z");

  it("returns only library books with to_read status in the pool", () => {
    const library = [
      book({
        id: "00000000-0000-4000-8000-000000000001",
        title: "Read",
        status: "read",
        tags: ["sf"],
        genres: ["sf"],
        fieldsUpdatedAt: { read: "2026-05-01T00:00:00.000Z" },
      }),
      book({
        id: "00000000-0000-4000-8000-000000000002",
        title: "Next",
        status: "to_read",
        tags: ["sf"],
      }),
      book({
        id: "00000000-0000-4000-8000-000000000003",
        title: "Also",
        status: "to_read",
        genres: ["sf"],
      }),
      book({
        id: "00000000-0000-4000-8000-000000000004",
        title: "Another",
        status: "to_read",
        tags: ["sf"],
      }),
    ];
    const suggestions = suggestBooks(library, { now, random: () => 0 });
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
    expect(suggestions.every((item) => item.status === "to_read")).toBe(true);
    expect(suggestions.some((item) => item.title === "Next")).toBe(true);
  });

  it("hides when fewer than three scored candidates", () => {
    const library = [
      book({
        id: "00000000-0000-4000-8000-000000000001",
        status: "read",
        tags: ["unique"],
        fieldsUpdatedAt: { read: "2026-05-01T00:00:00.000Z" },
      }),
      book({
        id: "00000000-0000-4000-8000-000000000002",
        status: "to_read",
        tags: ["other"],
      }),
    ];
    expect(suggestBooks(library, { now })).toEqual([]);
  });

  it("does not call network (pure function)", () => {
    const library = [
      book({ status: "read", tags: ["a"], fieldsUpdatedAt: { read: "2026-05-01T00:00:00.000Z" } }),
      book({ id: "00000000-0000-4000-8000-000000000002", status: "to_read", tags: ["a"] }),
      book({ id: "00000000-0000-4000-8000-000000000003", status: "to_read", tags: ["a"] }),
      book({ id: "00000000-0000-4000-8000-000000000004", status: "to_read", tags: ["a"] }),
    ];
    expect(suggestBooks(library, { now })).toHaveLength(3);
  });
});
