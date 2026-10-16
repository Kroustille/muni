import { formatHlc, parseHlc, receiveHlc, tickHlc, type Hlc } from "@/domain/clock";
import {
  bookQuoteToWire,
  mergeBookQuote,
  newBookQuote,
  wireToBookQuote,
  type BookQuote,
  type BookQuoteWire,
} from "@/domain/book-quote";
import type { IdGenerator } from "../ports/id-generator";
import type { ItemRepository, Unsubscribe } from "../ports/item-repository";
import type { BookQuoteRepository } from "../ports/book-quote-repository";

export type BookQuoteUseCasesDeps = {
  quotes: BookQuoteRepository;
  items: Pick<ItemRepository, "get" | "meta">;
  idGenerator: IdGenerator;
  now: () => number;
};

export type BookQuotePatch = {
  text?: string;
  page?: number | null;
};

export type BookQuoteUseCases = {
  listQuotes(bookItemId: string): Promise<BookQuote[]>;
  addQuote(
    bookItemId: string,
    input: { text: string; page?: number | null },
  ): Promise<BookQuote>;
  updateQuote(id: string, patch: BookQuotePatch): Promise<BookQuote>;
  deleteQuote(id: string): Promise<void>;
  softDeleteQuotesForBook(bookItemId: string): Promise<void>;
  applyRemote(rows: BookQuoteWire[]): Promise<void>;
  subscribe(bookItemId: string, listener: () => void): Unsubscribe;
};

const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export function createBookQuoteUseCases({
  quotes,
  items,
  idGenerator,
  now,
}: BookQuoteUseCasesDeps): BookQuoteUseCases {
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

  async function requireBook(bookItemId: string): Promise<void> {
    const item = await items.get(bookItemId);
    if (item === undefined || item.type !== "book" || item.deletedAt !== null) {
      throw new Error(`Unknown or invalid book: ${bookItemId}`);
    }
  }

  async function requireQuote(id: string): Promise<BookQuote> {
    const quote = await quotes.get(id);
    if (quote === undefined || quote.deletedAt !== null) {
      throw new Error(`Unknown quote: ${id}`);
    }
    return quote;
  }

  async function patchQuote(id: string, patch: BookQuotePatch): Promise<BookQuote> {
    const current = await requireQuote(id);
    const fields = { ...patch };
    const changed = Object.entries(fields).filter(
      ([key, value]) => value !== undefined && !sameValue(value, current[key as keyof BookQuote]),
    );
    if (changed.length === 0) return current;
    const stamp = await nextStamp();
    const updated: BookQuote = {
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
    listQuotes: (bookItemId) => quotes.listByBook(bookItemId),

    addQuote: (bookItemId, input) =>
      serialized(async () => {
        await requireBook(bookItemId);
        const stamp = await nextStamp();
        const createdAt = new Date(now()).toISOString();
        const quote = newBookQuote({
          id: idGenerator.newId(),
          bookItemId,
          text: input.text,
          page: input.page ?? null,
          createdAt,
        });
        const stamped: BookQuote = {
          ...quote,
          fieldsUpdatedAt: { text: stamp, ...(input.page != null ? { page: stamp } : {}) },
        };
        return quotes.upsert(stamped, { enqueue: true });
      }),

    updateQuote: (id, patch) => serialized(() => patchQuote(id, patch)),

    deleteQuote: (id) =>
      serialized(async () => {
        const current = await requireQuote(id);
        const stamp = await nextStamp();
        const deleted: BookQuote = {
          ...current,
          deletedAt: new Date(now()).toISOString(),
          fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
        };
        await quotes.upsert(deleted, { enqueue: true });
      }),

    softDeleteQuotesForBook: (bookItemId) =>
      serialized(async () => {
        const active = await quotes.listByBook(bookItemId);
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
              : mergeBookQuote(bookQuoteToWire(local), remote);
          for (const stamp of Object.values(remote.fields_updated_at)) {
            clock = receiveHlc(clock, stamp, id, now());
          }
          await quotes.upsert(wireToBookQuote(merged), { enqueue: false });
        }
        if (clock !== null) await items.meta.set("hlcState", formatHlc(clock));
      }),

    subscribe: (bookItemId, listener) => quotes.subscribe(bookItemId, listener),
  };
}
