import { createPlatformBrowserBarcodeScanner } from "../adapters/browser/barcode-scanner";
import { createCameraBarcodeFrameSource } from "../adapters/browser/camera-barcode-frame-source";
import { createBrowserConnectivity } from "../adapters/browser/connectivity";
import type { BarcodeScanner } from "../application/ports/barcode-scanner";
import { createHttpAuthGateway } from "../adapters/http/auth-gateway";
import { createHttpRemoteStore } from "../adapters/http/remote-store";
import { createUuidIdGenerator } from "../adapters/browser/id-generator";
import { openMuniDb } from "../adapters/indexeddb/db";
import { createIndexedDbItemRepository } from "../adapters/indexeddb/item-repository";
import { wireClientQuoteSync } from "./client-quote-sync";
import { wireClientCookbookSync } from "./client-cookbook-sync";
import { wireClientFitnessSync } from "./client-fitness-sync";
import { wireClientSuggestions } from "./client-suggestions";
import type { CookbookUseCases } from "../application/cookbooks/cookbook-use-cases";
import { runSyncEngines, type PausableSyncEngine } from "./sync-run";
import type { FitnessProgramUseCases } from "../application/fitness/program";
import type { FitnessWorkoutUseCases } from "../application/fitness/workout";
import type { BookQuoteUseCases } from "../application/books/book-quotes";
import type { MovieQuoteUseCases } from "../application/movies/movie-quotes";
import { createReadingSettings, type ReadingSettingsUseCases } from "../application/books/reading-settings";
import { createItemUseCases, type ItemUseCases } from "../application/items";
import { createIndexedDbReadingGoalRepository } from "../adapters/indexeddb/reading-goal-repository";
import { createSearchUseCase, type SearchUseCase } from "../application/search";
import type { AuthGateway } from "../application/ports/auth-gateway";
import type { Unsubscribe } from "../application/ports/item-repository";
import { createSessionUseCases, type SessionUseCases } from "../application/session";
import { createSyncEngine } from "../application/sync/engine";
import { createSyncScheduler } from "../application/sync/scheduler";
import type { SuggestionsUseCases } from "../application/suggestions/use-cases";

export const MUNI_DB_NAME = "muni";
const SYNC_PULL_LIMIT = 100;

export type SyncStatusState = "idle" | "syncing" | "offline" | "paused";

export type ClientContext = {
  itemUseCases: ItemUseCases;
  bookQuoteUseCases: BookQuoteUseCases;
  movieQuoteUseCases: MovieQuoteUseCases;
  readingSettingsUseCases: ReadingSettingsUseCases;
  fitnessProgramUseCases: FitnessProgramUseCases;
  fitnessWorkoutUseCases: FitnessWorkoutUseCases;
  cookbookUseCases: CookbookUseCases;
  ensureFitnessCatalogSeeded(): Promise<void>;
  searchUseCase: SearchUseCase;
  sessionUseCases: SessionUseCases;
  suggestionsUseCases: SuggestionsUseCases;
  authGateway: AuthGateway;
  subscribeSyncStatus(listener: (state: SyncStatusState) => void): Unsubscribe;
};

