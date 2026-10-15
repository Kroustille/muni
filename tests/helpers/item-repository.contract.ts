import { beforeEach, describe, expect, it, vi } from "vitest";

import { newItem, updateItem, type Item, type NewItemInput } from "@/domain/item";
import type { ItemRepository } from "@/application/ports/item-repository";

const CREATED_AT = "2026-01-01T00:00:00.000Z";
const DELETED_AT = "2026-02-01T00:00:00.000Z";

let counter = 0;

export function makeItem(overrides: Partial<NewItemInput> = {}): Item {
  counter += 1;
  const hex = counter.toString(16).padStart(12, "0");
  return newItem({
    id: `00000000-0000-4000-8000-${hex}`,
    type: "book",
    title: `Item ${counter}`,
    createdAt: CREATED_AT,
    ...overrides,
  });
}

const ids = (items: Item[]): string[] => items.map((item) => item.id).sort();

export function runItemRepositoryContract(
  name: string,
  createRepository: () => ItemRepository | Promise<ItemRepository>,
): void {
  describe(`ItemRepository contract: ${name}`, () => {
    let repo: ItemRepository;

    beforeEach(async () => {
      repo = await createRepository();
    });

    describe("get / put", () => {
      it("returns undefined for an unknown id", async () => {
        expect(await repo.get("00000000-0000-4000-8000-ffffffffffff")).toBeUndefined();
      });

      it("returns an item that was put", async () => {
        const item = makeItem({ rating: 4, notes: "good" });
        await repo.put(item, { enqueue: false });
        expect(await repo.get(item.id)).toEqual(item);
      });

      it("round-trips recipe ingredients and steps", async () => {
        const item = makeItem({
          type: "recipe",
          status: null,
          ingredients: [{ quantity: "2", name: "eggs" }],
          steps: ["Whisk", "Cook"],
        });
        await repo.put(item, { enqueue: false });
        expect(await repo.get(item.id)).toEqual(item);
      });

      it("replaces an existing item with the same id", async () => {
        const item = makeItem();
        await repo.put(item, { enqueue: false });
        const updated = updateItem(item, { title: "Renamed", status: "reading" });
        await repo.put(updated, { enqueue: false });
        expect(await repo.get(item.id)).toEqual(updated);
        expect(await repo.query({ type: "book" })).toHaveLength(1);
      });

      it("returns soft-deleted items from get", async () => {
        const item = updateItem(makeItem(), { deletedAt: DELETED_AT });
        await repo.put(item, { enqueue: false });
        expect(await repo.get(item.id)).toEqual(item);
      });
    });

    describe("query", () => {
      it("returns an empty list when nothing is stored", async () => {
        expect(await repo.query()).toEqual([]);
        expect(await repo.query({ type: "movie" })).toEqual([]);
      });

      it("returns all non-deleted items without a query", async () => {
        const a = makeItem({ type: "book" });
        const b = makeItem({ type: "movie", status: "to_watch" });
        for (const item of [a, b]) await repo.put(item, { enqueue: false });
        expect(ids(await repo.query())).toEqual(ids([a, b]));
      });

      it("filters by type", async () => {
        const book = makeItem({ type: "book" });
        const movie = makeItem({ type: "movie", status: "to_watch" });
        const shopping = makeItem({ type: "shopping", status: null });
        for (const item of [book, movie, shopping]) await repo.put(item, { enqueue: false });
        expect(ids(await repo.query({ type: "movie" }))).toEqual([movie.id]);
        expect(ids(await repo.query({ type: "shopping" }))).toEqual([shopping.id]);
      });

      it("filters by status", async () => {
        const toRead = makeItem({ type: "book", status: "to_read" });
        const reading = makeItem({ type: "book", status: "reading" });
        const read = makeItem({ type: "book", status: "read" });
        for (const item of [toRead, reading, read]) await repo.put(item, { enqueue: false });
        expect(ids(await repo.query({ type: "book", status: "reading" }))).toEqual([reading.id]);
      });

      it("combines type and status filters", async () => {
        const book = makeItem({ type: "book", status: "to_read" });
        const movie = makeItem({ type: "movie", status: "to_watch" });
        for (const item of [book, movie]) await repo.put(item, { enqueue: false });
        expect(await repo.query({ type: "movie", status: "to_read" })).toEqual([]);
        expect(ids(await repo.query({ type: "movie", status: "to_watch" }))).toEqual([movie.id]);
      });

      it("excludes soft-deleted items by default", async () => {
        const live = makeItem();
        const deleted = updateItem(makeItem(), { deletedAt: DELETED_AT });
        for (const item of [live, deleted]) await repo.put(item, { enqueue: false });
        expect(ids(await repo.query())).toEqual([live.id]);
        expect(ids(await repo.query({ type: "book" }))).toEqual([live.id]);
        expect(ids(await repo.query({ includeDeleted: false }))).toEqual([live.id]);
      });

      it("includes soft-deleted items when includeDeleted is true", async () => {
        const live = makeItem();
        const deleted = updateItem(makeItem(), { deletedAt: DELETED_AT });
        for (const item of [live, deleted]) await repo.put(item, { enqueue: false });
        expect(ids(await repo.query({ includeDeleted: true }))).toEqual(ids([live, deleted]));
      });

      it("hides an item once it is soft-deleted and shows it again when restored", async () => {
        const item = makeItem();
        await repo.put(item, { enqueue: false });
        await repo.put(updateItem(item, { deletedAt: DELETED_AT }), { enqueue: false });
        expect(await repo.query()).toEqual([]);
        await repo.put(updateItem(item, { deletedAt: null }), { enqueue: false });
        expect(ids(await repo.query())).toEqual([item.id]);
      });
    });

    describe("outbox", () => {
      it("starts empty", async () => {
        expect(await repo.outbox()).toEqual([]);
      });

      it("enqueues the id when put is called with enqueue true", async () => {
        const item = makeItem();
        await repo.put(item, { enqueue: true });
        expect(await repo.outbox()).toEqual([item.id]);
      });

      it("does not enqueue when put is called with enqueue false", async () => {
        await repo.put(makeItem(), { enqueue: false });
        expect(await repo.outbox()).toEqual([]);
      });

      it("keeps each id once however often it is enqueued", async () => {
        const item = makeItem();
        await repo.put(item, { enqueue: true });
        await repo.put(updateItem(item, { title: "Again" }), { enqueue: true });
        expect(await repo.outbox()).toEqual([item.id]);
      });

      it("does not remove a pending id when the item is later put without enqueue", async () => {
        const item = makeItem();
        await repo.put(item, { enqueue: true });
        await repo.put(updateItem(item, { title: "Remote" }), { enqueue: false });
        expect(await repo.outbox()).toEqual([item.id]);
      });

      it("lists ids of several pending items", async () => {
        const a = makeItem();
        const b = makeItem();
        await repo.put(a, { enqueue: true });
        await repo.put(b, { enqueue: true });
        expect([...(await repo.outbox())].sort()).toEqual([a.id, b.id].sort());
      });

      it("clears only the given ids", async () => {
        const a = makeItem();
        const b = makeItem();
        const c = makeItem();
        for (const item of [a, b, c]) await repo.put(item, { enqueue: true });
        await repo.clearOutbox([a.id, c.id]);
        expect(await repo.outbox()).toEqual([b.id]);
      });

      it("ignores unknown ids and empty lists when clearing", async () => {
        const item = makeItem();
        await repo.put(item, { enqueue: true });
        await repo.clearOutbox([]);
        await repo.clearOutbox(["00000000-0000-4000-8000-ffffffffffff"]);
        expect(await repo.outbox()).toEqual([item.id]);
      });

      it("allows an id to be enqueued again after being cleared", async () => {
        const item = makeItem();
        await repo.put(item, { enqueue: true });
        await repo.clearOutbox([item.id]);
        await repo.put(updateItem(item, { title: "Edited" }), { enqueue: true });
        expect(await repo.outbox()).toEqual([item.id]);
      });

      it("keeps the item itself when its outbox entry is cleared", async () => {
        const item = makeItem();
        await repo.put(item, { enqueue: true });
        await repo.clearOutbox([item.id]);
        expect(await repo.get(item.id)).toEqual(item);
      });

      it("makes the item and its outbox entry visible together after put", async () => {
        const item = makeItem();
        await repo.put(item, { enqueue: true });
        const [stored, pending] = await Promise.all([repo.get(item.id), repo.outbox()]);
        expect(stored).toEqual(item);
        expect(pending).toContain(item.id);
      });

      it("never leaves an outbox entry without its item when put fails", async () => {
        const item = makeItem();
        const circular = { ...item } as Item & { self?: unknown };
        circular.self = () => undefined;
        await repo.put(circular as Item, { enqueue: true }).catch(() => undefined);
        const stored = await repo.get(item.id);
        const pending = await repo.outbox();
        expect(stored !== undefined).toBe(pending.includes(item.id));
      });
    });

    describe("meta", () => {
      it("returns undefined for unset keys", async () => {
        expect(await repo.meta.get("deviceId")).toBeUndefined();
        expect(await repo.meta.get("hlcState")).toBeUndefined();
        expect(await repo.meta.get("userId")).toBeUndefined();
        expect(await repo.meta.get("pullCursor")).toBeUndefined();
      });

      it.each([
        ["deviceId", "device-1"],
        ["hlcState", "2026-01-01T00:00:00.000Z:0003:device-1"],
        ["userId", "user-42"],
        ["pullCursor", "2026-01-01T00:00:00.000Z"],
      ] as const)("reads back %s after writing it", async (key, value) => {
        await repo.meta.set(key, value);
        expect(await repo.meta.get(key)).toBe(value);
      });

      it("overwrites an existing value", async () => {
        await repo.meta.set("pullCursor", "a");
        await repo.meta.set("pullCursor", "b");
        expect(await repo.meta.get("pullCursor")).toBe("b");
      });

      it("keeps keys independent", async () => {
        await repo.meta.set("deviceId", "device-1");
        await repo.meta.set("userId", "user-1");
        expect(await repo.meta.get("deviceId")).toBe("device-1");
        expect(await repo.meta.get("userId")).toBe("user-1");
        expect(await repo.meta.get("pullCursor")).toBeUndefined();
      });

      it("does not touch items or the outbox", async () => {
        await repo.meta.set("deviceId", "device-1");
        expect(await repo.query({ includeDeleted: true })).toEqual([]);
        expect(await repo.outbox()).toEqual([]);
      });
    });

    describe("subscribe", () => {
      it("notifies listeners after a put", async () => {
        const listener = vi.fn();
        repo.subscribe(listener);
        await repo.put(makeItem(), { enqueue: true });
        expect(listener).toHaveBeenCalled();
      });

      it("stops notifying after unsubscribe", async () => {
        const listener = vi.fn();
        const unsubscribe = repo.subscribe(listener);
        unsubscribe();
        await repo.put(makeItem(), { enqueue: false });
        expect(listener).not.toHaveBeenCalled();
      });

      it("notifies every subscribed listener", async () => {
        const first = vi.fn();
        const second = vi.fn();
        repo.subscribe(first);
        repo.subscribe(second);
        await repo.put(makeItem(), { enqueue: false });
        expect(first).toHaveBeenCalled();
        expect(second).toHaveBeenCalled();
      });
    });
  });
}
