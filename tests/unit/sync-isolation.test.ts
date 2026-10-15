import { describe, expect, it } from "vitest";

import { itemWireSchema, type ItemWire } from "@/domain/item";
import {
  createSyncService,
  SyncAuthError,
} from "@/application/server/sync-service";

import { InMemoryServerItemRepository } from "../helpers/in-memory-server-item-repository";

const USER_A = "00000000-0000-4000-8000-00000000000a";
const USER_B = "00000000-0000-4000-8000-00000000000b";
const SHARED_ID = "11111111-1111-4111-8111-111111111111";
const WRITE_TS = "2026-03-01T12:00:00.000Z";

function fixedNow() {
  return new Date(WRITE_TS);
}

function setup() {
  const repository = new InMemoryServerItemRepository();
  const sync = createSyncService({ repository, now: fixedNow });
  return { repository, sync };
}

function bookFor(userLabel: string, overrides: Partial<ItemWire> = {}): ItemWire {
  return itemWireSchema.parse({
    id: SHARED_ID,
    type: "book",
    title: `Title ${userLabel}`,
    created_at: "2026-01-01T00:00:00.000Z",
    author: userLabel,
    status: "to_read",
    recommended_by: null,
    rating: null,
    notes: null,
    quantity: null,
    checked: false,
    ingredients: null,
    steps: null,
    deleted_at: null,
    fields_updated_at: { title: `1000-0-dev-${userLabel}` },
    server_updated_at: null,
    ...overrides,
  });
}

describe("sync service per-user isolation", () => {
  it("stores the same item id independently per user", async () => {
    const { repository, sync } = setup();
    const rowA = bookFor("a");
    const rowB = bookFor("b");

    await sync.push(USER_A, [rowA]);
    await sync.push(USER_B, [rowB]);

    expect(repository.getRow(USER_A, SHARED_ID)?.title).toBe(rowA.title);
    expect(repository.getRow(USER_B, SHARED_ID)?.title).toBe(rowB.title);
  });

  it("never lets user A read user B rows on pull", async () => {
    const { repository, sync } = setup();
    const rowB = bookFor("b", { server_updated_at: "2026-01-02T00:00:00.000Z" });
    await repository.upsert(USER_B, [rowB]);

    const pullA = await sync.pull(USER_A, null, 100);
    expect(pullA.items).toEqual([]);
  });

  it("never lets user A overwrite user B rows when reusing the same item id", async () => {
    const { repository, sync } = setup();
    const rowB = bookFor("b", { server_updated_at: "2026-01-02T00:00:00.000Z" });
    await repository.upsert(USER_B, [rowB]);

    const attack = bookFor("a", {
      title: "Hijacked",
      fields_updated_at: { title: "9000-0-dev-a" },
    });
    await sync.push(USER_A, [attack]);

    expect(repository.getRow(USER_B, SHARED_ID)?.title).toBe(rowB.title);
    expect(repository.getRow(USER_A, SHARED_ID)?.title).toBe("Hijacked");
  });

  it("never lets user A delete user B rows", async () => {
    const { repository, sync } = setup();
    const rowB = bookFor("b", { server_updated_at: "2026-01-02T00:00:00.000Z" });
    await repository.upsert(USER_B, [rowB]);

    const deleteFromA = bookFor("a", {
      deleted_at: "2026-01-10T00:00:00.000Z",
      fields_updated_at: { deleted_at: "9000-0-dev-a" },
    });
    await sync.push(USER_A, [deleteFromA]);

    expect(repository.getRow(USER_B, SHARED_ID)?.deleted_at).toBeNull();
    expect(repository.getRow(USER_A, SHARED_ID)?.deleted_at).toBe(deleteFromA.deleted_at);
  });

  it("pull returns only the caller rows", async () => {
    const { repository, sync } = setup();
    const rowA = bookFor("a", { server_updated_at: "2026-01-01T00:00:00.000Z" });
    const rowB = bookFor("b", {
      id: "22222222-2222-4222-8222-222222222222",
      server_updated_at: "2026-01-02T00:00:00.000Z",
    });
    await repository.upsert(USER_A, [rowA]);
    await repository.upsert(USER_B, [rowB]);

    const pullA = await sync.pull(USER_A, null, 10);
    expect(pullA.items.map((r) => r.id)).toEqual([rowA.id]);

    const pullB = await sync.pull(USER_B, null, 10);
    expect(pullB.items.map((r) => r.id)).toEqual([rowB.id]);
  });

  it("rejects push without a user id", async () => {
    const { sync } = setup();
    await expect(sync.push("", [bookFor("a")])).rejects.toBeInstanceOf(SyncAuthError);
  });

  it("rejects pull without a user id", async () => {
    const { sync } = setup();
    await expect(sync.pull("", null, 10)).rejects.toBeInstanceOf(SyncAuthError);
  });
});
