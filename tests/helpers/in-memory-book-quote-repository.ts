import type { BookQuote } from "@/domain/book-quote";
import type { BookQuoteRepository, Unsubscribe } from "@/application/ports/book-quote-repository";

export class InMemoryBookQuoteRepository implements BookQuoteRepository {
  private readonly quotes = new Map<string, BookQuote>();
  private readonly pending = new Set<string>();
  private readonly listeners = new Map<string, Set<() => void>>();

  async get(id: string): Promise<BookQuote | undefined> {
    return this.quotes.get(id);
  }

  async listByBook(bookItemId: string): Promise<BookQuote[]> {
    return [...this.quotes.values()]
      .filter((quote) => quote.bookItemId === bookItemId && quote.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async upsert(quote: BookQuote, options?: { enqueue?: boolean }): Promise<BookQuote> {
    this.quotes.set(quote.id, quote);
    if (options?.enqueue !== false) this.pending.add(quote.id);
    this.notify(bookItemIdOf(quote));
    return quote;
  }

  subscribe(bookItemId: string, listener: () => void): Unsubscribe {
    const set = this.listeners.get(bookItemId) ?? new Set();
    set.add(listener);
    this.listeners.set(bookItemId, set);
    return () => {
      set.delete(listener);
    };
  }

  async outbox(): Promise<string[]> {
    return [...this.pending];
  }

  async clearOutbox(ids: string[]): Promise<void> {
    for (const id of ids) this.pending.delete(id);
  }

  private notify(bookItemId: string): void {
    const set = this.listeners.get(bookItemId);
    if (set === undefined) return;
    for (const listener of [...set]) listener();
  }
}

function bookItemIdOf(quote: BookQuote): string {
  return quote.bookItemId;
}
