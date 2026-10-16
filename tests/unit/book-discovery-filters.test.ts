import { describe, expect, it } from "vitest";

import { filterBooksByDiscovery, isValidBookDiscoveryFilter } from "@/application/books/discovery-filters";
import { BOOK_MOODS, BOOK_PACES, newItem, type Item } from "@/domain/item";

const NOW = "2026-01-01T10:00:00.000Z";

function book(overrides: Partial<Item> = {}): Item {
  return newItem({
    id: overrides.id ?? "00000000-0000-4000-8000-000000000001",
    type: "book",
    title: overrides.title ?? "Test",
    createdAt: NOW,
    status: "to_read",
    ...overrides,
  });
}

describe("isValidBookDiscoveryFilter", () => {
  it("accepts known mood and pace", () => {
    expect(isValidBookDiscoveryFilter({ mood: BOOK_MOODS[0], pace: BOOK_PACES[1] })).toBe(true);
  });

  it("rejects invalid mood", () => {
    expect(isValidBookDiscoveryFilter({ mood: "unknown" as never })).toBe(false);
  });
});

describe("filterBooksByDiscovery", () => {
  const library = [
    book({
      id: "00000000-0000-4000-8000-000000000001",
      title: "A",
      mood: BOOK_MOODS[0],
      pace: BOOK_PACES[0],
      tags: ["sf"],
      status: "read",
    }),
    book({
      id: "00000000-0000-4000-8000-000000000002",
      title: "B",
      mood: BOOK_MOODS[1],
      pace: BOOK_PACES[1],
      tags: ["roman"],
      status: "to_read",
    }),
    book({
      id: "00000000-0000-4000-8000-000000000003",
      title: "C",
      tags: ["sf"],
      status: "reading",
    }),
  ];

  it("returns all books when filter is empty", () => {
    expect(filterBooksByDiscovery(library, {})).toHaveLength(3);
  });

  it("filters by mood and pace", () => {
    const result = filterBooksByDiscovery(library, {
      mood: BOOK_MOODS[0],
      pace: BOOK_PACES[0],
    });
    expect(result.map((item) => item.title)).toEqual(["A"]);
  });

  it("filters by status and any selected tag", () => {
    const result = filterBooksByDiscovery(library, {
      status: "reading",
      tags: ["sf", "roman"],
    });
    expect(result.map((item) => item.title)).toEqual(["C"]);
  });

  it("combines dimensions with AND semantics", () => {
    const result = filterBooksByDiscovery(library, {
      mood: BOOK_MOODS[1],
      tags: ["roman"],
      status: "to_read",
    });
    expect(result.map((item) => item.title)).toEqual(["B"]);
  });
});
