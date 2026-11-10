import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";

import { openMuniDb } from "@/adapters/indexeddb/db";
import { createIndexedDbMemoriesGrowthStores } from "@/adapters/indexeddb/memories-growth-repositories";
import type {
  MemoriesGrowthPayload,
  MemoriesGrowthPullResult,
  MemoriesGrowthRemoteStore,
} from "@/application/ports/memories-growth-repositories";
import { RemoteStoreError } from "@/application/ports/remote-store";
import { createMemoriesGrowthSyncEngine } from "@/application/sync/memories-growth-sync-engine";
import { souvenirToWire } from "@/domain/souvenir";
import { buildSouvenir } from "../memories-growth/fixtures";

const EMPTY: MemoriesGrowthPayload = {
  souvenirs: [],
  goals: [],
  goalCheckins: [],
  achievements: [],
};
let counter = 0;

async function setup(remote: Partial<MemoriesGrowthRemoteStore>) {
  const db = await openMuniDb(`muni-mg-engine-${Date.now()}-${counter++}`);
  const stores = createIndexedDbMemoriesGrowthStores(db);
  const metaValues = new Map<string, unknown>();
  const meta = {
    get: async (key: string) => metaValues.get(key),
    set: async (key: string, value: unknown) => void metaValues.set(key, value),
  } as never;
  const fullRemote: MemoriesGrowthRemoteStore = {
    push: vi.fn(async (body: MemoriesGrowthPayload) => body),
    pull: vi.fn(async (): Promise<MemoriesGrowthPullResult> => ({
      ...EMPTY,
      cursor: "",
      hasMore: false,
    })),
    ...remote,
  };
  const engine = createMemoriesGrowthSyncEngine({
    meta,
    remote: fullRemote,
    stores,
    pullLimit: 2,
    sleep: async () => undefined,
  });
  return { db, stores, engine, remote: fullRemote, metaValues };
}

describe("memories-growth sync engine", () => {
  it("pushes queued rows and clears the outbox", async () => {
    const { stores, engine, remote } = await setup({});
    const souvenir = buildSouvenir();
    await stores.souvenirs.upsert(souvenir);

    await engine.run();

    expect(remote.push).toHaveBeenCalledWith({ ...EMPTY, souvenirs: [souvenirToWire(souvenir)] });
    expect(await stores.souvenirs.outbox()).toEqual([]);
  });

  it("pulls pages until hasMore is false and stores the cursor", async () => {
    const pages: MemoriesGrowthPullResult[] = [
      { ...EMPTY, souvenirs: [souvenirToWire(buildSouvenir())], cursor: "c1", hasMore: true },
      { ...EMPTY, cursor: "c2", hasMore: false },
    ];
    const pull = vi.fn(async () => pages.shift()!);
    const { stores, engine, metaValues } = await setup({ pull });

    await engine.run();

    expect(pull).toHaveBeenCalledTimes(2);
    expect(pull).toHaveBeenNthCalledWith(2, "c1", 2);
    expect(metaValues.get("memoriesGrowthPullCursor")).toBe("c2");
    expect(await stores.souvenirs.list()).toHaveLength(1);
    expect(await stores.souvenirs.outbox()).toEqual([]);
  });

  it("merges a pulled row with a pending local edit instead of overwriting it", async () => {
    const base = buildSouvenir();
    const remoteRow = souvenirToWire({
      ...base,
      place: "Lyon",
      fieldsUpdatedAt: { title: "1-0-server", place: "5-0-server" },
    });
    // The push is rejected (quarantined), so the local edit stays pending when the pull arrives.
    const { stores, engine } = await setup({
      push: async () => {
        throw new RemoteStoreError("validation", []);
      },
      pull: async () => ({ ...EMPTY, souvenirs: [remoteRow], cursor: "c", hasMore: false }),
    });
    await stores.souvenirs.upsert({
      ...base,
      title: "Mon titre",
      fieldsUpdatedAt: { title: "9-0-local" },
    });

    await engine.run();

    expect(await stores.souvenirs.get(base.id)).toMatchObject({
      title: "Mon titre",
      place: "Lyon",
    });
    expect(await stores.souvenirs.outbox()).toEqual([base.id]);
  });

  it("pauses when the session is gone", async () => {
    const { stores, engine } = await setup({
      push: async () => {
        throw new RemoteStoreError("unauthenticated");
      },
    });
    await stores.souvenirs.upsert(buildSouvenir());
    await engine.run();
    expect(engine.paused).toBe(true);
    engine.resume();
    expect(engine.paused).toBe(false);
  });
});
