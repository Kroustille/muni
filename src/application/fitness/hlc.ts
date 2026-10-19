import { formatHlc, parseHlc, tickHlc, type Hlc } from "@/domain/clock";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";

export function createFitnessHlc(meta: MetaStore, idGenerator: IdGenerator, now: () => number) {
  async function deviceId(): Promise<string> {
    const existing = await meta.get("deviceId");
    if (existing !== undefined) return existing;
    const created = idGenerator.newId();
    await meta.set("deviceId", created);
    return created;
  }

  async function loadClock(): Promise<Hlc | null> {
    const state = await meta.get("hlcState");
    return state === undefined ? null : parseHlc(state);
  }

  return {
    async nextFieldStamp(): Promise<string> {
      const next = tickHlc(await loadClock(), await deviceId(), now());
      const stamp = formatHlc(next);
      await meta.set("hlcState", stamp);
      return stamp;
    },
  };
}
