import { createPlatformBrowserBarcodeScanner } from "../adapters/browser/barcode-scanner";
import { createCameraBarcodeFrameSource } from "../adapters/browser/camera-barcode-frame-source";
import { createBrowserConnectivity } from "../adapters/browser/connectivity";
import type { BarcodeScanner } from "../application/ports/barcode-scanner";
import { createHttpAuthGateway } from "../adapters/http/auth-gateway";
import { createHttpRemoteStore } from "../adapters/http/remote-store";
import { createUuidIdGenerator } from "../adapters/browser/id-generator";
import { openMuniDb } from "../adapters/indexeddb/db";
import { createIndexedDbItemRepository } from "../adapters/indexeddb/item-repository";
import { createItemUseCases, type ItemUseCases } from "../application/items";
import { createSearchUseCase, type SearchUseCase } from "../application/search";
import type { AuthGateway } from "../application/ports/auth-gateway";
import type { Unsubscribe } from "../application/ports/item-repository";
import { createSessionUseCases, type SessionUseCases } from "../application/session";
import { createSyncEngine } from "../application/sync/engine";
import { createSyncScheduler } from "../application/sync/scheduler";

export const MUNI_DB_NAME = "muni";
const SYNC_PULL_LIMIT = 100;

export type SyncStatusState = "idle" | "syncing" | "offline" | "paused";

export type ClientContext = {
  itemUseCases: ItemUseCases;
  searchUseCase: SearchUseCase;
  sessionUseCases: SessionUseCases;
  authGateway: AuthGateway;
  subscribeSyncStatus(listener: (state: SyncStatusState) => void): Unsubscribe;
};

let clientContext: Promise<ClientContext> | undefined;
let syncStatus: SyncStatusState = "idle";
const syncStatusListeners = new Set<(state: SyncStatusState) => void>();
let syncScheduler: ReturnType<typeof createSyncScheduler> | undefined;
let syncEngine: ReturnType<typeof createSyncEngine> | undefined;
let syncStarted = false;

function publishSyncStatus(next: SyncStatusState): void {
  if (syncStatus === next) return;
  syncStatus = next;
  for (const listener of syncStatusListeners) listener(syncStatus);
}

function wrapLocalWrites(items: ItemUseCases, onLocalWrite: () => void): ItemUseCases {
  const after =
    <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
    async (...args: A): Promise<R> => {
      const result = await fn(...args);
      onLocalWrite();
      return result;
    };
  return {
    ...items,
    createItem: after(items.createItem),
    updateItem: after(items.updateItem),
    deleteItem: after(items.deleteItem),
    restoreItem: after(items.restoreItem),
  };
}

function buildClientContext(): Promise<ClientContext> {
  return openMuniDb(MUNI_DB_NAME).then((db) => {
    const repository = createIndexedDbItemRepository(db);
    const connectivity = createBrowserConnectivity();
    const remote = createHttpRemoteStore({
      fetch: globalThis.fetch.bind(globalThis),
      baseUrl: "",
    });
    const authGateway = createHttpAuthGateway({
      fetch: globalThis.fetch.bind(globalThis),
      baseUrl: "",
      navigate: (url) => {
        window.location.assign(url);
      },
    });

    syncStatus = connectivity.isOnline() ? "idle" : "offline";

    const baseItemUseCases = createItemUseCases({
      repository,
      idGenerator: createUuidIdGenerator(),
      now: () => Date.now(),
    });

    syncEngine = createSyncEngine({
      repository,
      remote,
      items: baseItemUseCases,
      pullLimit: SYNC_PULL_LIMIT,
      now: () => Date.now(),
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    });

    async function runSync(): Promise<void> {
      const engine = syncEngine;
      if (engine === undefined) return;
      if (!connectivity.isOnline()) {
        publishSyncStatus("offline");
        return;
      }
      publishSyncStatus("syncing");
      try {
        await engine.run();
        if (engine.paused) {
          syncScheduler?.pause();
          publishSyncStatus("paused");
        } else {
          publishSyncStatus("idle");
        }
      } catch {
        publishSyncStatus(connectivity.isOnline() ? "idle" : "offline");
      }
    }

    syncScheduler = createSyncScheduler({ connectivity, runSync });

    connectivity.onChange((online) => {
      if (!syncStarted) return;
      if (!online) {
        publishSyncStatus(syncStatus === "paused" ? "paused" : "offline");
        return;
      }
      if (syncStatus === "offline") {
        publishSyncStatus(syncEngine?.paused ? "paused" : "idle");
      }
    });

    const itemUseCases = wrapLocalWrites(baseItemUseCases, () => {
      syncScheduler?.notifyLocalWrite();
    });

    const searchUseCase = createSearchUseCase({ repository });

    const sessionUseCases = createSessionUseCases({
      gateway: authGateway,
      meta: repository.meta,
      connectivity,
    });

    const wrappedSession: SessionUseCases = {
      open: () => sessionUseCases.open(),
      signOut: async () => {
        stopClientSync();
        await sessionUseCases.signOut();
      },
    };

    return {
      itemUseCases,
      searchUseCase,
      sessionUseCases: wrappedSession,
      authGateway,
      subscribeSyncStatus(listener) {
        syncStatusListeners.add(listener);
        listener(syncStatus);
        return () => syncStatusListeners.delete(listener);
      },
    };
  });
}

/**
 * Lazily builds the client composition root. IndexedDB and auth wiring run on
 * the first call (never at import time), so this module is safe to import
 * during server rendering as long as getters are called from the browser.
 */
export function getClientContext(): Promise<ClientContext> {
  clientContext ??= buildClientContext();
  return clientContext;
}

export function getItemUseCases(): Promise<ItemUseCases> {
  return getClientContext().then((ctx) => ctx.itemUseCases);
}

export function getSearchUseCase(): Promise<SearchUseCase> {
  return getClientContext().then((ctx) => ctx.searchUseCase);
}

export function getSessionUseCases(): Promise<SessionUseCases> {
  return getClientContext().then((ctx) => ctx.sessionUseCases);
}

export function getAuthGateway(): Promise<AuthGateway> {
  return getClientContext().then((ctx) => ctx.authGateway);
}

export function subscribeSyncStatus(
  listener: (state: SyncStatusState) => void,
): Promise<Unsubscribe> {
  return getClientContext().then((ctx) => ctx.subscribeSyncStatus(listener));
}

export function startClientSync(): Promise<void> {
  return getClientContext().then(() => {
    syncEngine?.resume();
    syncScheduler?.resume();
    if (!syncStarted) {
      syncStarted = true;
      syncScheduler?.start();
    }
    const online = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (!online) publishSyncStatus("offline");
  });
}

export function createBookBarcodeScanner(video: HTMLVideoElement): {
  scanner: BarcodeScanner;
  stopTracks(): void;
} {
  const frameSource = createCameraBarcodeFrameSource({ video });
  return {
    scanner: createPlatformBrowserBarcodeScanner({ frameSource }),
    stopTracks: () => frameSource.stopTracks(),
  };
}

export function stopClientSync(): void {
  if (!syncStarted) return;
  syncStarted = false;
  syncScheduler?.stop();
  const online =
    typeof navigator !== "undefined" ? navigator.onLine : true;
  publishSyncStatus(online ? "idle" : "offline");
}
