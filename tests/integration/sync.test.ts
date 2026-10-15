import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createItemUseCases } from "@/application/items";
import { RemoteStoreError, type RemoteStore } from "@/application/ports/remote-store";
import { createSyncEngine } from "@/application/sync/engine";
import { itemToWire, newItem } from "@/domain/item";

import { makeItem } from "../helpers/item-repository.contract";
import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";
import { InMemoryRemoteStore } from "../helpers/in-memory-remote-store";

const T0 = Date.parse("2026-01-01T10:00:00.000Z");
let nextItemId = 0;

type Device = {
  repository: InMemoryItemRepository;
  useCases: ReturnType<typeof createItemUseCases>;
  engine: ReturnType<typeof createSyncEngine>;
  advance(ms: number): void;
  setNow(ms: number): void;
};

function createDevice(
  remote: RemoteStore,
  deviceId: string,
  options: { pullLimit?: number; sleep?: (ms: number) => Promise<void> } = {},
): Device {
  const repository = new InMemoryItemRepository();
  let clock = T0;
  const useCases = createItemUseCases({
    repository,
    idGenerator: {
      newId: () => `00000000-0000-4000-8000-${String(++nextItemId).padStart(12, "0")}`,
    },
    now: () => clock,
  });
  const engine = createSyncEngine({
    repository,
    remote,
    items: useCases,
    pullLimit: options.pullLimit ?? 100,
    now: () => clock,
    sleep: options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
  });
  void repository.meta.set("deviceId", deviceId);
  return {
    repository,
    useCases,
    engine,
    advance: (ms) => {
      clock += ms;
    },
    setNow: (ms) => {
      clock = ms;
    },
  };
}

async function syncAll(...devices: Device[]): Promise<void> {
  for (const device of devices) {
    await device.engine.run();
  }
}

async function itemSnapshot(device: Device): Promise<string> {
  const rows = await device.repository.query({ includeDeleted: true });
  rows.sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify(rows);
}

