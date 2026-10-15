import { describe, expect, it } from "vitest";

import { matchesTitle, normalizeText } from "@/domain/text";

describe("normalizeText", () => {
  it("lowercases", () => {
    expect(normalizeText("HeLLo")).toBe("hello");
  });

  it("strips accents via NFD", () => {
    expect(normalizeText("Éléphant")).toBe("elephant");
    expect(normalizeText("Crème brûlée à la façon")).toBe("creme brulee a la facon");
  });

  it("handles precomposed and decomposed input identically", () => {
    expect(normalizeText("\u00e9")).toBe(normalizeText("e\u0301"));
  });

  it("returns an empty string for empty input", () => {
    expect(normalizeText("")).toBe("");
  });
});

describe("matchesTitle", () => {
  it('matches "elephant" against "Éléphant"', () => {
    expect(matchesTitle("Éléphant", "elephant")).toBe(true);
  });

  it("matches accented query against unaccented title", () => {
    expect(matchesTitle("Elephant", "ÉLÉPH")).toBe(true);
  });

  it("matches substrings anywhere in the title", () => {
    expect(matchesTitle("The Lord of the Rings", "lord")).toBe(true);
    expect(matchesTitle("The Lord of the Rings", "rings")).toBe(true);
    expect(matchesTitle("The Lord of the Rings", "d of t")).toBe(true);
  });

  it("does not match absent text", () => {
    expect(matchesTitle("Éléphant", "giraffe")).toBe(false);
  });

  it("matches every title for an empty query", () => {
    expect(matchesTitle("Anything", "")).toBe(true);
  });
});
