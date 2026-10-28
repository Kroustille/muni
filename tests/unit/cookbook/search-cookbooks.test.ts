import { describe, expect, it } from "vitest";

import { newCookbook } from "@/domain/cookbook";
import { searchCookbooks, exactTitleMatch } from "@/application/cookbooks/search-cookbooks";

const NOW = "2026-01-01T12:00:00.000Z";

describe("searchCookbooks", () => {
  const catalog = [
    newCookbook({ id: "70000000-0000-4000-8000-000000000001", title: "Grand Livre", createdAt: NOW }),
    newCookbook({
      id: "70000000-0000-4000-8000-000000000002",
      title: "Desserts faciles",
      author: "Marie",
      createdAt: NOW,
    }),
  ];

  it("matches accent-insensitive title substring", () => {
    const matches = searchCookbooks(catalog, "dessert");
    expect(matches.map((row) => row.title)).toEqual(["Desserts faciles"]);
  });

  it("caps at 20 results", () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      newCookbook({
        id: `70000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        title: `Livre ${index}`,
        createdAt: NOW,
      }),
    );
    expect(searchCookbooks(many, "livre").length).toBe(20);
  });

  it("detects exact title for create row", () => {
    expect(exactTitleMatch(catalog, "Grand Livre")).toBeDefined();
    expect(exactTitleMatch(catalog, "grand livre")).toBeDefined();
    expect(exactTitleMatch(catalog, "New")).toBeUndefined();
  });
});