describe("sync engine integration", () => {
  let remote: InMemoryRemoteStore;

  beforeEach(() => {
    remote = new InMemoryRemoteStore();
  });

  it("converges two local stores when devices sync in either order", async () => {
    const a = createDevice(remote, "device-a");
    const b = createDevice(remote, "device-b");

    const onA = await a.useCases.createItem("book", "Bel-Ami");
    await syncAll(a);

    const onB = await b.useCases.createItem("book", "1984");
    await syncAll(b, a);

    expect(await itemSnapshot(a)).toBe(await itemSnapshot(b));
    expect(await a.useCases.listItems("book").then((items) => items.map((i) => i.title).sort())).toEqual(
      ["1984", "Bel-Ami"],
    );

    const onlyOnA = await a.useCases.createItem("movie", "Alien");
    a.advance(60_000);
    const onlyOnB = await b.useCases.createItem("recipe", "Crêpes");
    b.advance(60_000);

    await syncAll(b, a);
    const afterBa = await itemSnapshot(a);
    await syncAll(a, b);
    const afterAb = await itemSnapshot(b);
    expect(afterBa).toBe(afterAb);
    expect((await a.useCases.getItem(onlyOnA.id))?.title).toBe("Alien");
    expect((await b.useCases.getItem(onlyOnB.id))?.title).toBe("Crêpes");
  });

  it("resolves edit vs delete so the latest field change wins", async () => {
    const a = createDevice(remote, "device-a");
    const b = createDevice(remote, "device-b");

    const created = await a.useCases.createItem("book", "Dune");
    await syncAll(a, b);

    a.advance(1_000);
    await a.useCases.updateItem(created.id, { rating: 3 });
    b.advance(2_000);
    await b.useCases.deleteItem(created.id);

    await syncAll(a, b);
    await syncAll(b, a);

    const merged = await a.useCases.getItem(created.id);
    expect(merged?.deletedAt).not.toBeNull();
    expect(merged?.rating).toBe(3);
    expect(await a.useCases.listItems("book")).toEqual([]);
    expect(await b.useCases.getItem(created.id)).toEqual(merged);
  });

  it("pushes many offline changes in one run and clears the outbox", async () => {
    const client = createDevice(remote, "device-offline");
    const titles: string[] = [];
    for (let i = 0; i < 20; i++) {
      titles.push(`Offline ${i}`);
      await client.useCases.createItem("shopping", titles[i]!);
    }
    expect(await client.repository.outbox()).toHaveLength(20);

    await client.engine.run();

    expect(await client.repository.outbox()).toEqual([]);
    expect(remote.snapshot()).toHaveLength(20);
    expect(await client.useCases.listItems("shopping")).toHaveLength(20);
  });

  it("keeps the outbox when push fails after retries", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const flaky: RemoteStore = {
      async push(items) {
        attempts += 1;
        if (attempts < 3) throw new RemoteStoreError("network");
        return remote.push(items);
      },
      pull: (...args) => remote.pull(...args),
    };

    const client = createDevice(flaky, "device-retry", {
      sleep: async (ms) => {
        await vi.advanceTimersByTimeAsync(ms);
      },
    });
    const item = await client.useCases.createItem("book", "Retry me");
    expect(await client.repository.outbox()).toEqual([item.id]);

    await client.engine.run();
    expect(await client.repository.outbox()).toEqual([item.id]);
    expect(attempts).toBeGreaterThanOrEqual(1);

    await client.engine.run();
    expect(await client.repository.outbox()).toEqual([]);
    expect((await client.useCases.getItem(item.id))?.title).toBe("Retry me");
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is idempotent when sync runs again with nothing pending", async () => {
    const client = createDevice(remote, "device-idempotent");
    await client.useCases.createItem("book", "Once");
    await client.engine.run();
    const firstRemote = JSON.stringify(remote.snapshot());

    await client.engine.run();

    expect(JSON.stringify(remote.snapshot())).toBe(firstRemote);
    expect(await client.repository.outbox()).toEqual([]);
  });

  it("quarantines validation failures and syncs valid outbox rows", async () => {
    const client = createDevice(remote, "device-quarantine");
    const good = await client.useCases.createItem("book", "Valid");
    const bad = { ...makeItem({ title: "Invalid rating" }), rating: 9 };
    await client.repository.put(bad, { enqueue: true });

    const result = await client.engine.run();

    expect(result.quarantined).toEqual([
      expect.objectContaining({ id: bad.id, message: expect.stringMatching(/rating/i) }),
    ]);
    expect(await client.repository.outbox()).toEqual([]);
    expect((await client.useCases.getItem(good.id))?.title).toBe("Valid");
    expect((await client.useCases.getItem(bad.id))?.rating).toBe(9);
    expect(remote.snapshot().some((row) => row.id === good.id)).toBe(true);
    expect(remote.snapshot().some((row) => row.id === bad.id)).toBe(false);
  });

  it("pauses after unauthenticated errors until resumed", async () => {
    const inner = new InMemoryRemoteStore();
    const push = vi.fn(inner.push.bind(inner));
    const pull = vi.fn(inner.pull.bind(inner));
    let deny = true;
    const gated: RemoteStore = {
      push: async (items) => {
        if (deny) throw new RemoteStoreError("unauthenticated");
        return push(items);
      },
      pull: async (since, limit) => {
        if (deny) throw new RemoteStoreError("unauthenticated");
        return pull(since, limit);
      },
    };

    const client = createDevice(gated, "device-auth");
    await client.useCases.createItem("book", "Needs auth");

    await client.engine.run();
    expect(client.engine.paused).toBe(true);
    expect(push).not.toHaveBeenCalled();
    expect(await client.repository.outbox()).toHaveLength(1);

    client.engine.resume();
    deny = false;
    await client.engine.run();

    expect(client.engine.paused).toBe(false);
    expect(push).toHaveBeenCalled();
    expect(await client.repository.outbox()).toEqual([]);
  });

  it("pulls a large server backlog across multiple pages in one run", async () => {
    const seeded = new InMemoryRemoteStore();
    const rows = Array.from({ length: 23 }, (_, index) =>
      itemToWire(
        newItem({
          id: `bbbbbbbb-bbbb-4bbb-8bbb-${String(index).padStart(12, "0")}`,
          type: "shopping",
          title: `Server ${index}`,
          createdAt: new Date(T0 + index).toISOString(),
        }),
        new Date(Date.UTC(2026, 0, 2, 0, 0, index)).toISOString(),
      ),
    );
    seeded.seed(rows);

    const client = createDevice(seeded, "device-pull", { pullLimit: 5 });
    await client.engine.run();

    expect(await client.useCases.listItems("shopping")).toHaveLength(23);
    const cursor = await client.repository.meta.get("pullCursor");
    expect(cursor).toBe(rows.at(-1)?.server_updated_at);
  });
});
