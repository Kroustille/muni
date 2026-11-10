import type { Connectivity } from "../application/ports/connectivity";

export type PausableSyncEngine = {
  run(): Promise<unknown>;
  readonly paused: boolean;
  resume(): void;
};

export type SyncRunLoopDeps = {
  engines: readonly PausableSyncEngine[];
  connectivity: Connectivity;
  onStatus: (state: "syncing" | "idle" | "paused" | "offline") => void;
  onPauseScheduler: () => void;
};

export async function runSyncEngines(deps: SyncRunLoopDeps): Promise<void> {
  const { engines, connectivity, onStatus, onPauseScheduler } = deps;
  if (engines.length === 0) return;
  if (!connectivity.isOnline()) {
    onStatus("offline");
    return;
  }
  onStatus("syncing");
  // Run every engine even if one fails, so a single broken domain (e.g. a
  // rejected endpoint) cannot block sync for all other domains.
  let anyFailed = false;
  for (const engine of engines) {
    try {
      await engine.run();
    } catch {
      anyFailed = true;
    }
  }
  const anyPaused = engines.some((engine) => engine.paused);
  if (anyPaused) {
    onPauseScheduler();
    onStatus("paused");
  } else if (anyFailed) {
    onStatus(connectivity.isOnline() ? "idle" : "offline");
  } else {
    onStatus("idle");
  }
}

export function wrapUseCasesAfterLocalWrite<T extends Record<string, unknown>>(
  useCases: T,
  writeKeys: readonly (keyof T)[],
  onLocalWrite: () => void,
): T {
  const wrapped = { ...useCases };
  for (const key of writeKeys) {
    const fn = useCases[key];
    if (typeof fn !== "function") continue;
    (wrapped as Record<string, unknown>)[key as string] = async (...args: unknown[]) => {
      const result = await (fn as (...a: unknown[]) => Promise<unknown>)(...args);
      onLocalWrite();
      return result;
    };
  }
  return wrapped;
}
