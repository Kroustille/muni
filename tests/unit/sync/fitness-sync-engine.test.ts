import { describe, expect, it, vi } from "vitest";

import { createFitnessSyncApply } from "@/application/fitness/sync-apply";
import { createFitnessSyncEngine } from "@/application/sync/fitness-sync-engine";
import { RemoteStoreError } from "@/application/ports/remote-store";
import type { FitnessRemoteStore } from "@/application/ports/fitness-remote-store";
import { InMemoryItemRepository } from "../../helpers/in-memory-item-repository";

describe("fitness sync engine", () => {
  it("pushes payload, clears outbox, and stores pull cursor", async () => {
    const metaRepo = new InMemoryItemRepository();
    const programs = {
      get: async () => undefined,
      list: async () => [],
      upsert: async (row: unknown) => row,
      subscribe: () => () => undefined,
      outbox: async () => ["11111111-1111-4111-8111-111111111111"],
      clearOutbox: vi.fn(async () => {}),
      getActive: async () => undefined,
    };
    const programRow = {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Force",
      isActive: true,
      deletedAt: null,
      plannedSessions: [],
      fieldsUpdatedAt: { name: "s" },
    };
    programs.get = async () => programRow as never;
    const workouts = {
      get: async () => undefined,
      getInProgress: async () => undefined,
      list: async () => [],
      upsert: async (row: unknown) => row,
      subscribe: () => () => undefined,
      outbox: async () => [],
      clearOutbox: async () => {},
    };
    const skips = {
      list: async () => [],
      upsert: async (row: unknown) => row,
      subscribe: () => () => undefined,
      outbox: async () => [],
      clearOutbox: async () => {},
    };
    const settings = {
      get: async () => undefined,
      upsert: async (row: unknown) => row,
      subscribe: () => () => undefined,
      outbox: async () => [],
    };
    const sync = createFitnessSyncApply({
      programs: programs as never,
      workouts: workouts as never,
      skips: skips as never,
      settings: settings as never,
    });
    const remote: FitnessRemoteStore = {
      push: async (payload) => ({ ...payload, cursor: "c1" }),
      pull: async () => ({
        programs: [],
        workoutLogs: [],
        skipRecords: [],
        settings: [],
        cursor: "c2",
      }),
    };
    const engine = createFitnessSyncEngine({
      meta: metaRepo.meta,
      remote,
      sync,
      pullLimit: 10,
      sleep: async () => {},
    });
    await engine.run();
    expect(programs.clearOutbox).toHaveBeenCalled();
    expect(await metaRepo.meta.get("fitnessPullCursor")).toBe("c2");
  });

  it("records validation quarantine rows", async () => {
    const metaRepo = new InMemoryItemRepository();
    const sync = createFitnessSyncApply({
      programs: {
        get: async () => ({
          id: "11111111-1111-4111-8111-111111111111",
          name: "P",
          isActive: true,
          deletedAt: null,
          plannedSessions: [],
          fieldsUpdatedAt: { name: "s" },
        }),
        list: async () => [],
        upsert: async (row: unknown) => row,
        subscribe: () => () => undefined,
        outbox: async () => ["11111111-1111-4111-8111-111111111111"],
        clearOutbox: async () => {},
        getActive: async () => undefined,
      } as never,
      workouts: {
        get: async () => undefined,
        getInProgress: async () => undefined,
        list: async () => [],
        upsert: async (row: unknown) => row,
        subscribe: () => () => undefined,
        outbox: async () => [],
        clearOutbox: async () => {},
      } as never,
      skips: {
        list: async () => [],
        upsert: async (row: unknown) => row,
        subscribe: () => () => undefined,
        outbox: async () => [],
        clearOutbox: async () => {},
      } as never,
      settings: {
        get: async () => undefined,
        upsert: async (row: unknown) => row,
        subscribe: () => () => undefined,
        outbox: async () => [],
      } as never,
    });
    const engine = createFitnessSyncEngine({
      meta: metaRepo.meta,
      remote: {
        push: async () => {
          throw new RemoteStoreError("validation", [{ index: 0, id: "bad", message: "invalid" }]);
        },
        pull: async () => ({
          programs: [],
          workoutLogs: [],
          skipRecords: [],
          settings: [],
          cursor: "",
        }),
      },
      sync,
      pullLimit: 5,
      sleep: async () => {},
    });
    const result = await engine.run();
    expect(result.quarantined[0]?.message).toBe("invalid");
  });
});
