import type { BookQuote } from "@/domain/book-quote";

export type Unsubscribe = () => void;

export interface BookQuoteRepository {
  get(id: string): Promise<BookQuote | undefined>;
  listByBook(bookItemId: string): Promise<BookQuote[]>;
  upsert(quote: BookQuote, options?: { enqueue?: boolean }): Promise<BookQuote>;
  subscribe(bookItemId: string, listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerBookQuoteRepository {
  transaction<T>(fn: (repo: ServerBookQuoteRepository) => Promise<T>): Promise<T>;

  /** `(user_id, id)` row locks for the given ids; omits missing rows. */
  findByIds(userId: string, ids: string[]): Promise<BookQuote[]>;

  upsert(userId: string, quote: BookQuote): Promise<BookQuote>;

  /** Ascending by `server_updated_at`, including soft-deleted rows. */
  pullSince(userId: string, since: Date | null, limit: number): Promise<BookQuote[]>;
}
