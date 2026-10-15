import { describe, expect, it } from "vitest";

import { isValidIsbn, normalizeIsbn } from "@/domain/isbn";

describe("normalizeIsbn", () => {
  it("strips hyphens and spaces", () => {
    expect(normalizeIsbn("978-0-306-40615-7")).toBe("9780306406157");
    expect(normalizeIsbn("0 306 40615 2")).toBe("9780306406157");
  });

  it("converts a valid ISBN-10 to ISBN-13", () => {
    expect(normalizeIsbn("0306406152")).toBe("9780306406157");
  });

  it("returns ISBN-13 unchanged when already normalized", () => {
    expect(normalizeIsbn("9782070368228")).toBe("9782070368228");
  });

  it("accepts ISBN-10 with X check digit", () => {
    expect(normalizeIsbn("043942089X")).toBe("9780439420891");
  });

  it("throws on invalid checksum", () => {
    expect(() => normalizeIsbn("9782070368229")).toThrow(/checksum/i);
    expect(() => normalizeIsbn("0306406153")).toThrow(/checksum/i);
  });

  it("throws on wrong length or non-ISBN characters", () => {
    expect(() => normalizeIsbn("123")).toThrow();
    expect(() => normalizeIsbn("abcdefghij")).toThrow();
    expect(() => normalizeIsbn("")).toThrow();
  });
});

describe("isValidIsbn", () => {
  it("accepts ISBN-10 and ISBN-13 with valid checksum", () => {
    expect(isValidIsbn("9782070368228")).toBe(true);
    expect(isValidIsbn("0306406152")).toBe(true);
    expect(isValidIsbn("978-0-306-40615-7")).toBe(true);
  });

  it("rejects invalid checksum and garbage", () => {
    expect(isValidIsbn("9782070368229")).toBe(false);
    expect(isValidIsbn("not-an-isbn")).toBe(false);
    expect(isValidIsbn("")).toBe(false);
  });
});
