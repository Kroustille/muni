import { describe, expect, it } from "vitest";

import type { ItemType } from "@/domain/item";
import fr from "@/i18n/fr.json";

const LIST_TYPES: ItemType[] = [
  "shopping",
  "book",
  "movie",
  "recipe",
  "music_artist",
  "music_track",
];

describe("list empty state copy", () => {
  it("defines French messages for each list type and a shared hint", () => {
    for (const type of LIST_TYPES) {
      const key = `list.empty.${type}` as keyof typeof fr;
      expect(fr[key]?.length).toBeGreaterThan(0);
    }
    expect(fr["list.empty.hint"].length).toBeGreaterThan(0);
  });
});
