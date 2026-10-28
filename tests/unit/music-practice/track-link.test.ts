import { describe, expect, it } from "vitest";

import { createItemUseCases } from "@/application/items";
import { createLearningPieceUseCases } from "@/application/music-practice/learning-piece";
import type { LearningPiece } from "@/domain/learning-piece";
import { newItem, type Item } from "@/domain/item";
import type { ItemRepository } from "@/application/ports/item-repository";

function memoryItemRepo(initial: Item[] = []): ItemRepository {
  const store = new Map(initial.map((row) => [row.id, row]));
  const listeners = new Set<() => void>();
  const meta = {
    data: new Map<string, unknown>(),
    get: async (key: string) => meta.data.get(key) as never,
    set: async (key: string, value: unknown) => {
      meta.data.set(key, value);
    },
  };
  return {
    meta,
    get: (id) => Promise.resolve(store.get(id)),
    query: async (q) =>
      [...store.values()].filter((row) => (q?.type ? row.type === q.type : true)),
    put: async (item, _options) => {
      store.set(item.id, item);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    outbox: () => Promise.resolve([]),
    clearOutbox: () => Promise.resolve(),
  };
}

function memoryPieceRepo() {
  const store = new Map<string, LearningPiece>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    list: () => Promise.resolve([...store.values()]),
    upsert: async (row: LearningPiece) => {
      store.set(row.id, row);
      return row;
    },
    subscribe: () => () => undefined,
    outbox: () => Promise.resolve([]),
    clearOutbox: () => Promise.resolve(),
  };
}

const meta = {
  data: new Map<string, unknown>(),
  get: async (key: string) => meta.data.get(key) as never,
  set: async (key: string, value: unknown) => {
    meta.data.set(key, value);
  },
};

describe("track link reference only", () => {
  it("does not mutate music_track status when linking piece", async () => {
    const trackId = "99999999-9999-4999-8999-999999999999";
    const track = newItem({
      id: trackId,
      type: "music_track",
      title: "Test track",
      artist: "Artist",
      status: "to_listen",
      createdAt: new Date().toISOString(),
    });
    const items = createItemUseCases({
      repository: memoryItemRepo([track]),
      idGenerator: { newId: () => "88888888-8888-4888-8888-888888888888" },
      now: () => 1,
    });
    const pieceUc = createLearningPieceUseCases({
      learningPieces: memoryPieceRepo(),
      meta,
      idGenerator: { newId: () => "88888888-8888-4888-8888-888888888888" },
      now: () => 1,
    });
    const piece = await pieceUc.createPiece({ title: "Blackbird" });
    await pieceUc.updatePiece(piece.id, { linkedTrackId: trackId });
    const after = await items.getItem(trackId);
    expect(after?.status).toBe("to_listen");
  });
});
