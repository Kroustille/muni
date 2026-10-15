import { itemToWire, itemWireSchema, type ItemWire } from "../../domain/item";
import type { ItemUseCases } from "../items";
import type { ItemRepository } from "../ports/item-repository";
import {
  RemoteStoreError,
  type RemoteStore,
  type RowError,
} from "../ports/remote-store";

const PUSH_ATTEMPTS_PER_RUN = 2;
const INITIAL_BACKOFF_MS = 1_000;

export type QuarantinedRow = { id: string; message: string };

export type SyncRunResult = {
  quarantined: QuarantinedRow[];
};

export type SyncEngineDeps = {
  repository: ItemRepository;
  remote: RemoteStore;
  items: Pick<ItemUseCases, "applyRemote">;
  pullLimit: number;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
};

export type SyncEngine = {
  run(): Promise<SyncRunResult>;
  readonly paused: boolean;
  resume(): void;
};

function wireBody(wire: ItemWire): Omit<ItemWire, "server_updated_at"> {
  const { server_updated_at: _serverUpdatedAt, ...body } = wire;
  return body;
}

function wiresEqualBody(a: ItemWire, b: ItemWire): boolean {
  return JSON.stringify(wireBody(a)) === JSON.stringify(wireBody(b));
}

function rowErrorMessage(errors: RowError[], index: number, id: string): string {
  const match = errors.find((error) => error.index === index || error.id === id);
  if (match?.message) return match.message;
  return errors.map((error) => error.message).join("; ");
}

export function createSyncEngine({
  repository,
  remote,
  items,
  pullLimit,
  sleep,
}: SyncEngineDeps): SyncEngine {
  let paused = false;
  let running = false;

  const engine: SyncEngine = {
    get paused() {
      return paused;
    },

    resume() {
      paused = false;
    },

    async run(): Promise<SyncRunResult> {
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

  async function syncOnce(): Promise<SyncRunResult> {
    const quarantined: QuarantinedRow[] = [];

    const pushedOk = await pushOutbox(quarantined);
    if (!pushedOk) return { quarantined };

    await pullRemote();
    return { quarantined };
  }

  async function pushOutbox(quarantined: QuarantinedRow[]): Promise<boolean> {
    const outboxIds = await repository.outbox();
    if (outboxIds.length === 0) return true;

    const batch: { id: string; wire: ItemWire }[] = [];
    const invalidIds: string[] = [];

    for (const id of outboxIds) {
      const item = await repository.get(id);
      if (item === undefined) {
        invalidIds.push(id);
        quarantined.push({ id, message: "missing local item" });
        continue;
      }
      const wire = itemToWire(item);
      const parsed = itemWireSchema.safeParse(wire);
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

    await items.applyRemote(pushed);

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
    wires: ItemWire[],
    quarantined: QuarantinedRow[],
  ): Promise<ItemWire[] | null> {
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
    let since = (await repository.meta.get("pullCursor")) ?? null;

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

      if (page.items.length > 0) {
        await items.applyRemote(page.items);
      }

      if (page.cursor !== "") {
        await repository.meta.set("pullCursor", page.cursor);
      }
      since = page.cursor === "" ? since : page.cursor;

      if (page.items.length < pullLimit) break;
    }
  }

  return engine;
}
