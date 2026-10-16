import { formatHlc, parseHlc, receiveHlc, tickHlc, type Hlc } from "@/domain/clock";
import {
  movieQuoteToWire,
  mergeMovieQuote,
  newMovieQuote,
  wireToMovieQuote,
  type MovieQuote,
  type MovieQuoteWire,
} from "@/domain/movie-quote";
import type { IdGenerator } from "../ports/id-generator";
import type { ItemRepository, Unsubscribe } from "../ports/item-repository";
import type { MovieQuoteRepository } from "../ports/movie-quote-repository";

export type MovieQuoteUseCasesDeps = {
  quotes: MovieQuoteRepository;
  items: Pick<ItemRepository, "get" | "meta">;
  idGenerator: IdGenerator;
  now: () => number;
};

export type MovieQuotePatch = {
  text?: string;
  context?: string | null;
};

export type MovieQuoteUseCases = {
  listQuotes(movieItemId: string): Promise<MovieQuote[]>;
  addQuote(
    movieItemId: string,
    input: { text: string; context?: string | null },
  ): Promise<MovieQuote>;
  updateQuote(id: string, patch: MovieQuotePatch): Promise<MovieQuote>;
  deleteQuote(id: string): Promise<void>;
  softDeleteQuotesForMovie(movieItemId: string): Promise<void>;
  applyRemote(rows: MovieQuoteWire[]): Promise<void>;
  subscribe(movieItemId: string, listener: () => void): Unsubscribe;
};

const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export function createMovieQuoteUseCases({
  quotes,
  items,
  idGenerator,
  now,
}: MovieQuoteUseCasesDeps): MovieQuoteUseCases {
  let queue: Promise<unknown> = Promise.resolve();
  const serialized = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  };

  async function deviceId(): Promise<string> {
    const existing = await items.meta.get("deviceId");
    if (existing !== undefined) return existing;
    const created = idGenerator.newId();
    await items.meta.set("deviceId", created);
    return created;
  }

  async function loadClock(): Promise<Hlc | null> {
    const state = await items.meta.get("hlcState");
    return state === undefined ? null : parseHlc(state);
  }

  async function nextStamp(): Promise<string> {
    const next = tickHlc(await loadClock(), await deviceId(), now());
    const stamp = formatHlc(next);
    await items.meta.set("hlcState", stamp);
    return stamp;
  }

  async function requireMovie(movieItemId: string): Promise<void> {
    const item = await items.get(movieItemId);
    if (item === undefined || item.type !== "movie" || item.deletedAt !== null) {
      throw new Error(`Unknown or invalid movie: ${movieItemId}`);
    }
  }

  async function requireQuote(id: string): Promise<MovieQuote> {
    const quote = await quotes.get(id);
    if (quote === undefined || quote.deletedAt !== null) {
      throw new Error(`Unknown quote: ${id}`);
    }
    return quote;
  }

  async function patchQuote(id: string, patch: MovieQuotePatch): Promise<MovieQuote> {
    const current = await requireQuote(id);
    const fields = { ...patch };
    const changed = Object.entries(fields).filter(
      ([key, value]) => value !== undefined && !sameValue(value, current[key as keyof MovieQuote]),
    );
    if (changed.length === 0) return current;
    const stamp = await nextStamp();
    const updated: MovieQuote = {
      ...current,
      ...Object.fromEntries(changed),
      fieldsUpdatedAt: {
        ...current.fieldsUpdatedAt,
        ...Object.fromEntries(changed.map(([key]) => [key, stamp])),
      },
    };
    return quotes.upsert(updated, { enqueue: true });
  }

  return {
    listQuotes: (movieItemId) => quotes.listByMovie(movieItemId),

    addQuote: (movieItemId, input) =>
      serialized(async () => {
        await requireMovie(movieItemId);
        const stamp = await nextStamp();
        const createdAt = new Date(now()).toISOString();
        const quote = newMovieQuote({
          id: idGenerator.newId(),
          movieItemId,
          text: input.text,
          context: input.context ?? null,
          createdAt,
        });
        const stamped: MovieQuote = {
          ...quote,
          fieldsUpdatedAt: { text: stamp, ...(input.context != null ? { context: stamp } : {}) },
        };
        return quotes.upsert(stamped, { enqueue: true });
      }),

    updateQuote: (id, patch) => serialized(() => patchQuote(id, patch)),

    deleteQuote: (id) =>
      serialized(async () => {
        const current = await requireQuote(id);
        const stamp = await nextStamp();
        const deleted: MovieQuote = {
          ...current,
          deletedAt: new Date(now()).toISOString(),
          fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
        };
        await quotes.upsert(deleted, { enqueue: true });
      }),

    softDeleteQuotesForMovie: (movieItemId) =>
      serialized(async () => {
        const active = await quotes.listByMovie(movieItemId);
        const stamp = await nextStamp();
        const deletedAt = new Date(now()).toISOString();
        for (const quote of active) {
          await quotes.upsert(
            {
              ...quote,
              deletedAt,
              fieldsUpdatedAt: { ...quote.fieldsUpdatedAt, deletedAt: stamp },
            },
            { enqueue: true },
          );
        }
      }),

    applyRemote: (rows) =>
      serialized(async () => {
        const id = await deviceId();
        let clock = await loadClock();
        for (const remote of rows) {
          const local = await quotes.get(remote.id);
          const merged =
            local === undefined
              ? remote
              : mergeMovieQuote(movieQuoteToWire(local), remote);
          for (const stamp of Object.values(remote.fields_updated_at)) {
            clock = receiveHlc(clock, stamp, id, now());
          }
          await quotes.upsert(wireToMovieQuote(merged), { enqueue: false });
        }
        if (clock !== null) await items.meta.set("hlcState", formatHlc(clock));
      }),

    subscribe: (movieItemId, listener) => quotes.subscribe(movieItemId, listener),
  };
}
