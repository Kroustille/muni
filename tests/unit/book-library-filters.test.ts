import { describe, expect, it } from "vitest";

import { filterBooksByTagOrSeries } from "@/application/books/book-library-filters";
import { newItem, type Item } from "@/domain/item";

const NOW = "2026-01-01T10:00:00.000Z";

function book(overrides: Partial<Item> = {}): Item {
  return newItem({
    id: overrides.id ?? "00000000-0000-4000-8000-000000000001",
    type: "book",
    title: overrides.title ?? "Test",
    createdAt: NOW,
    ...overrides,
  });
}

describe("filterBooksByTagOrSeries", () => {
  const library = [
    book({
      id: "00000000-0000-4000-8000-000000000001",
      title: "A",
      tags: ["classique"],
      seriesName: "Folio",
    }),
    book({
      id: "00000000-0000-4000-8000-000000000002",
      title: "B",
      tags: ["sf"],
      seriesName: "Dune",
    }),
    book({
      id: "00000000-0000-4000-8000-000000000003",
      title: "C",
      tags: ["classique", "sf"],
      seriesName: null,
    }),
  ];

  it("returns all books when no filter is set", () => {
    expect(filterBooksByTagOrSeries(library, {})).toHaveLength(3);
  });

  it("filters by tag", () => {
    const result = filterBooksByTagOrSeries(library, { tag: "classique" });
    expect(result.map((item) => item.title)).toEqual(["A", "C"]);
  });

  it("filters by series name", () => {
    const result = filterBooksByTagOrSeries(library, { seriesName: "Dune" });
    expect(result.map((item) => item.title)).toEqual(["B"]);
  });

  it("combines tag and series with AND semantics", () => {
    const result = filterBooksByTagOrSeries(library, {
      tag: "classique",
      seriesName: "Folio",
    });
    expect(result.map((item) => item.title)).toEqual(["A"]);
  });

  it("ignores non-book items", () => {
    const mixed = [
      ...library,
      newItem({
        id: "00000000-0000-4000-8000-000000000099",
        type: "movie",
        title: "Film",
        createdAt: NOW,
      }),
    ];
    expect(filterBooksByTagOrSeries(mixed, { tag: "classique" })).toHaveLength(2);
  });
});
