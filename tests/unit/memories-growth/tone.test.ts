import { describe, expect, it } from "vitest";

import fr from "@/i18n/fr.json";

/** 009 / 015 FR-025: no guilt, no comparison, no streak loss in memories & progression copy. */
const DENY_LIST = ["retard", "échec", "raté", "perdu", "série perdue", "classement", "classé"];

const keys = Object.keys(fr).filter(
  (key) => key.startsWith("memories.") || key.startsWith("progression."),
);

describe("memories & progression copy tone", () => {
  it("defines memories and progression keys", () => {
    expect(keys.length).toBeGreaterThan(0);
  });

  it.each(keys)("%s avoids guilt and comparison words", (key) => {
    const text = (fr as Record<string, string>)[key]!.toLowerCase();
    for (const word of DENY_LIST) {
      expect(text, `"${key}" contains "${word}"`).not.toContain(word);
    }
  });
});
