import { describe, expect, it } from "vitest";

import { createUuidIdGenerator } from "@/adapters/browser/id-generator";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuid IdGenerator", () => {
  it("returns a v4 uuid string", () => {
    const ids = createUuidIdGenerator();
    expect(ids.newId()).toMatch(UUID_V4);
  });

  it("returns unique ids across many calls", () => {
    const ids = createUuidIdGenerator();
    const seen = new Set(Array.from({ length: 1000 }, () => ids.newId()));
    expect(seen.size).toBe(1000);
  });

  it("returns unique ids across generator instances", () => {
    expect(createUuidIdGenerator().newId()).not.toBe(createUuidIdGenerator().newId());
  });
});
