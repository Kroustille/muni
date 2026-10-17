import { describe, expect, it } from "vitest";

import { assignBooksToSeries } from "@/application/books/assign-series-bulk";
import { newItem } from "@/domain/item";

describe("assignBooksToSeries", () => {
  const books = [
    newItem({
      id: "00000000-0000-4000-8000-000000000011",
      type: "book",
      title: "A",
      createdAt: "2026-01-01T00:00:00.000Z",
    }),
    newItem({
      id: "00000000-0000-4000-8000-000000000012",
      type: "book",
      title: "B",
      createdAt: "2026-01-01T00:00:00.000Z",
    }),
    newItem({
      id: "00000000-0000-4000-8000-000000000013",
      type: "movie",
      title: "X",
      createdAt: "2026-01-01T00:00:00.000Z",
    }),
  ];

  it("patches selected books with series name and position", () => {
    const { patches } = assignBooksToSeries({
      books,
      ids: ["00000000-0000-4000-8000-000000000011", "00000000-0000-4000-8000-000000000012"],
      seriesName: "  Saga  ",
      seriesPosition: 3,
    });
    expect(patches).toEqual([
      { id: "00000000-0000-4000-8000-000000000011", seriesName: "Saga", seriesPosition: 3 },
      { id: "00000000-0000-4000-8000-000000000012", seriesName: "Saga", seriesPosition: 3 },
    ]);
  });

  it("returns empty patches when name or order invalid", () => {
    expect(
      assignBooksToSeries({
        books,
        ids: ["00000000-0000-4000-8000-000000000011"],
        seriesName: "",
        seriesPosition: 1,
      }).patches,
    ).toEqual([]);
    expect(
      assignBooksToSeries({
        books,
        ids: ["00000000-0000-4000-8000-000000000011"],
        seriesName: "S",
        seriesPosition: Number.NaN,
      })
        .patches,
    ).toEqual([]);
  });
});
