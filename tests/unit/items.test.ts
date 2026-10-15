import { beforeEach, describe, expect, it, vi } from "vitest";

import { createItemUseCases } from "@/application/items";
import { compareHlc, parseHlc } from "@/domain/clock";
import { itemToWire, newItem, type Item } from "@/domain/item";

import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";

const DEVICE = "device-a";
const T0 = Date.parse("2026-01-01T10:00:00.000Z");

function setup() {
  const repository = new InMemoryItemRepository();
  let clock = T0;
  let counter = 0;
  const idGenerator = {
    newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`,
  };
  const useCases = createItemUseCases({ repository, idGenerator, now: () => clock });
  return {
    repository,
    useCases,
    advance: (ms: number) => {
      clock += ms;
    },
    setNow: (ms: number) => {
      clock = ms;
    },
  };
}

let ctx: ReturnType<typeof setup>;

beforeEach(async () => {
  ctx = setup();
  await ctx.repository.meta.set("deviceId", DEVICE);
});

describe("createItem", () => {
  it("generates id and createdAt, applies defaults and stores the item", async () => {
    const item = await ctx.useCases.createItem("book", "La Peste", { author: "Camus" });
    expect(item.id).toBe("00000000-0000-4000-8000-000000000001");
    expect(item.createdAt).toBe("2026-01-01T10:00:00.000Z");
    expect(item).toMatchObject({
      type: "book",
      title: "La Peste",
      author: "Camus",
      status: "to_read",
      deletedAt: null,
    });
    expect(await ctx.useCases.getItem(item.id)).toEqual(item);
  });

  it("rejects an empty title and stores nothing", async () => {
    await expect(ctx.useCases.createItem("shopping", "   ")).rejects.toThrow();
    expect(await ctx.repository.outbox()).toEqual([]);
    expect(await ctx.repository.query({ includeDeleted: true })).toEqual([]);
  });

  it("rejects fields foreign to the type", async () => {
    await expect(
      ctx.useCases.createItem("shopping", "Lait", { author: "x" } as never),
    ).rejects.toThrow();
  });

  it("stamps title and every provided field with an HLC of this device", async () => {
    const item = await ctx.useCases.createItem("book", "La Peste", {
      author: "Camus",
      recommendedBy: "Léa",
    });
    const stamped = Object.keys(item.fieldsUpdatedAt);
    expect(stamped).toEqual(expect.arrayContaining(["title", "author", "recommendedBy"]));
    expect(stamped).not.toContain("deletedAt");
    for (const stamp of Object.values(item.fieldsUpdatedAt)) {
      expect(parseHlc(stamp).deviceId).toBe(DEVICE);
      expect(parseHlc(stamp).wallMs).toBe(T0);
    }
  });

  it("enqueues the item in the outbox and notifies subscribers", async () => {
    const listener = vi.fn();
    ctx.useCases.subscribe(listener);
    const item = await ctx.useCases.createItem("movie", "Alien");
    expect(await ctx.repository.outbox()).toEqual([item.id]);
    expect(listener).toHaveBeenCalled();
  });
});

describe("updateItem", () => {
  it("stamps only the changed fields with a newer HLC", async () => {
    const created = await ctx.useCases.createItem("book", "La Peste", { author: "Camus" });
    ctx.advance(1000);
    const updated = await ctx.useCases.updateItem(created.id, { notes: "Superbe" });
    expect(updated.notes).toBe("Superbe");
    expect(updated.fieldsUpdatedAt.title).toBe(created.fieldsUpdatedAt.title);
    expect(updated.fieldsUpdatedAt.author).toBe(created.fieldsUpdatedAt.author);
    expect(
      compareHlc(updated.fieldsUpdatedAt.notes!, created.fieldsUpdatedAt.title!),
    ).toBeGreaterThan(0);
    expect(await ctx.useCases.getItem(created.id)).toEqual(updated);
  });

  it("ignores fields whose value did not change", async () => {
    const created = await ctx.useCases.createItem("book", "La Peste");
    ctx.advance(1000);
    const updated = await ctx.useCases.updateItem(created.id, { title: "La Peste" });
    expect(updated.fieldsUpdatedAt).toEqual(created.fieldsUpdatedAt);
  });

  it("adds the item to the outbox again after it was cleared", async () => {
    const created = await ctx.useCases.createItem("book", "La Peste");
    await ctx.repository.clearOutbox([created.id]);
    await ctx.useCases.updateItem(created.id, { rating: 5 });
    expect(await ctx.repository.outbox()).toEqual([created.id]);
  });

  it("rejects invalid patches and unknown ids without changing anything", async () => {
    const created = await ctx.useCases.createItem("book", "La Peste");
    await expect(ctx.useCases.updateItem(created.id, { title: "" })).rejects.toThrow();
    await expect(ctx.useCases.updateItem(created.id, { rating: 9 })).rejects.toThrow();
    await expect(ctx.useCases.updateItem("missing", { title: "x" })).rejects.toThrow();
    expect(await ctx.useCases.getItem(created.id)).toEqual(created);
  });
});

describe("deleteItem and restoreItem", () => {
  it("soft-deletes by stamping deletedAt, keeping the row", async () => {
    const created = await ctx.useCases.createItem("movie", "Alien");
    await ctx.repository.clearOutbox([created.id]);
    ctx.advance(1000);
    await ctx.useCases.deleteItem(created.id);
    const stored = await ctx.useCases.getItem(created.id);
    expect(stored?.deletedAt).toBe("2026-01-01T10:00:01.000Z");
    expect(stored?.fieldsUpdatedAt.deletedAt).toBeDefined();
    expect(await ctx.repository.outbox()).toEqual([created.id]);
    expect(await ctx.useCases.listItems("movie")).toEqual([]);
  });

  it("restores by clearing deletedAt with a newer stamp", async () => {
    const created = await ctx.useCases.createItem("movie", "Alien");
    ctx.advance(1000);
    await ctx.useCases.deleteItem(created.id);
    const deleteStamp = (await ctx.useCases.getItem(created.id))!.fieldsUpdatedAt.deletedAt!;
    ctx.advance(1000);
    await ctx.useCases.restoreItem(created.id);
    const stored = (await ctx.useCases.getItem(created.id))!;
    expect(stored.deletedAt).toBeNull();
    expect(compareHlc(stored.fieldsUpdatedAt.deletedAt!, deleteStamp)).toBeGreaterThan(0);
    expect(await ctx.useCases.listItems("movie")).toHaveLength(1);
  });

  it("rejects unknown ids", async () => {
    await expect(ctx.useCases.deleteItem("missing")).rejects.toThrow();
    await expect(ctx.useCases.restoreItem("missing")).rejects.toThrow();
  });
});

describe("listItems", () => {
  it("returns items of the type newest first by createdAt, whatever the insertion order", async () => {
    const mk = (id: string, createdAt: string) =>
      newItem({
        id: `00000000-0000-4000-8000-00000000000${id}`,
        type: "movie",
        title: `m${id}`,
        createdAt,
      });
    await ctx.repository.put(mk("2", "2026-01-02T00:00:00.000Z"), { enqueue: false });
    await ctx.repository.put(mk("3", "2026-01-03T00:00:00.000Z"), { enqueue: false });
    await ctx.repository.put(mk("1", "2026-01-01T00:00:00.000Z"), { enqueue: false });
    expect((await ctx.useCases.listItems("movie")).map((i) => i.title)).toEqual(["m3", "m2", "m1"]);
  });

  it("filters by type and status and excludes deleted items", async () => {
    const a = await ctx.useCases.createItem("book", "A");
    ctx.advance(1000);
    const b = await ctx.useCases.createItem("book", "B", { status: "read" });
    ctx.advance(1000);
    const c = await ctx.useCases.createItem("book", "C");
    await ctx.useCases.createItem("movie", "M");
    await ctx.useCases.deleteItem(c.id);
    expect((await ctx.useCases.listItems("book")).map((i) => i.id)).toEqual([b.id, a.id]);
    expect((await ctx.useCases.listItems("book", { status: "read" })).map((i) => i.id)).toEqual([
      b.id,
    ]);
  });
});

describe("getItem", () => {
  it("returns undefined for an unknown id", async () => {
    expect(await ctx.useCases.getItem("missing")).toBeUndefined();
  });
});

describe("counts and recent", () => {
  it("lists music tracks filtered by listened status", async () => {
    await ctx.useCases.createItem("music_track", "A", { artist: "One", status: "to_listen" });
    const listened = await ctx.useCases.createItem("music_track", "B", {
      artist: "Two",
      status: "listened",
      rating: 4,
    });
    const filtered = await ctx.useCases.listItems("music_track", { status: "listened" });
    expect(filtered.map((item) => item.id)).toEqual([listened.id]);
  });

  it("counts non-deleted items per type, with zero for empty types", async () => {
    await ctx.useCases.createItem("book", "A");
    await ctx.useCases.createItem("book", "B");
    const gone = await ctx.useCases.createItem("movie", "M");
    await ctx.useCases.createItem("shopping", "Lait");
    await ctx.useCases.deleteItem(gone.id);
    expect(await ctx.useCases.counts()).toEqual({
      shopping: 1,
      book: 2,
      movie: 0,
      recipe: 0,
      music_artist: 0,
      music_track: 0,
    });
  });

  it("recent returns the latest created non-deleted items across types, limited", async () => {
    const titles = ["a", "b", "c", "d"];
    const types = ["book", "movie", "shopping", "recipe"] as const;
    const created: Item[] = [];
    for (const [i, title] of titles.entries()) {
      ctx.advance(1000);
      created.push(await ctx.useCases.createItem(types[i]!, title));
    }
    await ctx.useCases.deleteItem(created[3]!.id);
    expect((await ctx.useCases.recent(2)).map((i) => i.title)).toEqual(["c", "b"]);
    expect(await ctx.useCases.recent(10)).toHaveLength(3);
    expect(await ctx.useCases.recent(0)).toEqual([]);
  });
});

describe("recommenders", () => {
  it("returns distinct recommendedBy values matching the prefix, ignoring case and accents", async () => {
    await ctx.useCases.createItem("book", "A", { recommendedBy: "Léa" });
    await ctx.useCases.createItem("movie", "B", { recommendedBy: "Léa" });
    await ctx.useCases.createItem("book", "C", { recommendedBy: "Louis" });
    await ctx.useCases.createItem("book", "D", { recommendedBy: "Marc" });
    await ctx.useCases.createItem("book", "E");
    expect((await ctx.useCases.recommenders("l")).sort()).toEqual(["Louis", "Léa"].sort());
    expect(await ctx.useCases.recommenders("lea")).toEqual(["Léa"]);
    expect((await ctx.useCases.recommenders("")).sort()).toEqual(["Louis", "Léa", "Marc"].sort());
    expect(await ctx.useCases.recommenders("zz")).toEqual([]);
  });
});

describe("subscribe", () => {
  it("notifies on writes and stops after unsubscribe", async () => {
    const listener = vi.fn();
    const unsubscribe = ctx.useCases.subscribe(listener);
    const item = await ctx.useCases.createItem("shopping", "Lait");
    await ctx.useCases.updateItem(item.id, { checked: true });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    await ctx.useCases.deleteItem(item.id);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("applyRemote", () => {
  it("inserts unknown remote rows without enqueuing", async () => {
    const remote = newItem({
      id: "00000000-0000-4000-8000-0000000000aa",
      type: "movie",
      title: "Alien",
      createdAt: "2026-01-01T09:00:00.000Z",
    });
    const wire = itemToWire(
      { ...remote, fieldsUpdatedAt: { title: "1-0-device-b" } },
      "2026-01-01T09:00:01.000Z",
    );
    await ctx.useCases.applyRemote([wire]);
    expect((await ctx.useCases.getItem(remote.id))?.title).toBe("Alien");
    expect(await ctx.repository.outbox()).toEqual([]);
  });

  it("merges per field: newest stamp wins independently for each field", async () => {
    const created = await ctx.useCases.createItem("book", "La Peste", { author: "Camus" });
    await ctx.repository.clearOutbox([created.id]);
    ctx.advance(1000);
    await ctx.useCases.updateItem(created.id, { title: "La Peste (local)" });
    await ctx.repository.clearOutbox([created.id]);
    const local = (await ctx.useCases.getItem(created.id))!;
    const future = `${T0 + 5000}-0-device-b`;
    const remote = itemToWire(
      {
        ...local,
        title: "Old remote title",
        author: "A. Camus",
        fieldsUpdatedAt: { title: `${T0 - 5000}-0-device-b`, author: future },
      },
      "2026-01-01T10:00:05.000Z",
    );
    await ctx.useCases.applyRemote([remote]);
    const merged = (await ctx.useCases.getItem(created.id))!;
    expect(merged.title).toBe("La Peste (local)");
    expect(merged.author).toBe("A. Camus");
    expect(merged.fieldsUpdatedAt.author).toBe(future);
    expect(await ctx.repository.outbox()).toEqual([]);
  });

  it("applies a remote deletion that is newer than the local state", async () => {
    const created = await ctx.useCases.createItem("movie", "Alien");
    await ctx.repository.clearOutbox([created.id]);
    const remote = itemToWire(
      {
        ...created,
        deletedAt: "2026-01-01T11:00:00.000Z",
        fieldsUpdatedAt: { ...created.fieldsUpdatedAt, deletedAt: `${T0 + 3_600_000}-0-device-b` },
      },
      "2026-01-01T11:00:01.000Z",
    );
    await ctx.useCases.applyRemote([remote]);
    expect((await ctx.useCases.getItem(created.id))?.deletedAt).toBe("2026-01-01T11:00:00.000Z");
    expect(await ctx.useCases.listItems("movie")).toEqual([]);
  });

  it("is idempotent and notifies subscribers", async () => {
    const created = await ctx.useCases.createItem("movie", "Alien");
    const wire = itemToWire(created, "2026-01-01T10:00:01.000Z");
    const listener = vi.fn();
    ctx.useCases.subscribe(listener);
    await ctx.useCases.applyRemote([wire]);
    await ctx.useCases.applyRemote([wire]);
    expect(await ctx.useCases.getItem(created.id)).toEqual(created);
    expect(listener).toHaveBeenCalled();
  });

  it("moves the local clock past remote stamps so later edits win", async () => {
    const created = await ctx.useCases.createItem("book", "La Peste");
    const farFuture = `${T0 + 10_000_000}-3-device-b`;
    await ctx.useCases.applyRemote([
      itemToWire(
        { ...created, fieldsUpdatedAt: { ...created.fieldsUpdatedAt, title: farFuture } },
        null,
      ),
    ]);
    const updated = await ctx.useCases.updateItem(created.id, { title: "Local after remote" });
    expect(compareHlc(updated.fieldsUpdatedAt.title!, farFuture)).toBeGreaterThan(0);
  });
});

describe("clock", () => {
  it("never goes backwards across calls, even if the wall clock does", async () => {
    const created = await ctx.useCases.createItem("book", "La Peste");
    ctx.setNow(T0 - 60_000);
    const u1 = await ctx.useCases.updateItem(created.id, { notes: "1" });
    const u2 = await ctx.useCases.updateItem(created.id, { notes: "2" });
    const u3 = await ctx.useCases.updateItem(created.id, { rating: 3 });
    const stamps = [
      created.fieldsUpdatedAt.title!,
      u1.fieldsUpdatedAt.notes!,
      u2.fieldsUpdatedAt.notes!,
      u3.fieldsUpdatedAt.rating!,
    ];
    for (let i = 1; i < stamps.length; i++) {
      expect(compareHlc(stamps[i]!, stamps[i - 1]!)).toBeGreaterThan(0);
    }
  });

  it("persists the clock state in meta so a new instance continues after it", async () => {
    const created = await ctx.useCases.createItem("book", "La Peste");
    expect(await ctx.repository.meta.get("hlcState")).toBeDefined();
    const other = createItemUseCases({
      repository: ctx.repository,
      idGenerator: { newId: () => "00000000-0000-4000-8000-0000000000ff" },
      now: () => T0 - 60_000,
    });
    const next = await other.createItem("book", "Next");
    expect(compareHlc(next.fieldsUpdatedAt.title!, created.fieldsUpdatedAt.title!)).toBeGreaterThan(
      0,
    );
  });

  it("stamps concurrent writes with distinct, increasing HLCs", async () => {
    const items = await Promise.all([
      ctx.useCases.createItem("shopping", "a"),
      ctx.useCases.createItem("shopping", "b"),
      ctx.useCases.createItem("shopping", "c"),
    ]);
    const stamps = items.map((i) => i.fieldsUpdatedAt.title!);
    expect(new Set(stamps).size).toBe(3);
  });
});
