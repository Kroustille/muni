import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FR_PATH = join(process.cwd(), "src/i18n/fr.json");

const FORBIDDEN_SUBSTRINGS = ["en retard", "tu n'as rien fait", "chaîne brisée"] as const;
const FORBIDDEN_DAY_COUNT = /\d+\s*jours/u;

describe("suggestions guilt lexicon (SC-003)", () => {
  it("has no forbidden guilt phrases in suggestions.* strings", () => {
    const fr = JSON.parse(readFileSync(FR_PATH, "utf8")) as Record<string, string>;
    const suggestionEntries = Object.entries(fr).filter(([key]) => key.startsWith("suggestions."));

    expect(suggestionEntries.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const [key, value] of suggestionEntries) {
      for (const phrase of FORBIDDEN_SUBSTRINGS) {
        if (value.toLowerCase().includes(phrase)) {
          violations.push(`${key}: contains "${phrase}"`);
        }
      }
      if (FORBIDDEN_DAY_COUNT.test(value)) {
        violations.push(`${key}: matches day-count pattern`);
      }
    }

    expect(violations).toEqual([]);
  });
});
