import { describe, expect, it } from "vitest";

import {
  ITEM_TYPES,
  defaultStatus,
  itemWireSchema,
  newItem,
  statusesFor,
  itemToWire,
  updateItem,
  wireToItem,
} from "@/domain/item";

const ID = "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a10";
const NOW = "2026-01-01T10:00:00.000Z";
const HLC = "1767261600000-0-device-a";

function wire(overrides: Record<string, unknown> = {}) {
  return {
    id: ID,
    type: "shopping",
    title: "Lait",
    created_at: NOW,
    author: null,
    status: null,
    recommended_by: null,
    rating: null,
    notes: null,
    quantity: null,
    checked: false,
    ingredients: null,
    steps: null,
    deleted_at: null,
    fields_updated_at: { title: HLC },
    isbn: null,
    synopsis: null,
    genres: null,
    publication_year: null,
    publisher: null,
    page_count: null,
    imdb_id: null,
    release_year: null,
    catalog_rating: null,
    media_kind: null,
    server_updated_at: NOW,
    cookbook_id: null,
    source_page: null,
    ...overrides,
  };
}

describe("item types", () => {
  it("lists the four types", () => {
    expect([...ITEM_TYPES]).toEqual([
      "shopping",
      "book",
      "movie",
      "recipe",
      "music_artist",
      "music_track",
    ]);
  });
});

describe("statuses per type", () => {
  it("book statuses", () => {
    expect([...statusesFor("book")]).toEqual(["to_read", "reading", "read", "paused"]);
  });

  it("movie statuses", () => {
    expect([...statusesFor("movie")]).toEqual([
      "to_watch",
      "in_progress",
      "paused",
      "watched",
    ]);
  });

  it("shopping and recipe have no status", () => {
    expect([...statusesFor("shopping")]).toEqual([]);
    expect([...statusesFor("recipe")]).toEqual([]);
  });

  it("default status is the first value, or null when the type has none", () => {
    expect(defaultStatus("book")).toBe("to_read");
    expect(defaultStatus("movie")).toBe("to_watch");
    expect(defaultStatus("shopping")).toBeNull();
    expect(defaultStatus("recipe")).toBeNull();
  });
});

describe("itemWireSchema", () => {
  it("accepts a valid item of each type", () => {
    expect(itemWireSchema.safeParse(wire()).success).toBe(true);
    expect(
      itemWireSchema.safeParse(
        wire({ type: "book", status: "reading", author: "Camus", checked: false }),
      ).success,
    ).toBe(true);
    expect(
      itemWireSchema.safeParse(wire({ type: "movie", status: "watched", rating: 5 })).success,
    ).toBe(true);
    expect(
      itemWireSchema.safeParse(
        wire({
          type: "recipe",
          ingredients: [{ quantity: "200 g", name: "farine" }],
          steps: ["Mélanger", "Cuire"],
        }),
      ).success,
    ).toBe(true);
  });

  it.each(["", "   ", "\t\n"])("rejects empty or whitespace title %j", (title) => {
    expect(itemWireSchema.safeParse(wire({ title })).success).toBe(false);
  });

  it("trims the title", () => {
    const result = itemWireSchema.parse(wire({ title: "  Lait  " }));
    expect(result.title).toBe("Lait");
  });

  it("allows duplicate titles (no uniqueness at schema level)", () => {
    expect(itemWireSchema.safeParse(wire({ title: "Lait" })).success).toBe(true);
  });

  it("rejects an unknown type", () => {
    expect(itemWireSchema.safeParse(wire({ type: "game" })).success).toBe(false);
  });

  it("rejects a status that does not belong to the type", () => {
    expect(itemWireSchema.safeParse(wire({ type: "book", status: "watched" })).success).toBe(false);
    expect(itemWireSchema.safeParse(wire({ type: "movie", status: "reading" })).success).toBe(
      false,
    );
  });

  it.each([0, 6, -1, 2.5])("rejects rating %j", (rating) => {
    expect(itemWireSchema.safeParse(wire({ type: "book", status: "read", rating })).success).toBe(
      false,
    );
  });

  it.each([1, 2, 3, 4, 5])("accepts rating %j", (rating) => {
    expect(itemWireSchema.safeParse(wire({ type: "book", status: "read", rating })).success).toBe(
      true,
    );
  });

  it.each([
    ["shopping", { author: "x" }],
    ["shopping", { status: "to_read" }],
    ["shopping", { rating: 3 }],
    ["shopping", { recommended_by: "Zoé" }],
    ["shopping", { notes: "n" }],
    ["shopping", { ingredients: [] }],
    ["shopping", { steps: [] }],
    ["book", { quantity: "2" }],
    ["book", { ingredients: [] }],
    ["movie", { author: "x" }],
    ["movie", { steps: ["a"] }],
    ["recipe", { author: "x" }],
    ["recipe", { status: "to_read" }],
    ["recipe", { rating: 4 }],
    ["recipe", { recommended_by: "Zoé" }],
    ["recipe", { quantity: "2" }],
  ])("rejects non-null fields of other types: %s %j", (type, extra) => {
    expect(itemWireSchema.safeParse(wire({ type, ...extra })).success).toBe(false);
  });

  it("rejects checked=true outside shopping", () => {
    expect(
      itemWireSchema.safeParse(wire({ type: "book", status: "to_read", checked: true })).success,
    ).toBe(false);
  });

  it("rejects a payload containing user_id", () => {
    expect(itemWireSchema.safeParse(wire({ user_id: ID })).success).toBe(false);
  });

  it("rejects a malformed ingredient or step list", () => {
    expect(
      itemWireSchema.safeParse(wire({ type: "recipe", ingredients: [{ name: "farine" }] })).success,
    ).toBe(false);
    expect(itemWireSchema.safeParse(wire({ type: "recipe", steps: [1] })).success).toBe(false);
  });
});

