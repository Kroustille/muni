import { describe, expect, it } from "vitest";

import {
  mergeSouvenir,
  souvenirSchema,
  souvenirToWire,
  validateSouvenir,
  wireToSouvenir,
  type Souvenir,
} from "@/domain/souvenir";
import { buildSouvenir } from "./fixtures";

const TODAY = "2026-11-11";

describe("souvenir domain", () => {
  it("accepts a title-only souvenir dated today", () => {
    expect(
      validateSouvenir(buildSouvenir({ title: "Concert", occurredOn: TODAY }), TODAY),
    ).toBeNull();
  });

  it("rejects blank or overlong titles", () => {
    expect(validateSouvenir(buildSouvenir({ title: "   " }), TODAY)).toMatch(/title/);
    expect(validateSouvenir(buildSouvenir({ title: "x".repeat(201) }), TODAY)).toMatch(/title/);
  });

  it("rejects future dates but allows backdating", () => {
    expect(validateSouvenir(buildSouvenir({ occurredOn: "2026-11-12" }), TODAY)).toMatch(/future/);
    expect(validateSouvenir(buildSouvenir({ occurredOn: "2019-02-28" }), TODAY)).toBeNull();
  });

  it("limits links to 10 and rejects unknown kinds", () => {
    const link = { kind: "item" as const, id: "11111111-2222-4333-8444-555555555555" };
    expect(validateSouvenir(buildSouvenir({ links: Array(11).fill(link) }), TODAY)).toMatch(
      /links/,
    );
    expect(
      souvenirSchema.safeParse(
        buildSouvenir({ links: [{ kind: "shopping", id: link.id } as never] }),
      ).success,
    ).toBe(false);
  });

  it("enforces body and place limits", () => {
    expect(validateSouvenir(buildSouvenir({ body: "x".repeat(10_001) }), TODAY)).not.toBeNull();
    expect(validateSouvenir(buildSouvenir({ place: "x".repeat(201) }), TODAY)).not.toBeNull();
  });

  it("round-trips through the snake_case wire format", () => {
    const souvenir: Souvenir = buildSouvenir({
      favourite: true,
      place: "Paris",
      mood: "joyeux",
      fieldsUpdatedAt: { title: "1-0-a", occurredOn: "1-0-a" },
    });
    const wire = souvenirToWire(souvenir, "2026-11-11T10:00:00.000Z");
    expect(wire).toMatchObject({ occurred_on: souvenir.occurredOn, favourite: true });
    expect(wire.fields_updated_at).toEqual({ title: "1-0-a", occurred_on: "1-0-a" });
    expect(wireToSouvenir(wire)).toEqual(souvenir);
  });

  it("merges per field with latest HLC winning; links as a whole value", () => {
    const base = buildSouvenir({ fieldsUpdatedAt: { title: "1-0-a", links: "1-0-a" } });
    const local = souvenirToWire({
      ...base,
      title: "Local",
      fieldsUpdatedAt: { title: "3-0-a", links: "1-0-a" },
    });
    const remote = souvenirToWire({
      ...base,
      links: [{ kind: "plant", id: "11111111-2222-4333-8444-555555555555" }],
      fieldsUpdatedAt: { title: "2-0-b", links: "4-0-b" },
    });
    const merged = mergeSouvenir(local, remote);
    expect(merged.title).toBe("Local");
    expect(merged.links).toEqual(remote.links);
  });
});
