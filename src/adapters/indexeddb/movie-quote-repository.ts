import type { MovieQuote } from "@/domain/movie-quote";
import type { MovieQuoteRepository, Unsubscribe } from "@/application/ports/movie-quote-repository";
import type { MuniDb } from "./db";

export function createIndexedDbMovieQuoteRepository(db: MuniDb): MovieQuoteRepository {
  const listeners = new Map<string, Set<() => void>>();

  const notify = (movieItemId: string): void => {
    const set = listeners.get(movieItemId);
    if (set === undefined) return;
    for (const listener of [...set]) listener();
  };

  return {
    get: (id) => db.get("movieQuotes", id),

    async listByMovie(movieItemId) {
      const rows = await db.getAllFromIndex("movieQuotes", "movieItemId", movieItemId);
      return rows
        .filter((quote) => quote.deletedAt === null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async upsert(quote, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["movieQuotes", "movieQuoteOutbox"], "readwrite");
      try {
        await tx.objectStore("movieQuotes").put(quote);
        if (enqueue) await tx.objectStore("movieQuoteOutbox").put({ id: quote.id });
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
      notify(quote.movieItemId);
      return quote;
    },

    subscribe(movieItemId, listener) {
      const set = listeners.get(movieItemId) ?? new Set();
      set.add(listener);
      listeners.set(movieItemId, set);
      return () => {
        set.delete(listener);
      };
    },

    async outbox() {
      return (await db.getAllKeys("movieQuoteOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("movieQuoteOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
