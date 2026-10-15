export type Hlc = {
  readonly wallMs: number;
  readonly counter: number;
  readonly deviceId: string;
};

export function formatHlc(hlc: Hlc): string {
  return `${hlc.wallMs}-${hlc.counter}-${hlc.deviceId}`;
}

export function parseHlc(value: string): Hlc {
  const first = value.indexOf("-");
  const second = first < 0 ? -1 : value.indexOf("-", first + 1);
  if (first < 0 || second < 0) throw new Error(`Malformed HLC timestamp: "${value}"`);
  const wall = value.slice(0, first);
  const counter = value.slice(first + 1, second);
  const deviceId = value.slice(second + 1);
  if (!/^\d+$/.test(wall) || !/^\d+$/.test(counter) || deviceId.length === 0) {
    throw new Error(`Malformed HLC timestamp: "${value}"`);
  }
  return { wallMs: Number(wall), counter: Number(counter), deviceId };
}

export function compareHlc(a: string, b: string): number {
  const x = parseHlc(a);
  const y = parseHlc(b);
  if (x.wallMs !== y.wallMs) return x.wallMs < y.wallMs ? -1 : 1;
  if (x.counter !== y.counter) return x.counter < y.counter ? -1 : 1;
  if (x.deviceId === y.deviceId) return 0;
  return x.deviceId < y.deviceId ? -1 : 1;
}

export function tickHlc(prev: Hlc | null, deviceId: string, nowMs: number): Hlc {
  if (prev === null || nowMs > prev.wallMs) return { wallMs: nowMs, counter: 0, deviceId };
  return { wallMs: prev.wallMs, counter: prev.counter + 1, deviceId };
}

export function receiveHlc(
  local: Hlc | null,
  remote: string,
  deviceId: string,
  nowMs: number,
): Hlc {
  const r = parseHlc(remote);
  const localWall = local?.wallMs ?? -1;
  const wallMs = Math.max(localWall, r.wallMs, nowMs);
  const counters: number[] = [];
  if (local && local.wallMs === wallMs) counters.push(local.counter);
  if (r.wallMs === wallMs) counters.push(r.counter);
  const counter = counters.length === 0 ? 0 : Math.max(...counters) + 1;
  return { wallMs, counter, deviceId };
}
