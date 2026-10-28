import { describe, expect, it, vi } from "vitest";

import { createPlantsGardenSyncEngine } from "@/application/sync/plants-garden-sync-engine";
import { plantToWire } from "@/domain/plant";

describe("plants-garden sync engine", () => {
  it("pushes local outbox and pulls remote cursor", async () => {
    const metaStore = new Map<string, unknown>();
    const meta = {
      get: async <K extends keyof import("@/application/ports/item-repository").MetaValues>(
        key: K,
      ) => metaStore.get(key as string) as import("@/application/ports/item-repository").MetaValues[K] | undefined,
      set: async <K extends keyof import("@/application/ports/item-repository").MetaValues>(
        key: K,
        value: import("@/application/ports/item-repository").MetaValues[K],
      ) => {
        metaStore.set(key as string, value);
      },
    };
    const plantWire = plantToWire({
      id: "11111111-2222-4333-8444-555555555555",
      title: "A",
      locationTag: "indoor",
      notes: null,
      careProfileId: null,
      seasonalHints: [],
      deletedAt: null,
      fieldsUpdatedAt: { title: "t" },
    });
    const remote = {
      push: vi.fn(async () => ({
        plants: [plantWire],
        careEvents: [],
        careProfiles: [],
        cultures: [],
        milestones: [],
        cursor: "2026-01-02T00:00:00.000Z",
      })),
      pull: vi.fn(async () => ({
        plants: [],
        careEvents: [],
        careProfiles: [],
        cultures: [],
        milestones: [],
        cursor: "2026-01-03T00:00:00.000Z",
      })),
    };
    const sync = {
      collectPushPayload: vi.fn(async () => ({
        plants: [plantWire],
        careEvents: [],
        careProfiles: [],
        cultures: [],
        milestones: [],
      })),
      applyRemote: vi.fn(async () => undefined),
      clearOutboxes: vi.fn(async () => undefined),
    };
    const engine = createPlantsGardenSyncEngine({
      meta,
      remote,
      sync,
      pullLimit: 10,
      sleep: async () => undefined,
    });
    await engine.run();
    expect(remote.push).toHaveBeenCalled();
    expect(metaStore.get("plantsGardenPullCursor")).toBe("2026-01-03T00:00:00.000Z");
  });
});
