import type { Connectivity } from "../ports/connectivity";

export const SYNC_INTERVAL_MS = 60_000;
export const LOCAL_WRITE_DEBOUNCE_MS = 2_000;

export type SyncSchedulerDocument = Pick<
  Document,
  "visibilityState" | "addEventListener" | "removeEventListener"
>;

export type SyncSchedulerDeps = {
  connectivity: Connectivity;
  runSync: () => void | Promise<void>;
  document?: SyncSchedulerDocument;
};

export type SyncScheduler = {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  notifyLocalWrite(): void;
};

export function createSyncScheduler({
  connectivity,
  runSync,
  document: documentRef,
}: SyncSchedulerDeps): SyncScheduler {
  let started = false;
  let paused = false;
  let intervalId: ReturnType<typeof setInterval> | undefined;
  let debounceId: ReturnType<typeof setTimeout> | undefined;
  let unsubscribeConnectivity: (() => void) | undefined;
  let visibilityHandler: (() => void) | undefined;

  const doc =
    documentRef ??
    (typeof document !== "undefined"
      ? (document as SyncSchedulerDocument)
      : undefined);

  function triggerSync(): void {
    if (!started || paused || !connectivity.isOnline()) return;
    void runSync();
  }

  function scheduleDebouncedSync(): void {
    if (debounceId !== undefined) clearTimeout(debounceId);
    debounceId = setTimeout(() => {
      debounceId = undefined;
      triggerSync();
    }, LOCAL_WRITE_DEBOUNCE_MS);
  }

  function clearTimers(): void {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
    if (debounceId !== undefined) {
      clearTimeout(debounceId);
      debounceId = undefined;
    }
  }

  return {
    start() {
      if (started) return;
      started = true;

      unsubscribeConnectivity = connectivity.onChange((online) => {
        if (online) triggerSync();
      });

      if (doc !== undefined) {
        visibilityHandler = () => {
          if (doc.visibilityState === "visible") triggerSync();
        };
        doc.addEventListener("visibilitychange", visibilityHandler);
      }

      intervalId = setInterval(() => triggerSync(), SYNC_INTERVAL_MS);

      if (connectivity.isOnline()) triggerSync();
    },

    stop() {
      if (!started) return;
      started = false;
      paused = false;
      clearTimers();
      unsubscribeConnectivity?.();
      unsubscribeConnectivity = undefined;
      if (doc !== undefined && visibilityHandler !== undefined) {
        doc.removeEventListener("visibilitychange", visibilityHandler);
        visibilityHandler = undefined;
      }
    },

    pause() {
      paused = true;
      clearTimers();
    },

    resume() {
      paused = false;
      if (started && intervalId === undefined) {
        intervalId = setInterval(() => triggerSync(), SYNC_INTERVAL_MS);
      }
    },

    notifyLocalWrite() {
      if (!started || paused || !connectivity.isOnline()) return;
      scheduleDebouncedSync();
    },
  };
}