let clientContext: Promise<ClientContext> | undefined;
let syncStatus: SyncStatusState = "idle";
const syncStatusListeners = new Set<(state: SyncStatusState) => void>();
let syncScheduler: ReturnType<typeof createSyncScheduler> | undefined;
let syncEngine: ReturnType<typeof createSyncEngine> | undefined;
let bookQuotesSyncEngine: PausableSyncEngine | undefined;
let movieQuotesSyncEngine: PausableSyncEngine | undefined;
let fitnessSyncEngine: PausableSyncEngine | undefined;
let cookbookSyncEngine: PausableSyncEngine | undefined;
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
    createRecipe: after(items.createRecipe),
    updateRecipe: after(items.updateRecipe),
    deleteItem: after(items.deleteItem),
    restoreItem: after(items.restoreItem),
    upsertBookFromCatalog: after(items.upsertBookFromCatalog),
    upsertMovieFromCatalog: after(items.upsertMovieFromCatalog),
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

    const idGenerator = createUuidIdGenerator();
    const nowMs = () => Date.now();

    const notifyLocalWrite = () => syncScheduler?.notifyLocalWrite();

    const cookbookSync = wireClientCookbookSync({
      db,
      items: repository,
      pullLimit: SYNC_PULL_LIMIT,
      onLocalWrite: notifyLocalWrite,
    });
    cookbookSyncEngine = cookbookSync.cookbookEngine;

    const itemUseCasesWithCookbooks = createItemUseCases({
      repository,
      idGenerator,
      now: nowMs,
      cookbooks: cookbookSync.cookbookUseCases,
    });

    syncEngine = createSyncEngine({
      repository,
      remote,
      items: itemUseCasesWithCookbooks,
      pullLimit: SYNC_PULL_LIMIT,
      now: nowMs,
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    });

    const quoteSync = wireClientQuoteSync({
      db,
      items: repository,
      pullLimit: SYNC_PULL_LIMIT,
      onLocalWrite: notifyLocalWrite,
    });
    bookQuotesSyncEngine = quoteSync.bookQuotesEngine;
    movieQuotesSyncEngine = quoteSync.movieQuotesEngine;

    const fitnessSync = wireClientFitnessSync({
      db,
      items: repository,
      pullLimit: SYNC_PULL_LIMIT,
      onLocalWrite: notifyLocalWrite,
    });
    fitnessSyncEngine = fitnessSync.fitnessEngine;

    async function runSync(): Promise<void> {
      const cookbookEngine = cookbookSyncEngine;
      const engine = syncEngine;
      const quoteEngine = bookQuotesSyncEngine;
      const movieQuoteEngine = movieQuotesSyncEngine;
      const fitnessEngine = fitnessSyncEngine;
      if (
        cookbookEngine === undefined ||
        engine === undefined ||
        quoteEngine === undefined ||
        movieQuoteEngine === undefined ||
        fitnessEngine === undefined
      ) {
        return;
      }
      await runSyncEngines({
        engines: [cookbookEngine, engine, quoteEngine, movieQuoteEngine, fitnessEngine],
        connectivity,
        onStatus: publishSyncStatus,
        onPauseScheduler: () => syncScheduler?.pause(),
      });
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

    const itemUseCases = wrapLocalWrites(itemUseCasesWithCookbooks, notifyLocalWrite);
    const { bookQuoteUseCases, movieQuoteUseCases } = quoteSync;
    const { programUseCases: fitnessProgramUseCases, workoutUseCases: fitnessWorkoutUseCases } =
      fitnessSync;

    const searchUseCase = createSearchUseCase({
      repository,
      cookbooks: cookbookSync.cookbookUseCases,
    });

    const readingSettingsUseCases = createReadingSettings({
      repository: createIndexedDbReadingGoalRepository(repository.meta),
      now: () => Date.now(),
    });

    const sessionUseCases = createSessionUseCases({
      gateway: authGateway,
      meta: repository.meta,
      connectivity,
    });

    const { suggestionsUseCases } = wireClientSuggestions({
      db,
      items: repository,
      idGenerator,
      now: nowMs,
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
      bookQuoteUseCases,
      movieQuoteUseCases,
      readingSettingsUseCases,
      fitnessProgramUseCases,
      fitnessWorkoutUseCases,
      cookbookUseCases: cookbookSync.cookbookUseCases,
      ensureFitnessCatalogSeeded: () => fitnessSync.ensureCatalogSeeded(),
      searchUseCase,
      sessionUseCases: wrappedSession,
      suggestionsUseCases,
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

export function getBookQuoteUseCases(): Promise<BookQuoteUseCases> {
  return getClientContext().then((ctx) => ctx.bookQuoteUseCases);
}

export function getMovieQuoteUseCases(): Promise<MovieQuoteUseCases> {
  return getClientContext().then((ctx) => ctx.movieQuoteUseCases);
}

export function getReadingSettingsUseCases(): Promise<ReadingSettingsUseCases> {
  return getClientContext().then((ctx) => ctx.readingSettingsUseCases);
}

export function getFitnessProgramUseCases(): Promise<FitnessProgramUseCases> {
  return getClientContext().then((ctx) => ctx.fitnessProgramUseCases);
}

export function getFitnessWorkoutUseCases(): Promise<FitnessWorkoutUseCases> {
  return getClientContext().then((ctx) => ctx.fitnessWorkoutUseCases);
}

export function getCookbookUseCases(): Promise<CookbookUseCases> {
  return getClientContext().then((ctx) => ctx.cookbookUseCases);
}

export function ensureFitnessCatalogSeeded(): Promise<void> {
  return getClientContext().then((ctx) => ctx.ensureFitnessCatalogSeeded());
}

export function getSearchUseCase(): Promise<SearchUseCase> {
  return getClientContext().then((ctx) => ctx.searchUseCase);
}

export function getSessionUseCases(): Promise<SessionUseCases> {
  return getClientContext().then((ctx) => ctx.sessionUseCases);
}

export function getSuggestionsUseCases(): Promise<SuggestionsUseCases> {
  return getClientContext().then((ctx) => ctx.suggestionsUseCases);
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
    cookbookSyncEngine?.resume();
    bookQuotesSyncEngine?.resume();
    movieQuotesSyncEngine?.resume();
    fitnessSyncEngine?.resume();
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
