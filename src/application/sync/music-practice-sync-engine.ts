import type { ItemRepository, MetaKey } from "../ports/item-repository";
import { RemoteStoreError } from "../ports/remote-store";
import type { MusicPracticeSyncApply } from "../music-practice-sync";
import type { MusicPracticeRemoteStore } from "../ports/music-practice-remote-store";

const PUSH_ATTEMPTS = 2;
const BACKOFF_MS = 1_000;

export type MusicPracticeSyncEngine = {
  run(): Promise<{ quarantined: { id: string; message: string }[] }>;
  readonly paused: boolean;
  resume(): void;
};

export function createMusicPracticeSyncEngine(deps: {
  meta: ItemRepository["meta"];
  remote: MusicPracticeRemoteStore;
  sync: MusicPracticeSyncApply;
  pullLimit: number;
  sleep: (ms: number) => Promise<void>;
}): MusicPracticeSyncEngine {
  let paused = false;
  let running = false;

  const engine: MusicPracticeSyncEngine = {
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
          payload.compositions.length +
            payload.djSets.length +
            payload.instruments.length +
            payload.exercises.length +
            payload.plans.length +
            payload.logs.length +
            payload.learningPieces.length >
          0;

        if (hasPush) {
          for (let attempt = 0; attempt < PUSH_ATTEMPTS; attempt++) {
            try {
              const merged = await deps.remote.push(payload);
              await deps.sync.applyRemote(merged);
              await deps.sync.clearOutboxes({
                compositionIds: payload.compositions.map((c) => c.id),
                djSetIds: payload.djSets.map((s) => s.id),
                instrumentIds: payload.instruments.map((i) => i.id),
                exerciseIds: payload.exercises.map((e) => e.id),
                planIds: payload.plans.map((p) => p.id),
                logIds: payload.logs.map((l) => l.id),
                learningPieceIds: payload.learningPieces.map((p) => p.id),
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

        const cursorKey: MetaKey = "musicPracticePullCursor";
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
