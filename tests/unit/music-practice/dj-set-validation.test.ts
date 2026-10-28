import { describe, expect, it } from "vitest";

import { createDjSetUseCases } from "@/application/music-practice/dj-set";
import type { DjSet } from "@/domain/dj-set";
import { validateDjSet } from "@/domain/dj-set";
import { buildDjSet } from "./fixtures";

function memoryDjRepo() {
  const store = new Map<string, DjSet>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    list: () => Promise.resolve([...store.values()]),
    upsert: async (row: DjSet) => {
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

describe("dj set validation", () => {
  it("rejects performed without date", () => {
    expect(validateDjSet(buildDjSet({ status: "performed", performedAt: null }), "2026-01-01")).toBeTruthy();
  });
});

describe("dj set use cases", () => {
  it("markPerformed sets performedAt", async () => {
    const uc = createDjSetUseCases({
      djSets: memoryDjRepo(),
      meta,
      idGenerator: { newId: () => "22222222-2222-4222-8222-222222222222" },
      now: () => new Date("2026-01-10T12:00:00.000Z").getTime(),
    });
    const created = await uc.createDjSet({ title: "Salon" });
    const performed = await uc.markPerformed(created.id, "2026-01-09");
    expect(performed.status).toBe("performed");
    expect(performed.performedAt).toBe("2026-01-09");
  });

  it("transitionPlannedToPerformed preserves setlist", async () => {
    const repo = memoryDjRepo();
    const uc = createDjSetUseCases({
      djSets: repo,
      meta,
      idGenerator: { newId: () => "22222222-2222-4222-8222-222222222222" },
      now: () => new Date("2026-01-10T12:00:00.000Z").getTime(),
    });
    const created = await uc.createDjSet({ title: "Club" });
    await uc.updateDjSet(created.id, {
      setlist: [{ sortOrder: 0, text: "Track A" }],
    });
    const performed = await uc.transitionPlannedToPerformed(created.id);
    expect(performed.title).toBe("Club");
    expect(performed.setlist[0]?.text).toBe("Track A");
  });
});
