import { describe, expect, it } from "vitest";

import { merge } from "@/domain/merge";
import { itemWireSchema, type ItemWire } from "@/domain/item";
import {
  createSyncService,
  SyncValidationError,
  type RowError,
} from "@/application/server/sync-service";

import vectors from "../vectors/merge-vectors.json";
import { InMemoryServerItemRepository } from "../helpers/in-memory-server-item-repository";

type Vector = { name: string; local: ItemWire; remote: ItemWire; expected: ItemWire };
const cases = vectors as Vector[];

const USER = "00000000-0000-4000-8000-000000000001";
const SERVER_SEED_TS = "2026-01-01T00:00:00.000Z";
const WRITE_TS = "2026-03-01T12:00:00.000Z";

function fixedNow() {
  return new Date(WRITE_TS);
}

function setup(now = fixedNow) {
  const repository = new InMemoryServerItemRepository();
  const sync = createSyncService({ repository, now });
  return { repository, sync, now };
}

function seedRemote(repository: InMemoryServerItemRepository, remote: ItemWire) {
  return repository.upsert(USER, [
    { ...remote, server_updated_at: remote.server_updated_at ?? SERVER_SEED_TS },
  ]);
}

function withoutServerUpdatedAt(row: ItemWire): ItemWire {
  return { ...row, server_updated_at: null };
}

function validBookWire(overrides: Partial<ItemWire> = {}): ItemWire {
  const base: ItemWire = {
    id: "22222222-2222-4222-8222-222222222222",
    type: "book",
    title: "Neuromancer",
    created_at: "2026-01-01T00:00:00.000Z",
    author: "Gibson",
    status: "to_read",
    recommended_by: null,
    rating: null,
    notes: null,
    quantity: null,
    checked: false,
    ingredients: null,
    steps: null,
    deleted_at: null,
    fields_updated_at: { title: "1000-0-dev-a" },
    isbn: null,
    synopsis: null,
    genres: null,
    publication_year: null,
    publisher: null,
    page_count: null,
    server_updated_at: null,
    ...overrides,
  };
  return itemWireSchema.parse(base);
}

