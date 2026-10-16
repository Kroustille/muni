import { describe, expect, it } from "vitest";

import { createBookQuoteUseCases } from "@/application/books/book-quotes";
import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";
import { InMemoryBookQuoteRepository } from "../helpers/in-memory-book-quote-repository";
import { makeItem } from "../helpers/item-repository.contract";

const BOOK_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
const NOW_MS = Date.parse("2026-06-01T12:00:00.000Z");

function harness() {
  const items = new InMemoryItemRepository();
  const quotes = new InMemoryBookQuoteRepository();
  let idSeq = 0;
  const useCases = createBookQuoteUseCases({
    quotes,
    items,
    idGenerator: { newId: () => `c0000000-0000-4000-8000-${String(++idSeq).padStart(12, "0")}` },
    now: () => NOW_MS,
  });
  return { items, quotes, useCases };
}

describe("BookQuote use cases", () => {
  it("lists quotes newest first excluding soft-deleted", async () => {
    const { items, quotes, useCases } = harness();
    const book = makeItem({ id: BOOK_ID, type: "book", title: "1984" });
    await items.put(book, { enqueue: false });

    const older = await useCases.addQuote(BOOK_ID, { text: "Première" });
    const newer = await quotes.upsert(
      {
        ...older,
        id: "d0000000-0000-4000-8000-000000000002",
        text: "Deuxième",
        createdAt: "2026-06-02T12:00:00.000Z",
        fieldsUpdatedAt: { text: "2026-06-02T12:00:00.000Z" },
      },
      { enqueue: false },
    );

    const deleted = { ...older, deletedAt: new Date(NOW_MS).toISOString() };
    await quotes.upsert(deleted, { enqueue: false });

    const listed = await useCases.listQuotes(BOOK_ID);
    expect(listed.map((q) => q.id)).toEqual([newer.id]);
  });

  it("adds a quote with optional page", async () => {
    const { items, useCases } = harness();
    await items.put(makeItem({ id: BOOK_ID, type: "book" }), { enqueue: false });

    const quote = await useCases.addQuote(BOOK_ID, { text: "  Citation  ", page: 12 });
    expect(quote.text).toBe("Citation");
    expect(quote.page).toBe(12);
    expect(quote.fieldsUpdatedAt.text).toBeDefined();
  });

  it("rejects quotes for non-book items", async () => {
    const { items, useCases } = harness();
    await items.put(makeItem({ id: BOOK_ID, type: "recipe" }), { enqueue: false });
    await expect(useCases.addQuote(BOOK_ID, { text: "Nope" })).rejects.toThrow(/book/);
  });

  it("updates text and page with new field stamps", async () => {
    const { items, useCases } = harness();
    await items.put(makeItem({ id: BOOK_ID, type: "book" }), { enqueue: false });
    const created = await useCases.addQuote(BOOK_ID, { text: "Avant" });

    const updated = await useCases.updateQuote(created.id, { text: "Après", page: 3 });
    expect(updated.text).toBe("Après");
    expect(updated.page).toBe(3);
    expect(updated.fieldsUpdatedAt.text).not.toBe(created.fieldsUpdatedAt.text);
  });

  it("soft-deletes a quote", async () => {
    const { items, quotes, useCases } = harness();
    await items.put(makeItem({ id: BOOK_ID, type: "book" }), { enqueue: false });
    const created = await useCases.addQuote(BOOK_ID, { text: "À supprimer" });

    await useCases.deleteQuote(created.id);
    expect(await quotes.get(created.id)).toMatchObject({ deletedAt: expect.any(String) });
    expect(await useCases.listQuotes(BOOK_ID)).toEqual([]);
  });

  it("merges remote rows on applyRemote", async () => {
    const { items, useCases } = harness();
    await items.put(makeItem({ id: BOOK_ID, type: "book" }), { enqueue: false });
    const local = await useCases.addQuote(BOOK_ID, { text: "Local" });

    await useCases.applyRemote([
      {
        id: local.id,
        book_item_id: BOOK_ID,
        text: "Remote",
        page: null,
        created_at: local.createdAt,
        deleted_at: null,
        fields_updated_at: { text: "9999999999999-0-remote" },
        server_updated_at: "2026-06-02T00:00:00.000Z",
      },
    ]);

    const after = await useCases.listQuotes(BOOK_ID);
    expect(after[0]?.text).toBe("Remote");
  });
});
