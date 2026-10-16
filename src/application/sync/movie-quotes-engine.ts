import {
  movieQuoteToWire,
  movieQuoteWireSchema,
  type MovieQuoteWire,
} from "@/domain/movie-quote";
import type { MovieQuoteUseCases } from "../movies/movie-quotes";
import type { MovieQuoteRepository } from "../ports/movie-quote-repository";
import type { ItemRepository } from "../ports/item-repository";
import type { MovieQuoteRemoteStore } from "../ports/movie-quote-remote-store";
import { RemoteStoreError, type RowError } from "../ports/remote-store";

const PUSH_ATTEMPTS_PER_RUN = 2;
const INITIAL_BACKOFF_MS = 1_000;

export type QuarantinedQuoteRow = { id: string; message: string };

export type MovieQuotesSyncRunResult = {
  quarantined: QuarantinedQuoteRow[];
};

export type MovieQuotesSyncEngineDeps = {
  repository: MovieQuoteRepository;
  meta: ItemRepository["meta"];
  remote: MovieQuoteRemoteStore;
  quotes: Pick<MovieQuoteUseCases, "applyRemote">;
  pullLimit: number;
  sleep: (ms: number) => Promise<void>;
};

export type MovieQuotesSyncEngine = {
  run(): Promise<MovieQuotesSyncRunResult>;
  readonly paused: boolean;
  resume(): void;
};

function wireBody(wire: MovieQuoteWire): Omit<MovieQuoteWire, "server_updated_at"> {
  const { server_updated_at: _serverUpdatedAt, ...body } = wire;
  return body;
}

function wiresEqualBody(a: MovieQuoteWire, b: MovieQuoteWire): boolean {
  return JSON.stringify(wireBody(a)) === JSON.stringify(wireBody(b));
}

function rowErrorMessage(errors: RowError[], index: number, id: string): string {
  const match = errors.find((error) => error.index === index || error.id === id);
  if (match?.message) return match.message;
  return errors.map((error) => error.message).join("; ");
}

export function createMovieQuotesSyncEngine({
  repository,
  meta,
  remote,
  quotes,
  pullLimit,
  sleep,
}: MovieQuotesSyncEngineDeps): MovieQuotesSyncEngine {
  let paused = false;
  let running = false;

  const engine: MovieQuotesSyncEngine = {
    get paused() {
      return paused;
    },

    resume() {
      paused = false;
    },

    async run(): Promise<MovieQuotesSyncRunResult> {
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

  async function syncOnce(): Promise<MovieQuotesSyncRunResult> {
    const quarantined: QuarantinedQuoteRow[] = [];
    const pushedOk = await pushOutbox(quarantined);
    if (!pushedOk) return { quarantined };
    await pullRemote();
    return { quarantined };
  }

  async function pushOutbox(quarantined: QuarantinedQuoteRow[]): Promise<boolean> {
    const outboxIds = await repository.outbox();
    if (outboxIds.length === 0) return true;

    const batch: { id: string; wire: MovieQuoteWire }[] = [];
    const invalidIds: string[] = [];

    for (const id of outboxIds) {
      const quote = await repository.get(id);
      if (quote === undefined) {
        invalidIds.push(id);
        quarantined.push({ id, message: "missing local quote" });
        continue;
      }
      const wire = movieQuoteToWire(quote);
      const parsed = movieQuoteWireSchema.safeParse(wire);
      if (!parsed.success) {
        invalidIds.push(id);
        quarantined.push({
          id,
          message: parsed.error.issues
            .map((issue) =>
              issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
            )
            .join("; "),
        });
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
    wires: MovieQuoteWire[],
    quarantined: QuarantinedQuoteRow[],
  ): Promise<MovieQuoteWire[] | null> {
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
    let since = (await meta.get("quotePullCursor")) ?? null;

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
        await meta.set("quotePullCursor", page.cursor);
      }
      since = page.cursor === "" ? since : page.cursor;

      if (page.quotes.length < pullLimit) break;
    }
  }

  return engine;
}