describe("createSyncService.push", () => {
  it.each(cases.map((c) => [c.name, c] as const))(
    "merges with stored row: %s",
    async (_name, c) => {
      const { repository, sync } = setup();
      await seedRemote(repository, c.remote);

      const [merged] = await sync.push(USER, [c.local]);

      expect(withoutServerUpdatedAt(merged)).toEqual(withoutServerUpdatedAt(c.expected));
      expect(merged.server_updated_at).toBe(WRITE_TS);
      expect(withoutServerUpdatedAt(repository.getRow(USER, c.local.id)!)).toEqual(
        withoutServerUpdatedAt(merged),
      );
    },
  );

  it("inserts a row for the caller when none exists", async () => {
    const { repository, sync } = setup();
    const incoming = validBookWire();

    const [stored] = await sync.push(USER, [incoming]);

    expect(withoutServerUpdatedAt(stored)).toEqual(withoutServerUpdatedAt(incoming));
    expect(stored.server_updated_at).toBe(WRITE_TS);
    expect(repository.getRow(USER, incoming.id)).toEqual(stored);
  });

  it.each(cases.map((c) => [c.name, c] as const))("%s: idempotent second push", async (_name, c) => {
    const { repository, sync } = setup();
    await seedRemote(repository, c.remote);

    const first = await sync.push(USER, [c.local]);
    const second = await sync.push(USER, [first[0]]);

    expect(second).toEqual(first);
    expect(repository.getRow(USER, c.local.id)?.server_updated_at).toBe(first[0].server_updated_at);
  });

  it("converges when the same vectors are pushed in any order", async () => {
    const payloads = [cases[0]!.local, cases[1]!.local, cases[2]!.local];
    const orders = [
      payloads,
      [payloads[2], payloads[0], payloads[1]],
      [payloads[1], payloads[2], payloads[0]],
    ];

    const finals: ItemWire[][] = [];
    for (const order of orders) {
      const { sync } = setup();
      for (const item of order) {
        await sync.push(USER, [item]);
      }
      const { items } = await sync.pull(USER, null, 100);
      finals.push(items);
    }

    for (let i = 1; i < finals.length; i++) {
      expect(finals[i].map(withoutServerUpdatedAt)).toEqual(
        finals[0].map(withoutServerUpdatedAt),
      );
    }
  });

  it("edit vs delete: latest field stamp wins", async () => {
    const vector = cases.find((c) => c.name === "later delete beats earlier edit");
    expect(vector).toBeDefined();
    const { sync } = setup();
    await sync.push(USER, [vector!.local]);
    const [merged] = await sync.push(USER, [vector!.remote]);
    expect(withoutServerUpdatedAt(merged)).toEqual(withoutServerUpdatedAt(vector!.expected));
    expect(merged.deleted_at).not.toBeNull();
  });

  it("rejects rows that fail domain validation with per-row errors", async () => {
    const { repository, sync } = setup();
    const invalid = { ...validBookWire(), title: "   " } as ItemWire;

    let caught: SyncValidationError | undefined;
    try {
      await sync.push(USER, [invalid]);
    } catch (error) {
      caught = error as SyncValidationError;
    }

    expect(caught).toBeInstanceOf(SyncValidationError);
    const rowErrors: RowError[] = caught!.rowErrors;
    expect(rowErrors.length).toBeGreaterThan(0);
    expect(rowErrors[0]?.index).toBe(0);
    expect(rowErrors[0]?.id).toBe(invalid.id);
    expect(repository.getRow(USER, invalid.id)).toBeUndefined();
  });

  it("rejects a payload carrying user_id", async () => {
    const { sync } = setup();
    const payload = { ...validBookWire(), user_id: USER };

    await expect(sync.push(USER, [payload as ItemWire])).rejects.toBeInstanceOf(
      SyncValidationError,
    );
  });

  it("uses domain merge semantics (incoming vs stored)", async () => {
    const c = cases[0]!;
    const { repository, sync } = setup();
    await seedRemote(repository, c.remote);

    const [fromService] = await sync.push(USER, [c.local]);
    const fromDomain = merge(c.local, { ...c.remote, server_updated_at: SERVER_SEED_TS });
    expect(withoutServerUpdatedAt(fromService)).toEqual(withoutServerUpdatedAt(fromDomain));
  });
});

describe("createSyncService.pull", () => {
  it("returns rows ordered ascending by server_updated_at with since and limit", async () => {
    const { repository, sync } = setup();
    const rows: ItemWire[] = [
      validBookWire({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        server_updated_at: "2026-01-01T00:00:00.000Z",
      }),
      validBookWire({
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        server_updated_at: "2026-01-02T00:00:00.000Z",
      }),
      validBookWire({
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        server_updated_at: "2026-01-03T00:00:00.000Z",
      }),
    ];
    await repository.upsert(USER, rows);

    const firstPage = await sync.pull(USER, null, 2);
    expect(firstPage.items.map((r) => r.id)).toEqual([
      rows[0].id,
      rows[1].id,
    ]);
    expect(firstPage.cursor).toBe(rows[1].server_updated_at);

    const secondPage = await sync.pull(USER, firstPage.cursor, 10);
    expect(secondPage.items.map((r) => r.id)).toEqual([rows[2].id]);
    expect(secondPage.cursor).toBe(rows[2].server_updated_at);
  });

  it("includes soft-deleted rows", async () => {
    const { repository, sync } = setup();
    const deleted = validBookWire({
      deleted_at: "2026-01-05T00:00:00.000Z",
      fields_updated_at: { deleted_at: "5000-0-dev-a" },
      server_updated_at: "2026-01-05T00:00:00.000Z",
    });
    await repository.upsert(USER, [deleted]);

    const { items } = await sync.pull(USER, null, 10);
    expect(items).toHaveLength(1);
    expect(items[0]?.deleted_at).toBe(deleted.deleted_at);
  });

  it("returns an empty page and stable cursor when nothing matches", async () => {
    const { sync } = setup();
    const since = "2026-06-01T00:00:00.000Z";
    const page = await sync.pull(USER, since, 5);
    expect(page.items).toEqual([]);
    expect(page.cursor).toBe(since);
  });
});
