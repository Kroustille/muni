import { createUuidIdGenerator } from "../adapters/browser/id-generator";
import type { MuniDb } from "../adapters/indexeddb/db";
import { createHttpBookQuoteRemoteStore } from "../adapters/http/book-quote-remote-store";
import { createHttpMovieQuoteRemoteStore } from "../adapters/http/movie-quote-remote-store";
import { createIndexedDbBookQuoteRepository } from "../adapters/indexeddb/book-quote-repository";
import { createIndexedDbMovieQuoteRepository } from "../adapters/indexeddb/movie-quote-repository";
import { createBookQuoteUseCases, type BookQuoteUseCases } from "../application/books/book-quotes";
import { createMovieQuoteUseCases, type MovieQuoteUseCases } from "../application/movies/movie-quotes";
import type { ItemRepository } from "../application/ports/item-repository";
import { createBookQuotesSyncEngine } from "../application/sync/book-quotes-engine";
import { createMovieQuotesSyncEngine } from "../application/sync/movie-quotes-engine";
import type { PausableSyncEngine } from "./sync-run";

const QUOTE_MUTATION_KEYS = ["addQuote", "updateQuote", "deleteQuote"] as const;

export type ClientQuoteSyncBundle = {
  bookQuotesEngine: PausableSyncEngine;
  movieQuotesEngine: PausableSyncEngine;
  bookQuoteUseCases: BookQuoteUseCases;
  movieQuoteUseCases: MovieQuoteUseCases;
};

export function wireClientQuoteSync(deps: {
  db: MuniDb;
  items: ItemRepository;
  pullLimit: number;
  onLocalWrite: () => void;
  fetch?: typeof fetch;
  baseUrl?: string;
}): ClientQuoteSyncBundle {
  const fetchFn = deps.fetch ?? globalThis.fetch.bind(globalThis);
  const baseUrl = deps.baseUrl ?? "";
  const quoteRepository = createIndexedDbBookQuoteRepository(deps.db);
  const movieQuoteRepository = createIndexedDbMovieQuoteRepository(deps.db);
  const quoteRemote = createHttpBookQuoteRemoteStore({ fetch: fetchFn, baseUrl });
  const movieQuoteRemote = createHttpMovieQuoteRemoteStore({ fetch: fetchFn, baseUrl });
  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  const idGenerator = createUuidIdGenerator();
  const now = () => Date.now();

  const baseBookQuoteUseCases = createBookQuoteUseCases({
    quotes: quoteRepository,
    items: deps.items,
    idGenerator,
    now,
  });

  const baseMovieQuoteUseCases = createMovieQuoteUseCases({
    quotes: movieQuoteRepository,
    items: deps.items,
    idGenerator,
    now,
  });

  const bookQuotesEngine = createBookQuotesSyncEngine({
    repository: quoteRepository,
    meta: deps.items.meta,
    remote: quoteRemote,
    quotes: baseBookQuoteUseCases,
    pullLimit: deps.pullLimit,
    sleep,
  });

  const movieQuotesEngine = createMovieQuotesSyncEngine({
    repository: movieQuoteRepository,
    meta: deps.items.meta,
    remote: movieQuoteRemote,
    quotes: baseMovieQuoteUseCases,
    pullLimit: deps.pullLimit,
    sleep,
  });

  const wrapQuoteWrites = <T extends BookQuoteUseCases | MovieQuoteUseCases>(useCases: T): T => {
    const wrapped = { ...useCases };
    for (const key of QUOTE_MUTATION_KEYS) {
      const fn = useCases[key];
      (wrapped as Record<string, unknown>)[key] = async (...args: unknown[]) => {
        const result = await (fn as (...a: unknown[]) => Promise<unknown>)(...args);
        deps.onLocalWrite();
        return result;
      };
    }
    return wrapped;
  };

  return {
    bookQuotesEngine,
    movieQuotesEngine,
    bookQuoteUseCases: wrapQuoteWrites(baseBookQuoteUseCases),
    movieQuoteUseCases: wrapQuoteWrites(baseMovieQuoteUseCases),
  };
}
