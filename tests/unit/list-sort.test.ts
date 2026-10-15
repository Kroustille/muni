import { describe, expect, it } from "vitest";

import { compareItemsForList, sortItemsForList } from "@/domain/list-sort";
import { newItem } from "@/domain/item";

function book(
  id: string,
  createdAt: string,
  rating: number | null,
): ReturnType<typeof newItem> {
  return newItem({
    id,
    type: "book",
    title: id,
    createdAt,
    rating,
    status: "read",
  });
}

describe("list sort", () => {
  it("sorts by rating descending then newest", () => {
    const items = [
      book("00000000-0000-4000-8000-000000000001", "2026-01-01T00:00:00.000Z", 3),
      book("00000000-0000-4000-8000-000000000002", "2026-01-02T00:00:00.000Z", 5),
      book("00000000-0000-4000-8000-000000000003", "2026-01-03T00:00:00.000Z", null),
      book("00000000-0000-4000-8000-000000000004", "2026-01-04T00:00:00.000Z", 5),
    ];
    expect(
      sortItemsForList(items, { field: "rating", order: "desc" }).map((row) => row.id),
    ).toEqual([
      "00000000-0000-4000-8000-000000000004",
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000003",
    ]);
  });

  it("sorts by rating ascending with unrated last", () => {
    const items = [
      book("00000000-0000-4000-8000-000000000001", "2026-01-01T00:00:00.000Z", 5),
      book("00000000-0000-4000-8000-000000000002", "2026-01-02T00:00:00.000Z", 2),
      book("00000000-0000-4000-8000-000000000003", "2026-01-03T00:00:00.000Z", null),
    ];
    expect(
      sortItemsForList(items, { field: "rating", order: "asc" }).map((row) => row.rating),
    ).toEqual([2, 5, null]);
  });

  it("sorts by date ascending", () => {
    const a = book("00000000-0000-4000-8000-000000000010", "2026-01-01T00:00:00.000Z", 5);
    const b = book("00000000-0000-4000-8000-000000000011", "2026-02-01T00:00:00.000Z", 1);
    expect(compareItemsForList(a, b, { field: "date", order: "asc" })).toBeLessThan(0);
    expect(compareItemsForList(a, b, { field: "date", order: "desc" })).toBeGreaterThan(0);
  });
});
