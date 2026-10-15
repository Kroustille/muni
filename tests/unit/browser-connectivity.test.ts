import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createBrowserConnectivity } from "@/adapters/browser/connectivity";

describe("browser Connectivity adapter", () => {
  const listeners = new Map<string, Set<EventListener>>();
  const navigatorState = { onLine: true };

  beforeEach(() => {
    listeners.clear();
    navigatorState.onLine = true;
    vi.stubGlobal("navigator", navigatorState);
    vi.stubGlobal("window", {
      addEventListener(type: string, listener: EventListener) {
        const set = listeners.get(type) ?? new Set<EventListener>();
        set.add(listener);
        listeners.set(type, set);
      },
      removeEventListener(type: string, listener: EventListener) {
        listeners.get(type)?.delete(listener);
      },
    });
    vi.stubGlobal("document", {
      visibilityState: "visible",
      addEventListener(type: string, listener: EventListener) {
        const set = listeners.get(type) ?? new Set<EventListener>();
        set.add(listener);
        listeners.set(type, set);
      },
      removeEventListener(type: string, listener: EventListener) {
        listeners.get(type)?.delete(listener);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function dispatch(type: string): void {
    const event = new Event(type);
    for (const listener of listeners.get(type) ?? []) listener(event);
  }

  it("reports navigator.onLine", () => {
    const connectivity = createBrowserConnectivity();
    expect(connectivity.isOnline()).toBe(true);
    navigatorState.onLine = false;
    expect(connectivity.isOnline()).toBe(false);
  });

  it("notifies listeners when the browser goes online", () => {
    const connectivity = createBrowserConnectivity();
    const states: boolean[] = [];
    connectivity.onChange((online) => states.push(online));
    navigatorState.onLine = true;
    dispatch("online");
    expect(states).toEqual([true]);
  });

  it("notifies listeners when the browser goes offline", () => {
    const connectivity = createBrowserConnectivity();
    const states: boolean[] = [];
    connectivity.onChange((online) => states.push(online));
    navigatorState.onLine = false;
    dispatch("offline");
    expect(states).toEqual([false]);
  });

  it("notifies listeners on visibility changes with the current online state", () => {
    const connectivity = createBrowserConnectivity();
    const states: boolean[] = [];
    connectivity.onChange((online) => states.push(online));
    navigatorState.onLine = true;
    dispatch("visibilitychange");
    navigatorState.onLine = false;
    dispatch("visibilitychange");
    expect(states).toEqual([true, false]);
  });

  it("unsubscribes from window and document events", () => {
    const connectivity = createBrowserConnectivity();
    const states: boolean[] = [];
    const unsubscribe = connectivity.onChange((online) => states.push(online));
    unsubscribe();
    dispatch("online");
    dispatch("visibilitychange");
    expect(states).toEqual([]);
  });
});
