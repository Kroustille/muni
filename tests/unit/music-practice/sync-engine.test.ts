import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMusicPracticeSyncApply } from "@/application/music-practice-sync";
import { RemoteStoreError } from "@/application/ports/remote-store";
import type { MusicPracticeRemoteStore } from "@/application/ports/music-practice-remote-store";
import { createMusicPracticeSyncEngine } from "@/application/sync/music-practice-sync-engine";
import { InMemoryItemRepository } from "../../helpers/in-memory-item-repository";
import { InMemoryMusicPracticeRemoteStore } from "../../helpers/in-memory-music-practice-remote-store";
import { buildMusicComposition } from "./fixtures";

function memoryRepo<T extends { id: string }>() {
  const store = new Map<string, T>();
  const outbox = new Set<string>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    list: () => Promise.resolve([...store.values()]),
    upsert: (row: T, options?: { enqueue?: boolean }) => {
      store.set(row.id, row);
      if (options?.enqueue !== false) outbox.add(row.id);
      return Promise.resolve(row);
    },
    subscribe: () => () => {},
    outbox: () => Promise.resolve([...outbox]),
    clearOutbox: (ids: string[]) => {
      for (const id of ids) outbox.delete(id);
      return Promise.resolve();
    },
  };
}

describe("music practice sync engine", () => {
  let remote: InMemoryMusicPracticeRemoteStore;
  let metaRepo: InMemoryItemRepository;

  beforeEach(() => {
    remote = new InMemoryMusicPracticeRemoteStore();
    metaRepo = new InMemoryItemRepository();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function engine(options: { sleep?: (ms: number) => Promise<void> } = {}) {
    const compositions = memoryRepo();
    const sync = createMusicPracticeSyncApply({
      compositions: compositions as never,
      djSets: memoryRepo() as never,
      instruments: memoryRepo() as never,
      exercises: memoryRepo() as never,
      plans: memoryRepo() as never,
      logs: memoryRepo() as never,
      learningPieces: memoryRepo() as never,
    });
    return {
      compositions,
      sync,
      engine: createMusicPracticeSyncEngine({
        meta: metaRepo.meta,
        remote,
        sync,
        pullLimit: 50,
        sleep: options.sleep ?? (async () => {}),
      }),
    };
  }

  it("pushes outbox rows, clears outbox, and stores pull cursor", async () => {
    const { compositions, engine: eng } = engine();
    const row = buildMusicComposition({ id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" });
    await compositions.upsert(row, { enqueue: true });
    expect(await compositions.outbox()).toHaveLength(1);

    await eng.run();

    expect(await compositions.outbox()).toEqual([]);
    expect(await metaRepo.meta.get("musicPracticePullCursor")).toBeTruthy();
    expect(remote.snapshot().compositions.some((c) => c.id === row.id)).toBe(true);
  });

  it("retries push after transient errors", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const inner = new InMemoryMusicPracticeRemoteStore();
    const flaky: MusicPracticeRemoteStore = {
      push: async (body) => {
        attempts += 1;
        if (attempts < 2) throw new RemoteStoreError("network");
        return inner.push(body);
      },
      pull: (...args) => inner.pull(...args),
    };
    const compositions = memoryRepo();
    const sync = createMusicPracticeSyncApply({
      compositions: compositions as never,
      djSets: memoryRepo() as never,
      instruments: memoryRepo() as never,
      exercises: memoryRepo() as never,
      plans: memoryRepo() as never,
      logs: memoryRepo() as never,
      learningPieces: memoryRepo() as never,
    });
    const eng = createMusicPracticeSyncEngine({
      meta: metaRepo.meta,
      remote: flaky,
      sync,
      pullLimit: 10,
      sleep: async (ms) => {
        await vi.advanceTimersByTimeAsync(ms);
      },
    });
    await compositions.upsert(buildMusicComposition({ id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" }), {
      enqueue: true,
    });
    await eng.run();
    expect(attempts).toBeGreaterThanOrEqual(2);
    expect(await compositions.outbox()).toEqual([]);
  });

  it("quarantines validation errors without clearing local rows", async () => {
    const compositions = memoryRepo();
    const sync = createMusicPracticeSyncApply({
      compositions: compositions as never,
      djSets: memoryRepo() as never,
      instruments: memoryRepo() as never,
      exercises: memoryRepo() as never,
      plans: memoryRepo() as never,
      logs: memoryRepo() as never,
      learningPieces: memoryRepo() as never,
    });
    const validatingRemote: MusicPracticeRemoteStore = {
      push: async () => {
        throw new RemoteStoreError("validation", [
          { index: 0, id: "bad-id", message: "finishedAt required" },
        ]);
      },
      pull: async () => ({ ...remote.snapshot(), cursor: "c0" }),
    };
    const eng = createMusicPracticeSyncEngine({
      meta: metaRepo.meta,
      remote: validatingRemote,
      sync,
      pullLimit: 10,
      sleep: async () => {},
    });
    const good = buildMusicComposition({ id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" });
    await compositions.upsert(good, { enqueue: true });

    const result = await eng.run();

    expect(result.quarantined).toEqual([
      expect.objectContaining({ id: "bad-id", message: expect.stringMatching(/finishedAt/i) }),
    ]);
    expect(await compositions.outbox()).toEqual([good.id]);
  });

  it("skips work when already running and supports resume after pause flag", async () => {
    const { engine: eng } = engine();
    eng.resume();
    expect(eng.paused).toBe(false);
    const first = eng.run();
    const second = eng.run();
    await Promise.all([first, second]);
  });
});
