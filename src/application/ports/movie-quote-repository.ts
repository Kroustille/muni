import type { MovieQuote } from "@/domain/movie-quote";

export type Unsubscribe = () => void;

export interface MovieQuoteRepository {
  get(id: string): Promise<MovieQuote | undefined>;
  listByMovie(movieItemId: string): Promise<MovieQuote[]>;
  upsert(quote: MovieQuote, options?: { enqueue?: boolean }): Promise<MovieQuote>;
  subscribe(movieItemId: string, listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerMovieQuoteRepository {
  transaction<T>(fn: (repo: ServerMovieQuoteRepository) => Promise<T>): Promise<T>;

  /** `(user_id, id)` row locks for the given ids; omits missing rows. */
  findByIds(userId: string, ids: string[]): Promise<MovieQuote[]>;

  upsert(userId: string, quote: MovieQuote): Promise<MovieQuote>;

  /** Ascending by `server_updated_at`, including soft-deleted rows. */
  pullSince(userId: string, since: Date | null, limit: number): Promise<MovieQuote[]>;
}
