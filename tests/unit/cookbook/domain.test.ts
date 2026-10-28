import { describe, expect, it } from "vitest";

import {
  cookbookSchema,
  newCookbook,
  upsertCookbookFields,
  wireToCookbook,
  cookbookToWire,
} from "@/domain/cookbook";

const ID = "70000000-0000-4000-8000-000000000001";
const NOW = "2026-01-01T12:00:00.000Z";

describe("Cookbook validation", () => {
  it("accepts title trimmed length 1–500", () => {
    const book = newCookbook({ id: ID, title: "  Grand Livre  ", createdAt: NOW });
    expect(book.title).toBe("Grand Livre");
    expect(
      cookbookSchema.safeParse({
        ...book,
        title: "x".repeat(500),
      }).success,
    ).toBe(true);
    expect(
      cookbookSchema.safeParse({
        ...book,
        title: "",
      }).success,
    ).toBe(false);
    expect(
      cookbookSchema.safeParse({
        ...book,
        title: "x".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("accepts author 1–200 or null", () => {
    const withAuthor = newCookbook({
      id: ID,
      title: "T",
      author: "  Julia  ",
      createdAt: NOW,
    });
    expect(withAuthor.author).toBe("Julia");
    expect(
      cookbookSchema.safeParse({ ...withAuthor, author: "a".repeat(200) }).success,
    ).toBe(true);
    expect(
      cookbookSchema.safeParse({ ...withAuthor, author: "a".repeat(201) }).success,
    ).toBe(false);
    expect(
      cookbookSchema.safeParse({ ...withAuthor, author: null }).success,
    ).toBe(true);
    expect(
      cookbookSchema.safeParse({ ...withAuthor, author: "   " }).success,
    ).toBe(true);
  });

  it("accepts isbn 1–32 or null", () => {
    const base = newCookbook({ id: ID, title: "T", createdAt: NOW });
    expect(
      cookbookSchema.safeParse({ ...base, isbn: "978-2-123456-78-9" }).success,
    ).toBe(true);
    expect(
      cookbookSchema.safeParse({ ...base, isbn: "x".repeat(32) }).success,
    ).toBe(true);
    expect(
      cookbookSchema.safeParse({ ...base, isbn: "x".repeat(33) }).success,
    ).toBe(false);
  });

  it("round-trips wire", () => {
    const book = newCookbook({
      id: ID,
      title: "Desserts",
      author: "Chef",
      isbn: null,
      createdAt: NOW,
    });
    const wire = cookbookToWire(book, NOW);
    const back = wireToCookbook(wire);
    expect(back.title).toBe("Desserts");
    expect(back.author).toBe("Chef");
  });

  it("upsert trims title on update", () => {
    const existing = newCookbook({ id: ID, title: "Old", createdAt: NOW });
    const next = upsertCookbookFields(existing, { title: "  New title  " }, NOW);
    expect(next.title).toBe("New title");
  });
});
