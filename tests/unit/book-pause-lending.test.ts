import { describe, expect, it } from "vitest";

import {
  loanReturnPatch,
  normalizePagesReadForStatus,
  pagesReadApplicable,
  parsePagesReadInput,
  validateLoanPair,
  validatePagesRead,
} from "@/application/books/book-pause-lending";

describe("book pause and lending rules (FR-B03, FR-B04)", () => {
  it("shows pages read only for reading and paused", () => {
    expect(pagesReadApplicable("reading")).toBe(true);
    expect(pagesReadApplicable("paused")).toBe(true);
    expect(pagesReadApplicable("to_read")).toBe(false);
    expect(pagesReadApplicable("read")).toBe(false);
  });

  it("clears pages read when status leaves reading/paused", () => {
    expect(normalizePagesReadForStatus("read", 40)).toBeNull();
    expect(normalizePagesReadForStatus("reading", 40)).toBe(40);
    expect(normalizePagesReadForStatus("paused", 10)).toBe(10);
  });

  it("validates pages read bounds", () => {
    expect(validatePagesRead("reading", 50, 100)).toBeNull();
    expect(validatePagesRead("reading", 101, 100)).toMatch(/exceed/);
    expect(validatePagesRead("to_read", 5, null)).toMatch(/reading or paused/);
    expect(validatePagesRead("paused", -1, null)).toMatch(/non-negative/);
  });

  it("parses pages read input", () => {
    expect(parsePagesReadInput("")).toBeNull();
    expect(parsePagesReadInput("42")).toBe(42);
    expect(parsePagesReadInput("3.5")).toBeNull();
    expect(parsePagesReadInput("-1")).toBeNull();
  });

  it("validates loan pair", () => {
    expect(validateLoanPair("Marie", null)).toBeNull();
    expect(validateLoanPair("Marie", "2026-03-01")).toBeNull();
    expect(validateLoanPair(null, "2026-03-01")).toMatch(/loanedTo/);
  });

  it("clears loan on return", () => {
    expect(loanReturnPatch()).toEqual({ loanedTo: null, loanedAt: null });
  });
});
