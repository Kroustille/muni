import { describe, expect, it } from "vitest";

import { itemTypeFromPath } from "@/components/quick-add/item-type-from-path";

describe("itemTypeFromPath", () => {
  it("maps typed list routes", () => {
    expect(itemTypeFromPath("/lists/shopping")).toBe("shopping");
    expect(itemTypeFromPath("/lists/books")).toBe("book");
    expect(itemTypeFromPath("/music/tracks")).toBe("music_track");
  });

  it("returns null elsewhere", () => {
    expect(itemTypeFromPath("/")).toBeNull();
    expect(itemTypeFromPath("/search")).toBeNull();
    expect(itemTypeFromPath("/items/abc")).toBeNull();
  });
});
