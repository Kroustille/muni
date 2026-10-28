import { afterEach, describe, expect, it, vi } from "vitest";

import { InMemoryItemRepository } from "../../helpers/in-memory-item-repository";
import { RemoteStoreError } from "@/application/ports/remote-store";
import { createQuoteSyncEngine } from "@/application/sync/quote-sync-engine";

type Quote = { id: string; text: string };
type Wire = { id: string; text: string; server_updated_at?: string | null };

describe("quote sync engine", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(options: { remote?: { push: (w: Wire[]) => Promise<Wire[]>; pull: typeof pull } } = {}) {
    const store = new Map<string, Quote>();
    const outbox = new Set<string>();
    const metaRepo = new InMemoryItemRepository();
    const applied: Wire[] = [];
    const remoteStore = new Map<string, Wire>();

    async function pull(since: string | null, limit: number) {
      const quotes = [...remoteStore.values()]
        .filter((row) => since === null || (row.server_updated_at ?? "") > since)
        .slice(0, limit);
      return { quotes, cursor: quotes.at(-1)?.server_updated_at ?? "" };
    }

    const remote = options.remote ?? {
      push: async (wires: Wire[]) => {
        for (const wire of wires) {
          remoteStore.set(wire.id, { ...wire, server_updated_at: new Date().toISOString() });
        }
        return wires.map((w) => remoteStore.get(w.id)!);
      },
      pull,
    };

    const engine = createQuoteSyncEngine<Quote, Wire>({
      repository: {
        get: (id) => Promise.resolve(store.get(id)),
        outbox: () => Promise.resolve([...outbox]),
        clearOutbox: (ids) => {
          for (const id of ids) outbox.delete(id);
          return Promise.resolve();
        },
      },
      meta: metaRepo.meta,
      remote,
      quotes: {
        applyRemote: async (wires) => {
          applied.push(...wires);
        },
      },
      pullLimit: 5,
      sleep: async () => {},
      pullCursorMetaKey: "quotePullCursor",
      toWire: (quote) => ({ id: quote.id, text: quote.text }),
      safeParseWire: (wire) =>
        wire.text.length > 0 ? { success: true, data: wire } : { success: false, message: "empty text" },
    });

    return {
      engine,
      metaRepo,
      outbox,
      enqueue(quote: Quote) {
        store.set(quote.id, quote);
        outbox.add(quote.id);
      },
      applied,
      remoteStore,
    };
  }

  it("pushes valid outbox rows and pulls remote pages", async () => {
    const { engine, enqueue, applied, remoteStore, metaRepo } = setup();
    enqueue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", text: "Hello" });
    remoteStore.set("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      text: "Remote",
      server_updated_at: "2026-01-02T00:00:00.000Z",
    });

    const result = await engine.run();

    expect(result.quarantined).toEqual([]);
    expect(applied.some((w) => w.id === "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")).toBe(true);
    expect(await metaRepo.meta.get("quotePullCursor")).toBeTruthy();
  });

  it("quarantines invalid local rows and clears them from outbox", async () => {
    const { engine, enqueue } = setup();
    enqueue({ id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", text: "" });
    const result = await engine.run();
    expect(result.quarantined[0]?.message).toMatch(/empty text/i);
  });

  it("quarantines missing local rows", async () => {
    const { engine, outbox } = setup();
    outbox.add("99999999-9999-4999-8999-999999999999");
    const result = await engine.run();
    expect(result.quarantined[0]?.message).toMatch(/missing local quote/i);
  });

  it("pauses on unauthenticated errors until resumed", async () => {
    vi.useFakeTimers();
    let deny = true;
    const { engine, enqueue } = setup({
      remote: {
        push: async () => {
          if (deny) throw new RemoteStoreError("unauthenticated");
          return [];
        },
        pull: async () => {
          if (deny) throw new RemoteStoreError("unauthenticated");
          return { quotes: [], cursor: "" };
        },
      },
    });
    enqueue({ id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", text: "Auth" });
    await engine.run();
    expect(engine.paused).toBe(true);
    engine.resume();
    deny = false;
    await engine.run();
    expect(engine.paused).toBe(false);
  });

  it("splits validation failures and retries survivors", async () => {
    const { engine, enqueue } = setup({
      remote: {
        push: async (wires) => {
          if (wires.some((w) => w.text === "bad")) {
            throw new RemoteStoreError("validation", [
              { index: 0, id: wires[0]?.id, message: "invalid quote" },
            ]);
          }
          return wires;
        },
        pull: async () => ({ quotes: [], cursor: "" }),
      },
    });
    enqueue({ id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", text: "bad" });
    enqueue({ id: "ffffffff-ffff-4fff-8fff-ffffffffffff", text: "good" });
    const result = await engine.run();
    expect(result.quarantined.some((q) => q.id === "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee")).toBe(true);
  });
});
