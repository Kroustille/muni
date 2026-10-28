import { describe, expect, it } from "vitest";

import { itemWireSchema, newItem, updateItem, wireToItem, itemToWire } from "@/domain/item";

const ID = "60000000-0000-4000-8000-000000000001";
const COOKBOOK = "70000000-0000-4000-8000-000000000001";
const NOW = "2026-01-01T12:00:00.000Z";
const HLC = "1767261600000-0-device-a";

function recipe(overrides: Record<string, unknown> = {}) {
  return itemToWire(
    newItem({
      id: ID,
      type: "recipe",
      title: "Crêpes",
      createdAt: NOW,
      ...overrides,
    }),
    NOW,
  );
}

describe("recipe cookbookId / sourcePage", () => {
  it("rejects sourcePage when cookbookId is null", () => {
    expect(() =>
      newItem({
        id: ID,
        type: "recipe",
        title: "Crêpes",
        createdAt: NOW,
        sourcePage: "42",
      }),
    ).toThrow();
    const wire = recipe();
    expect(
      itemWireSchema.safeParse({ ...wire, source_page: "42", cookbook_id: null }).success,
    ).toBe(false);
  });

  it("accepts sourcePage with cookbookId up to 100 chars", () => {
    const page = "p. 42–44";
    expect(
      itemWireSchema.safeParse({
        ...recipe(),
        cookbook_id: COOKBOOK,
        source_page: page,
      }).success,
    ).toBe(true);
    expect(
      itemWireSchema.safeParse({
        ...recipe(),
        cookbook_id: COOKBOOK,
        source_page: "x".repeat(100),
      }).success,
    ).toBe(true);
    expect(
      itemWireSchema.safeParse({
        ...recipe(),
        cookbook_id: COOKBOOK,
        source_page: "x".repeat(101),
      }).success,
    ).toBe(false);
  });

  it("clears sourcePage when cookbookId cleared in domain", () => {
    let item = newItem({
      id: ID,
      type: "recipe",
      title: "T",
      createdAt: NOW,
      cookbookId: COOKBOOK,
      sourcePage: "42",
    });
    item = updateItem(item, { cookbookId: null, sourcePage: null });
    expect(item.cookbookId).toBeNull();
    expect(item.sourcePage).toBeNull();
  });

  it("requires cookbook fields null on non-recipe types", () => {
    const book = itemToWire(
      newItem({ id: ID, type: "book", title: "L", createdAt: NOW, status: "to_read" }),
      NOW,
    );
    expect(
      itemWireSchema.safeParse({
        ...book,
        cookbook_id: COOKBOOK,
      }).success,
    ).toBe(false);
  });

  it("page-only LWW fields are separate scalars", () => {
    const item = wireToItem({
      ...recipe(),
      cookbook_id: COOKBOOK,
      source_page: "10",
      fields_updated_at: {
        cookbook_id: HLC,
        source_page: "1767261600001-0-device-b",
      },
    });
    expect(item.fieldsUpdatedAt.cookbookId).toBe(HLC);
    expect(item.fieldsUpdatedAt.sourcePage).toBe("1767261600001-0-device-b");
  });
});
