import type { ItemRepository } from "../ports/item-repository";
import type {
  MemoriesGrowthLocalStores,
  MemoriesGrowthPayload,
  MemoriesGrowthRemoteStore,
  SyncedLocalStore,
} from "../ports/memories-growth-repositories";
import { RemoteStoreError } from "../ports/remote-store";
import {
  achievementToWire,
  mergeAchievement,
  wireToAchievement,
  type AchievementWire,
} from "@/domain/achievement";
import {
  goalCheckinToWire,
  goalToWire,
  mergeGoal,
  mergeGoalCheckin,
  wireToGoal,
  wireToGoalCheckin,
  type GoalCheckinWire,
  type GoalWire,
} from "@/domain/goal";
import {
  mergeSouvenir,
  souvenirToWire,
  wireToSouvenir,
  type SouvenirWire,
} from "@/domain/souvenir";

const PUSH_ATTEMPTS = 2;
const BACKOFF_MS = 1_000;
const MAX_PULL_PAGES = 20;

export type MemoriesGrowthSyncEngine = {
  run(): Promise<{ quarantined: { id: string; message: string }[] }>;
  readonly paused: boolean;
  resume(): void;
};

type Codec<T, W> = {
  toWire(row: T): W;
  fromWire(wire: W): T;
  merge(local: W, remote: W): W;
};

type Entity<T extends { id: string; deletedAt: string | null }, W> = {
  store: SyncedLocalStore<T>;
  codec: Codec<T, W>;
};

async function collect<T extends { id: string; deletedAt: string | null }, W>(
  entity: Entity<T, W>,
): Promise<W[]> {
  const ids = await entity.store.outbox();
  const wires: W[] = [];
  for (const id of ids) {
    const row = await entity.store.get(id);
    if (row !== undefined) wires.push(entity.codec.toWire(row));
  }
  return wires;
}

/**
 * Applies server rows locally. A row with a pending local edit (still in the
 * outbox) is merged per field and stays queued, so a pull never discards an
 * edit made after the last push.
 */
async function apply<T extends { id: string; deletedAt: string | null }, W>(
  entity: Entity<T, W>,
  wires: W[],
): Promise<void> {
  if (wires.length === 0) return;
  const pending = new Set(await entity.store.outbox());
  for (const wire of wires) {
    const id = (wire as { id: string }).id;
    const local = pending.has(id) ? await entity.store.get(id) : undefined;
    if (local === undefined) {
      await entity.store.upsert(entity.codec.fromWire(wire), { enqueue: false });
    } else {
      const merged = entity.codec.merge(entity.codec.toWire(local), wire);
      await entity.store.upsert(entity.codec.fromWire(merged), { enqueue: true });
    }
  }
}

export function createMemoriesGrowthSyncEngine(deps: {
  meta: ItemRepository["meta"];
  remote: MemoriesGrowthRemoteStore;
  stores: MemoriesGrowthLocalStores;
  pullLimit: number;
  sleep: (ms: number) => Promise<void>;
}): MemoriesGrowthSyncEngine {
  const souvenirs: Entity<ReturnType<typeof wireToSouvenir>, SouvenirWire> = {
    store: deps.stores.souvenirs,
    codec: { toWire: (r) => souvenirToWire(r), fromWire: wireToSouvenir, merge: mergeSouvenir },
  };
  const goals: Entity<ReturnType<typeof wireToGoal>, GoalWire> = {
    store: deps.stores.goals,
    codec: { toWire: (r) => goalToWire(r), fromWire: wireToGoal, merge: mergeGoal },
  };
  const goalCheckins: Entity<ReturnType<typeof wireToGoalCheckin>, GoalCheckinWire> = {
    store: deps.stores.goalCheckins,
    codec: {
      toWire: (r) => goalCheckinToWire(r),
      fromWire: wireToGoalCheckin,
      merge: mergeGoalCheckin,
    },
  };
  const achievements: Entity<ReturnType<typeof wireToAchievement>, AchievementWire> = {
    store: deps.stores.achievements,
    codec: {
      toWire: (r) => achievementToWire(r),
      fromWire: wireToAchievement,
      merge: mergeAchievement,
    },
  };

  async function applyAll(payload: MemoriesGrowthPayload): Promise<void> {
    // Goals before check-ins so a check-in never lands before its goal.
    await apply(souvenirs, payload.souvenirs);
    await apply(goals, payload.goals);
    await apply(goalCheckins, payload.goalCheckins);
    await apply(achievements, payload.achievements);
  }

  let paused = false;
  let running = false;

  return {
    get paused() {
      return paused;
    },

    resume() {
      paused = false;
    },

    async run() {
      if (paused || running) return { quarantined: [] };
      running = true;
      const quarantined: { id: string; message: string }[] = [];
      try {
        const payload: MemoriesGrowthPayload = {
          souvenirs: await collect(souvenirs),
          goals: await collect(goals),
          goalCheckins: await collect(goalCheckins),
          achievements: await collect(achievements),
        };
        const pushCount =
          payload.souvenirs.length +
          payload.goals.length +
          payload.goalCheckins.length +
          payload.achievements.length;

        if (pushCount > 0) {
          for (let attempt = 0; attempt < PUSH_ATTEMPTS; attempt++) {
            try {
              const merged = await deps.remote.push(payload);
              // Clear first: rows edited again during the push are re-queued by apply().
              await Promise.all([
                souvenirs.store.clearOutbox(payload.souvenirs.map((r) => r.id)),
                goals.store.clearOutbox(payload.goals.map((r) => r.id)),
                goalCheckins.store.clearOutbox(payload.goalCheckins.map((r) => r.id)),
                achievements.store.clearOutbox(payload.achievements.map((r) => r.id)),
              ]);
              await applyAll(merged);
              break;
            } catch (error) {
              if (error instanceof RemoteStoreError && error.kind === "unauthenticated") {
                paused = true;
                return { quarantined };
              }
              if (error instanceof RemoteStoreError && error.kind === "validation") {
                for (const row of error.rowErrors) {
                  quarantined.push({ id: row.id ?? String(row.index), message: row.message });
                }
                break;
              }
              if (attempt < PUSH_ATTEMPTS - 1) await deps.sleep(BACKOFF_MS);
              else throw error;
            }
          }
        }

        for (let page = 0; page < MAX_PULL_PAGES; page++) {
          const since = (await deps.meta.get("memoriesGrowthPullCursor")) ?? null;
          let pulled;
          try {
            pulled = await deps.remote.pull(since, deps.pullLimit);
          } catch (error) {
            if (error instanceof RemoteStoreError && error.kind === "unauthenticated") {
              paused = true;
              return { quarantined };
            }
            throw error;
          }
          await applyAll(pulled);
          if (pulled.cursor) await deps.meta.set("memoriesGrowthPullCursor", pulled.cursor);
          if (!pulled.hasMore) break;
        }
      } finally {
        running = false;
      }
      return { quarantined };
    },
  };
}
