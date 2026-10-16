import type { BookQuote } from "@/domain/book-quote";

export type Unsubscribe = () => void;

export interface BookQuoteRepository {
  listByBook(bookItemId: string): Promise<BookQuote[]>;
  upsert(quote: BookQuote): Promise<BookQuote>;
  softDelete(id: string): Promise<void>;
  subscribe(bookItemId: string, listener: () => void): Unsubscribe;
}

export interface ServerBookQuoteRepository {
  findByIds(userId: string, ids: string[]): Promise<BookQuote[]>;
  upsert(userId: string, quote: BookQuote): Promise<BookQuote>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<BookQuote[]>;
}
