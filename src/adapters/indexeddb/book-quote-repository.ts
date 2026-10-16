import type { BookQuote } from "@/domain/book-quote";
import type { BookQuoteRepository, Unsubscribe } from "@/application/ports/book-quote-repository";
import type { MuniDb } from "./db";

export function createIndexedDbBookQuoteRepository(db: MuniDb): BookQuoteRepository {
  const listeners = new Map<string, Set<() => void>>();

  const notify = (bookItemId: string): void => {
    const set = listeners.get(bookItemId);
    if (set === undefined) return;
    for (const listener of [...set]) listener();
  };

  return {
    get: (id) => db.get("bookQuotes", id),

    async listByBook(bookItemId) {
      const rows = await db.getAllFromIndex("bookQuotes", "bookItemId", bookItemId);
      return rows
        .filter((quote) => quote.deletedAt === null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async upsert(quote, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["bookQuotes", "quoteOutbox"], "readwrite");
      try {
        await tx.objectStore("bookQuotes").put(quote);
        if (enqueue) await tx.objectStore("quoteOutbox").put({ id: quote.id });
        await tx.done;
      } catch (error) {
        try {
          tx.abort();
        } catch {
          // transaction already finished or aborted
        }
        await tx.done.catch(() => undefined);
        throw error;
      }
      notify(quote.bookItemId);
      return quote;
    },

    subscribe(bookItemId, listener) {
      const set = listeners.get(bookItemId) ?? new Set();
      set.add(listener);
      listeners.set(bookItemId, set);
      return () => {
        set.delete(listener);
      };
    },

    async outbox() {
      return (await db.getAllKeys("quoteOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("quoteOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
