import { createHttpAuthGateway } from "../adapters/http/auth-gateway";
import { createUuidIdGenerator } from "../adapters/browser/id-generator";
import { openMuniDb } from "../adapters/indexeddb/db";
import { createIndexedDbItemRepository } from "../adapters/indexeddb/item-repository";
import { createItemUseCases, type ItemUseCases } from "../application/items";
import type { AuthGateway } from "../application/ports/auth-gateway";
import type { Connectivity } from "../application/ports/connectivity";
import { createSessionUseCases, type SessionUseCases } from "../application/session";

export const MUNI_DB_NAME = "muni";

export type ClientContext = {
  itemUseCases: ItemUseCases;
  sessionUseCases: SessionUseCases;
  authGateway: AuthGateway;
};

let clientContext: Promise<ClientContext> | undefined;

function createBrowserConnectivity(): Connectivity {
  return {
    isOnline() {
      return typeof navigator !== "undefined" ? navigator.onLine : true;
    },
    onChange(listener) {
      if (typeof window === "undefined") return () => {};
      const handler = () => listener(navigator.onLine);
      window.addEventListener("online", handler);
      window.addEventListener("offline", handler);
      return () => {
        window.removeEventListener("online", handler);
        window.removeEventListener("offline", handler);
      };
    },
  };
}

function buildClientContext(): Promise<ClientContext> {
  return openMuniDb(MUNI_DB_NAME).then((db) => {
    const repository = createIndexedDbItemRepository(db);
    const authGateway = createHttpAuthGateway({
      fetch: globalThis.fetch.bind(globalThis),
      baseUrl: "",
      navigate: (url) => {
        window.location.assign(url);
      },
    });
    const sessionUseCases = createSessionUseCases({
      gateway: authGateway,
      meta: repository.meta,
      connectivity: createBrowserConnectivity(),
    });
    const itemUseCases = createItemUseCases({
      repository,
      idGenerator: createUuidIdGenerator(),
      now: () => Date.now(),
    });
    return { itemUseCases, sessionUseCases, authGateway };
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

export function getSessionUseCases(): Promise<SessionUseCases> {
  return getClientContext().then((ctx) => ctx.sessionUseCases);
}

export function getAuthGateway(): Promise<AuthGateway> {
  return getClientContext().then((ctx) => ctx.authGateway);
}
