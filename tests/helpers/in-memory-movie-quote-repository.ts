import type { MovieQuote } from "@/domain/movie-quote";
import type { MovieQuoteRepository, Unsubscribe } from "@/application/ports/movie-quote-repository";

export class InMemoryMovieQuoteRepository implements MovieQuoteRepository {
  private readonly quotes = new Map<string, MovieQuote>();
  private readonly pending = new Set<string>();
  private readonly listeners = new Map<string, Set<() => void>>();

  async get(id: string): Promise<MovieQuote | undefined> {
    return this.quotes.get(id);
  }

  async listByMovie(movieItemId: string): Promise<MovieQuote[]> {
    return [...this.quotes.values()]
      .filter((quote) => quote.movieItemId === movieItemId && quote.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async upsert(quote: MovieQuote, options?: { enqueue?: boolean }): Promise<MovieQuote> {
    this.quotes.set(quote.id, quote);
    if (options?.enqueue !== false) this.pending.add(quote.id);
    this.notify(movieItemIdOf(quote));
    return quote;
  }

  subscribe(movieItemId: string, listener: () => void): Unsubscribe {
    const set = this.listeners.get(movieItemId) ?? new Set();
    set.add(listener);
    this.listeners.set(movieItemId, set);
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

  private notify(movieItemId: string): void {
    const set = this.listeners.get(movieItemId);
    if (set === undefined) return;
    for (const listener of [...set]) listener();
  }
}

function movieItemIdOf(quote: MovieQuote): string {
  return quote.movieItemId;
}
