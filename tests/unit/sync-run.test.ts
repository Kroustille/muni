import { describe, expect, it, vi } from "vitest";

import type { Connectivity } from "@/application/ports/connectivity";
import { runSyncEngines, type PausableSyncEngine } from "@/composition/sync-run";

const online: Connectivity = {
  isOnline: () => true,
  onChange: () => () => undefined,
} as unknown as Connectivity;

function engine(run: () => Promise<unknown>, paused = false): PausableSyncEngine {
  return { run: vi.fn(run), paused, resume: vi.fn() };
}

describe("runSyncEngines", () => {
  it("keeps running later engines when an earlier one fails", async () => {
    const failing = engine(() => Promise.reject(new Error("403")));
    const items = engine(() => Promise.resolve());
    const quotes = engine(() => Promise.resolve());
    const onStatus = vi.fn();

    await runSyncEngines({
      engines: [failing, items, quotes],
      connectivity: online,
      onStatus,
      onPauseScheduler: vi.fn(),
    });

    expect(items.run).toHaveBeenCalledTimes(1);
    expect(quotes.run).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenLastCalledWith("idle");
  });

  it("pauses the scheduler when an engine is paused", async () => {
    const paused = engine(() => Promise.resolve(), true);
    const onPauseScheduler = vi.fn();
    const onStatus = vi.fn();

    await runSyncEngines({
      engines: [paused, engine(() => Promise.resolve())],
      connectivity: online,
      onStatus,
      onPauseScheduler,
    });

    expect(onPauseScheduler).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenLastCalledWith("paused");
  });
});
