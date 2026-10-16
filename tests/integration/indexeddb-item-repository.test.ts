import { describe, expect, it } from "vitest";

import { openMuniDb } from "@/adapters/indexeddb/db";
import { createIndexedDbItemRepository } from "@/adapters/indexeddb/item-repository";
import type { Item } from "@/domain/item";
import { makeItem, runItemRepositoryContract } from "../helpers/item-repository.contract";

let counter = 0;
const freshName = (): string => `muni-test-${(counter += 1)}`;

runItemRepositoryContract("IndexedDbItemRepository", async () =>
  createIndexedDbItemRepository(await openMuniDb(freshName())),
);

describe("IndexedDB schema", () => {
  it("creates the items, outbox and meta stores", async () => {
    const db = await openMuniDb(freshName());
    expect([...db.objectStoreNames].sort()).toEqual([
      "bookQuotes",
      "items",
      "meta",
      "movieQuoteOutbox",
      "movieQuotes",
      "outbox",
      "quoteOutbox",
    ]);
    db.close();
  });

  it("indexes items on type, updatedAt and deletedAt", async () => {
    const db = await openMuniDb(freshName());
    const store = db.transaction("items").store;
    expect([...store.indexNames].sort()).toEqual(["deletedAt", "type", "updatedAt"]);
    db.close();
  });
});

describe("IndexedDB persistence and atomicity", () => {
  it("keeps items, outbox and meta across reopening the database", async () => {
    const name = freshName();
    const first = createIndexedDbItemRepository(await openMuniDb(name));
    const item = makeItem({ title: "Persisted" });
    await first.put(item, { enqueue: true });
    await first.meta.set("deviceId", "device-1");

    const db = await openMuniDb(name);
    const second = createIndexedDbItemRepository(db);
    expect(await second.get(item.id)).toEqual(item);
    expect(await second.outbox()).toEqual([item.id]);
    expect(await second.meta.get("deviceId")).toBe("device-1");
    db.close();
  });

  it("writes the item and its outbox entry in one transaction", async () => {
    const repo = createIndexedDbItemRepository(await openMuniDb(freshName()));
    const bad = { ...makeItem(), title: () => "not cloneable" } as unknown as Item;

    await expect(repo.put(bad, { enqueue: true })).rejects.toThrow();

    expect(await repo.outbox()).toEqual([]);
    expect(await repo.get(bad.id)).toBeUndefined();
  });

  it("leaves an existing item and the outbox untouched when a put fails", async () => {
    const repo = createIndexedDbItemRepository(await openMuniDb(freshName()));
    const item = makeItem();
    await repo.put(item, { enqueue: false });
    const bad = { ...item, title: () => "x" } as unknown as Item;

    await expect(repo.put(bad, { enqueue: true })).rejects.toThrow();

    expect(await repo.get(item.id)).toEqual(item);
    expect(await repo.outbox()).toEqual([]);
  });
});
