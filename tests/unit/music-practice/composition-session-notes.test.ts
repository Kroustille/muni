import { describe, expect, it } from "vitest";

import { createMusicCompositionUseCases } from "@/application/music-practice/composition";
import type { MusicComposition } from "@/domain/music-composition";

function memoryCompositionRepo() {
  const store = new Map<string, MusicComposition>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    list: () => Promise.resolve([...store.values()]),
    upsert: async (row: MusicComposition) => {
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

describe("composition session notes use cases", () => {
  it("appends notes in chronological order", async () => {
    const uc = createMusicCompositionUseCases({
      compositions: memoryCompositionRepo(),
      meta,
      idGenerator: { newId: () => "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" },
      now: () => new Date("2026-01-15T12:00:00.000Z").getTime(),
    });
    const created = await uc.createComposition({ title: "Pad dub" });
    await uc.appendSessionNote(created.id, { date: "2026-01-10", text: "first" });
    const updated = await uc.appendSessionNote(created.id, { date: "2026-01-12", text: "second" });
    expect(updated.sessionNotes.map((n) => n.date)).toEqual(["2026-01-10", "2026-01-12"]);
    expect(updated.lastWorkedAt).toBe("2026-01-12");
  });
});
