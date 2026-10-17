import type { ItemRepository, MetaKey } from "../ports/item-repository";
import { RemoteStoreError, type RowError } from "../ports/remote-store";

const PUSH_ATTEMPTS_PER_RUN = 2;
const INITIAL_BACKOFF_MS = 1_000;

export type QuarantinedQuoteRow = { id: string; message: string };

export type QuoteSyncRunResult = {
  quarantined: QuarantinedQuoteRow[];
};

export type QuoteWireBase = {
  id: string;
  server_updated_at?: string | null;
};

export type QuoteSyncRepository<TQuote> = {
  get(id: string): Promise<TQuote | undefined>;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
};

export type QuoteSyncRemote<TWire extends QuoteWireBase> = {
  push(wires: TWire[]): Promise<TWire[]>;
  pull(since: string | null, limit: number): Promise<{ quotes: TWire[]; cursor: string }>;
};

export type QuoteSyncEngineDeps<TQuote, TWire extends QuoteWireBase> = {
  repository: QuoteSyncRepository<TQuote>;
  meta: ItemRepository["meta"];
  remote: QuoteSyncRemote<TWire>;
  quotes: { applyRemote(wires: TWire[]): Promise<void> };
  pullLimit: number;
  sleep: (ms: number) => Promise<void>;
  pullCursorMetaKey: Extract<MetaKey, "quotePullCursor" | "movieQuotePullCursor">;
  toWire: (quote: TQuote) => TWire;
  safeParseWire: (
    wire: TWire,
  ) => { success: true; data: TWire } | { success: false; message: string };
};

export type QuoteSyncEngine = {
  run(): Promise<QuoteSyncRunResult>;
  readonly paused: boolean;
  resume(): void;
};

function wireBody<TWire extends QuoteWireBase>(wire: TWire): Omit<TWire, "server_updated_at"> {
  const { server_updated_at: _serverUpdatedAt, ...body } = wire;
  return body;
}

function wiresEqualBody<TWire extends QuoteWireBase>(a: TWire, b: TWire): boolean {
  return JSON.stringify(wireBody(a)) === JSON.stringify(wireBody(b));
}

function rowErrorMessage(errors: RowError[], index: number, id: string): string {
  const match = errors.find((error) => error.index === index || error.id === id);
  if (match?.message) return match.message;
  return errors.map((error) => error.message).join("; ");
}

export function createQuoteSyncEngine<TQuote, TWire extends QuoteWireBase>({
  repository,
  meta,
  remote,
  quotes,
  pullLimit,
  sleep,
  pullCursorMetaKey,
  toWire,
  safeParseWire,
}: QuoteSyncEngineDeps<TQuote, TWire>): QuoteSyncEngine {
  let paused = false;
  let running = false;

  const engine: QuoteSyncEngine = {
    get paused() {
      return paused;
    },

    resume() {
      paused = false;
    },

    async run(): Promise<QuoteSyncRunResult> {
      if (paused) return { quarantined: [] };
      if (running) return { quarantined: [] };
      running = true;
      try {
        return await syncOnce();
      } finally {
        running = false;
      }
    },
  };

  async function syncOnce(): Promise<QuoteSyncRunResult> {
    const quarantined: QuarantinedQuoteRow[] = [];
    const pushedOk = await pushOutbox(quarantined);
    if (!pushedOk) return { quarantined };
    await pullRemote();
    return { quarantined };
  }

  async function pushOutbox(quarantined: QuarantinedQuoteRow[]): Promise<boolean> {
    const outboxIds = await repository.outbox();
    if (outboxIds.length === 0) return true;

    const batch: { id: string; wire: TWire }[] = [];
    const invalidIds: string[] = [];

    for (const id of outboxIds) {
      const quote = await repository.get(id);
      if (quote === undefined) {
        invalidIds.push(id);
        quarantined.push({ id, message: "missing local quote" });
        continue;
      }
      const wire = toWire(quote);
      const parsed = safeParseWire(wire);
      if (!parsed.success) {
        invalidIds.push(id);
        quarantined.push({ id, message: parsed.message });
        continue;
      }
      batch.push({ id, wire: parsed.data });
    }

    if (invalidIds.length > 0) {
      await repository.clearOutbox(invalidIds);
    }
    if (batch.length === 0) return true;

    const pushed = await pushWithRetry(batch.map((entry) => entry.wire), quarantined);
    if (pushed === null) return false;

    await quotes.applyRemote(pushed);

    const cleared: string[] = [];
    for (const entry of batch) {
      const merged = pushed.find((row) => row.id === entry.id);
      if (merged !== undefined && wiresEqualBody(merged, entry.wire)) {
        cleared.push(entry.id);
      }
    }
    if (cleared.length > 0) await repository.clearOutbox(cleared);

    return true;
  }

  async function pushWithRetry(
    wires: TWire[],
    quarantined: QuarantinedQuoteRow[],
  ): Promise<TWire[] | null> {
    let pending = wires;

    while (pending.length > 0) {
      let lastError: unknown;
      for (let tryIndex = 0; tryIndex < PUSH_ATTEMPTS_PER_RUN; tryIndex++) {
        try {
          return await remote.push(pending);
        } catch (error) {
          lastError = error;
          if (error instanceof RemoteStoreError) {
            if (error.kind === "unauthenticated") {
              paused = true;
              return null;
            }
            if (error.kind === "validation") {
              const rejected = new Set<string>();
              for (const rowError of error.rowErrors) {
                const index = rowError.index ?? -1;
                const id = rowError.id ?? pending[index]?.id;
                if (id === undefined) continue;
                rejected.add(id);
                quarantined.push({
                  id,
                  message: rowErrorMessage(error.rowErrors, index, id),
                });
              }
              const survivors = pending.filter((wire) => !rejected.has(wire.id));
              await repository.clearOutbox([...rejected]);
              pending = survivors;
              if (pending.length === 0) return [];
              break;
            }
          }
          if (tryIndex < PUSH_ATTEMPTS_PER_RUN - 1) {
            await sleep(INITIAL_BACKOFF_MS * 2 ** tryIndex);
          }
        }
      }

      if (pending.length > 0 && lastError !== undefined) {
        if (lastError instanceof RemoteStoreError && lastError.kind === "validation") {
          continue;
        }
        return null;
      }
    }

    return [];
  }

  async function pullRemote(): Promise<void> {
    let since = (await meta.get(pullCursorMetaKey)) ?? null;

    for (;;) {
      let page;
      try {
        page = await remote.pull(since, pullLimit);
      } catch (error) {
        if (error instanceof RemoteStoreError && error.kind === "unauthenticated") {
          paused = true;
          return;
        }
        throw error;
      }

      if (page.quotes.length > 0) {
        await quotes.applyRemote(page.quotes);
      }

      if (page.cursor !== "") {
        await meta.set(pullCursorMetaKey, page.cursor);
      }
      since = page.cursor === "" ? since : page.cursor;

      if (page.quotes.length < pullLimit) break;
    }
  }

  return engine;
}
