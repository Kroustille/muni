import type { ItemRepository, MetaKey } from "../ports/item-repository";
import { RemoteStoreError } from "../ports/remote-store";
import type { PlantsGardenSyncApply } from "../plants-garden/sync-apply";
import type { PlantsGardenRemoteStore } from "../ports/plants-garden-remote-store";

const PUSH_ATTEMPTS = 2;
const BACKOFF_MS = 1_000;

export type PlantsGardenSyncEngine = {
  run(): Promise<{ quarantined: { id: string; message: string }[] }>;
  readonly paused: boolean;
  resume(): void;
};

export function createPlantsGardenSyncEngine(deps: {
  meta: ItemRepository["meta"];
  remote: PlantsGardenRemoteStore;
  sync: PlantsGardenSyncApply;
  pullLimit: number;
  sleep: (ms: number) => Promise<void>;
}): PlantsGardenSyncEngine {
  let paused = false;
  let running = false;

  const engine: PlantsGardenSyncEngine = {
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
        const payload = await deps.sync.collectPushPayload();
        const hasPush =
          payload.plants.length +
            payload.careEvents.length +
            payload.careProfiles.length +
            payload.cultures.length +
            payload.milestones.length >
          0;

        if (hasPush) {
          for (let attempt = 0; attempt < PUSH_ATTEMPTS; attempt++) {
            try {
              const merged = await deps.remote.push(payload);
              await deps.sync.applyRemote(merged);
              await deps.sync.clearOutboxes({
                plantIds: payload.plants.map((p) => p.id),
                careEventIds: payload.careEvents.map((e) => e.id),
                careProfileIds: payload.careProfiles.map((p) => p.id),
                cultureIds: payload.cultures.map((c) => c.id),
                milestoneIds: payload.milestones.map((m) => m.id),
              });
              break;
            } catch (error) {
              if (error instanceof RemoteStoreError && error.kind === "validation") {
                for (const row of error.rowErrors) {
                  quarantined.push({ id: row.id ?? String(row.index), message: row.message });
                }
                break;
              }
              if (attempt < PUSH_ATTEMPTS - 1) await deps.sleep(BACKOFF_MS);
            }
          }
        }

        const cursorKey: MetaKey = "plantsGardenPullCursor";
        const since = (await deps.meta.get(cursorKey)) ?? null;
        const pulled = await deps.remote.pull(since, deps.pullLimit);
        await deps.sync.applyRemote(pulled);
        if (pulled.cursor) await deps.meta.set(cursorKey, pulled.cursor);
      } finally {
        running = false;
      }
      return { quarantined };
    },
  };

  return engine;
}