describe("newItem", () => {
  const base = { id: ID, title: "Dune", createdAt: NOW };

  it("defaults book and movie status to the first value", () => {
    expect(newItem({ ...base, type: "book" }).status).toBe("to_read");
    expect(newItem({ ...base, type: "movie" }).status).toBe("to_watch");
  });

  it("keeps an explicit status", () => {
    expect(newItem({ ...base, type: "book", status: "read" }).status).toBe("read");
  });

  it("defaults checked to false and leaves foreign fields null", () => {
    const item = newItem({ ...base, type: "shopping" });
    expect(item.checked).toBe(false);
    expect(item.status).toBeNull();
    expect(item.author).toBeNull();
    expect(item.ingredients).toBeNull();
  });

  it("trims the title and rejects an empty one", () => {
    expect(newItem({ ...base, type: "shopping", title: "  Pain " }).title).toBe("Pain");
    expect(() => newItem({ ...base, type: "shopping", title: "   " })).toThrow();
  });

  it("rejects fields that do not apply to the type", () => {
    expect(() => newItem({ ...base, type: "shopping", author: "x" })).toThrow();
  });
});

describe("updateItem", () => {
  const item = newItem({ id: ID, type: "book", title: "Dune", createdAt: NOW });

  it("applies valid changes", () => {
    const next = updateItem(item, { status: "reading", rating: 4, author: "Herbert" });
    expect(next).toMatchObject({ status: "reading", rating: 4, author: "Herbert", title: "Dune" });
  });

  it("does not mutate the input", () => {
    updateItem(item, { title: "Other" });
    expect(item.title).toBe("Dune");
  });

  it("rejects changing the type", () => {
    expect(() => updateItem(item, { type: "movie" } as never)).toThrow();
  });

  it("allows passing the same type", () => {
    expect(updateItem(item, { type: "book", notes: "ok" } as never).notes).toBe("ok");
  });

  it("rejects an empty title, a bad status, a bad rating and foreign fields", () => {
    expect(() => updateItem(item, { title: " " })).toThrow();
    expect(() => updateItem(item, { status: "watched" } as never)).toThrow();
    expect(() => updateItem(item, { rating: 6 })).toThrow();
    expect(() => updateItem(item, { quantity: "2" })).toThrow();
  });

  it("never changes id or created_at", () => {
    expect(() => updateItem(item, { id: "x" } as never)).toThrow();
    expect(() => updateItem(item, { createdAt: "2030-01-01T00:00:00.000Z" } as never)).toThrow();
  });
});

describe("fieldsUpdatedAt", () => {
  const base = () => newItem({ id: ID, type: "book", title: "La Peste", createdAt: NOW });

  it("defaults to an empty record", () => {
    expect(base().fieldsUpdatedAt).toEqual({});
  });

  it("updateItem keeps existing stamps and merges the patched ones", () => {
    const stamped = updateItem(base(), { fieldsUpdatedAt: { title: HLC } });
    const next = updateItem(stamped, {
      notes: "ok",
      fieldsUpdatedAt: { notes: "1767261600001-0-device-a" },
    });
    expect(next.fieldsUpdatedAt).toEqual({ title: HLC, notes: "1767261600001-0-device-a" });
    expect(updateItem(stamped, { notes: "ok" }).fieldsUpdatedAt).toEqual({ title: HLC });
  });

  it("rejects non-string stamps", () => {
    expect(() => updateItem(base(), { fieldsUpdatedAt: { title: 1 } } as never)).toThrow();
  });
});

describe("wire mapping", () => {
  it("maps an item to snake_case wire with camelCase stamp keys converted", () => {
    const item = updateItem(
      newItem({ id: ID, type: "book", title: "La Peste", createdAt: NOW, recommendedBy: "Léa" }),
      { deletedAt: NOW, fieldsUpdatedAt: { recommendedBy: HLC, deletedAt: HLC } },
    );
    const w = itemToWire(item, NOW);
    expect(w).toMatchObject({
      created_at: NOW,
      recommended_by: "Léa",
      deleted_at: NOW,
      fields_updated_at: { recommended_by: HLC, deleted_at: HLC },
      server_updated_at: NOW,
    });
    expect(itemWireSchema.safeParse(w).success).toBe(true);
    expect(itemToWire(item).server_updated_at).toBeNull();
  });

  it("round-trips and drops server_updated_at", () => {
    const item = newItem({ id: ID, type: "movie", title: "Alien", createdAt: NOW, rating: 4 });
    expect(wireToItem(itemToWire(item, NOW))).toEqual(item);
    const parsed = wireToItem(
      itemWireSchema.parse(wire({ fields_updated_at: { deleted_at: HLC, title: HLC } })),
    );
    expect(parsed.fieldsUpdatedAt).toEqual({ deletedAt: HLC, title: HLC });
    expect(parsed).not.toHaveProperty("server_updated_at");
  });

  it("rejects an invalid wire row", () => {
    expect(() => wireToItem(wire({ title: "" }) as never)).toThrow();
  });
});
