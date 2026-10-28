import type { ItemRepository, MetaKey } from "../ports/item-repository";
import { RemoteStoreError } from "../ports/remote-store";
import type { FitnessSyncApply } from "../fitness/sync-apply";
import type { FitnessRemoteStore } from "../ports/fitness-remote-store";

const PUSH_ATTEMPTS = 2;
const BACKOFF_MS = 1_000;

export type FitnessSyncEngine = {
  run(): Promise<{ quarantined: { id: string; message: string }[] }>;
  readonly paused: boolean;
  resume(): void;
};

export function createFitnessSyncEngine(deps: {
  meta: ItemRepository["meta"];
  remote: FitnessRemoteStore;
  sync: FitnessSyncApply;
  pullLimit: number;
  sleep: (ms: number) => Promise<void>;
}): FitnessSyncEngine {
  let paused = false;
  let running = false;

  const engine: FitnessSyncEngine = {
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
          payload.sessionTemplates.length +
            payload.scheduledSessions.length +
            payload.workoutLogs.length +
            payload.skipRecords.length +
            payload.settings.length >
          0;

        if (hasPush) {
          for (let attempt = 0; attempt < PUSH_ATTEMPTS; attempt++) {
            try {
              const merged = await deps.remote.push(payload);
              await deps.sync.applyRemote(merged);
              await deps.sync.clearOutboxes({
                sessionTemplateIds: payload.sessionTemplates.map((p) => p.id),
                scheduledSessionIds: payload.scheduledSessions.map((p) => p.id),
                workoutIds: payload.workoutLogs.map((w) => w.id),
                skipIds: payload.skipRecords.map((s) => s.id),
                settingsIds: payload.settings.map((s) => s.id),
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

        const cursorKey: MetaKey = "fitnessPullCursor";
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
