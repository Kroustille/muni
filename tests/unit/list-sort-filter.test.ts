import { describe, expect, it } from "vitest";

import { listSortDirectionAriaKey } from "@/components/ListSortFilter";

describe("listSortDirectionAriaKey", () => {
  it("maps asc to toggle-to-desc label key", () => {
    expect(listSortDirectionAriaKey("asc")).toBe("list.sort.toggleToDesc");
  });

  it("maps desc to toggle-to-asc label key", () => {
    expect(listSortDirectionAriaKey("desc")).toBe("list.sort.toggleToAsc");
  });
});
