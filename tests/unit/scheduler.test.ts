import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Connectivity } from "@/application/ports/connectivity";
import { createSyncScheduler } from "@/application/sync/scheduler";

const SYNC_INTERVAL_MS = 60_000;
const LOCAL_WRITE_DEBOUNCE_MS = 2_000;

type FakeConnectivity = Connectivity & {
  setOnline(online: boolean): void;
};

function createFakeConnectivity(initialOnline = true): FakeConnectivity {
  let online = initialOnline;
  const listeners = new Set<(value: boolean) => void>();
  return {
    isOnline: () => online,
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setOnline(value) {
      if (value === online) return;
      online = value;
      for (const listener of [...listeners]) listener(online);
    },
  };
}

type FakeDocument = Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener"> & {
  setVisibility(state: DocumentVisibilityState): void;
};

function createFakeDocument(initial: DocumentVisibilityState = "visible"): FakeDocument {
  let visibilityState = initial;
  const listeners = new Map<string, Set<EventListener>>();
  return {
    visibilityState,
    addEventListener(type, listener) {
      const set = listeners.get(type) ?? new Set<EventListener>();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    setVisibility(state) {
      visibilityState = state;
      Object.defineProperty(this, "visibilityState", { value: state, configurable: true });
      for (const listener of listeners.get("visibilitychange") ?? []) {
        listener(new Event("visibilitychange"));
      }
    },
  };
}

describe("sync scheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(options?: { online?: boolean; visibility?: DocumentVisibilityState }) {
    const connectivity = createFakeConnectivity(options?.online ?? true);
    const document = createFakeDocument(options?.visibility ?? "visible");
    const runSync = vi.fn(async () => {});
    const scheduler = createSyncScheduler({ connectivity, runSync, document });
    return { connectivity, document, runSync, scheduler };
  }

  it("runs sync on start when online", () => {
    const { runSync, scheduler } = setup({ online: true });
    scheduler.start();
    expect(runSync).toHaveBeenCalledTimes(1);
  });

  it("does not run sync on start when offline", () => {
    const { runSync, scheduler } = setup({ online: false });
    scheduler.start();
    expect(runSync).not.toHaveBeenCalled();
  });

  it("runs sync when connectivity becomes online", () => {
    const { connectivity, runSync, scheduler } = setup({ online: false });
    scheduler.start();
    connectivity.setOnline(true);
    expect(runSync).toHaveBeenCalledTimes(1);
  });

  it("runs sync when the document becomes visible", () => {
    const { document, runSync, scheduler } = setup({ visibility: "hidden" });
    scheduler.start();
    runSync.mockClear();
    document.setVisibility("visible");
    expect(runSync).toHaveBeenCalledTimes(1);
  });

  it("runs sync every 60 seconds while online", () => {
    const { runSync, scheduler } = setup({ online: true });
    scheduler.start();
    expect(runSync).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    expect(runSync).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    expect(runSync).toHaveBeenCalledTimes(3);
  });

  it("debounces sync about 2 seconds after local writes", () => {
    const { runSync, scheduler } = setup({ online: true });
    scheduler.start();
    runSync.mockClear();
    scheduler.notifyLocalWrite();
    scheduler.notifyLocalWrite();
    expect(runSync).not.toHaveBeenCalled();
    vi.advanceTimersByTime(LOCAL_WRITE_DEBOUNCE_MS - 1);
    expect(runSync).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(runSync).toHaveBeenCalledTimes(1);
  });

  it("does not run periodic or debounced sync while offline", () => {
    const { connectivity, runSync, scheduler } = setup({ online: true });
    scheduler.start();
    runSync.mockClear();
    connectivity.setOnline(false);
    scheduler.notifyLocalWrite();
    vi.advanceTimersByTime(LOCAL_WRITE_DEBOUNCE_MS);
    vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    expect(runSync).not.toHaveBeenCalled();
  });

  it("does not run sync while paused", () => {
    const { runSync, scheduler } = setup({ online: true });
    scheduler.start();
    runSync.mockClear();
    scheduler.pause();
    scheduler.notifyLocalWrite();
    vi.advanceTimersByTime(LOCAL_WRITE_DEBOUNCE_MS);
    vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    expect(runSync).not.toHaveBeenCalled();
  });

  it("resumes sync after pause when resumed and triggered", () => {
    const { runSync, scheduler } = setup({ online: true });
    scheduler.start();
    runSync.mockClear();
    scheduler.pause();
    scheduler.resume();
    scheduler.notifyLocalWrite();
    vi.advanceTimersByTime(LOCAL_WRITE_DEBOUNCE_MS);
    expect(runSync).toHaveBeenCalledTimes(1);
  });

  it("stops timers and listeners on stop", () => {
    const { runSync, scheduler } = setup({ online: true });
    scheduler.start();
    runSync.mockClear();
    scheduler.stop();
    scheduler.notifyLocalWrite();
    vi.advanceTimersByTime(LOCAL_WRITE_DEBOUNCE_MS + SYNC_INTERVAL_MS);
    expect(runSync).not.toHaveBeenCalled();
  });
});
