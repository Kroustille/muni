import { describe, expect, it } from "vitest";

import { compareItemsForList, sortItemsForList } from "@/domain/list-sort";
import { newItem } from "@/domain/item";

describe("list sort", () => {
  it("sorts by rating descending then newest", () => {
    const items = [
      newItem({
        id: "00000000-0000-4000-8000-000000000001",
        type: "book",
        title: "A",
        createdAt: "2026-01-01T00:00:00.000Z",
        rating: 3,
        status: "read",
      }),
      newItem({
        id: "00000000-0000-4000-8000-000000000002",
        type: "book",
        title: "B",
        createdAt: "2026-01-02T00:00:00.000Z",
        rating: 5,
        status: "read",
      }),
      newItem({
        id: "00000000-0000-4000-8000-000000000003",
        type: "book",
        title: "C",
        createdAt: "2026-01-03T00:00:00.000Z",
        rating: null,
        status: "read",
      }),
      newItem({
        id: "00000000-0000-4000-8000-000000000004",
        type: "book",
        title: "D",
        createdAt: "2026-01-04T00:00:00.000Z",
        rating: 5,
        status: "read",
      }),
    ];
    expect(sortItemsForList(items, "rating").map((row) => row.id)).toEqual([
      "00000000-0000-4000-8000-000000000004",
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000003",
    ]);
  });

  it("newest sort ignores rating", () => {
    const a = newItem({
      id: "00000000-0000-4000-8000-000000000010",
      type: "book",
      title: "Old",
      createdAt: "2026-01-01T00:00:00.000Z",
      rating: 5,
      status: "read",
    });
    const b = newItem({
      id: "00000000-0000-4000-8000-000000000011",
      type: "book",
      title: "New",
      createdAt: "2026-02-01T00:00:00.000Z",
      rating: 1,
      status: "read",
    });
    expect(compareItemsForList(a, b, "newest")).toBeGreaterThan(0);
  });
});
