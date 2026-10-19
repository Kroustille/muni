import { compareHlc } from "@/domain/clock";

function compareValues(a: unknown, b: unknown): number {
  const x = JSON.stringify(a);
  const y = JSON.stringify(b);
  if (x === y) return 0;
  return x < y ? -1 : 1;
}

function laterNonNull(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return a >= b ? a : b;
}

export function mergeLwwWire<T extends Record<string, unknown>>(
  local: T,
  remote: T,
  mergedFields: readonly (keyof T)[],
): T {
  const result = structuredClone(local) as Record<string, unknown>;
  const localTs = local.fields_updated_at as Record<string, string>;
  const remoteTs = remote.fields_updated_at as Record<string, string>;
  const timestamps: Record<string, string> = {};

  for (const field of mergedFields) {
    const key = field as string;
    const l = localTs[key];
    const r = remoteTs[key];
    let remoteWins: boolean;
    if (l !== undefined && r !== undefined) {
      const order = compareHlc(l, r);
      remoteWins = order !== 0 ? order < 0 : compareValues(local[key], remote[key]) < 0;
    } else if (l === undefined && r === undefined) {
      remoteWins = compareValues(local[key], remote[key]) < 0;
    } else {
      remoteWins = l === undefined;
    }
    const winner = remoteWins ? remote : local;
    result[key] = structuredClone(winner[key]);
    const stamp = (winner.fields_updated_at as Record<string, string>)[key];
    if (stamp !== undefined) timestamps[key] = stamp;
  }

  for (const [key, value] of [...Object.entries(localTs), ...Object.entries(remoteTs)]) {
    if (!(mergedFields as readonly string[]).includes(key)) {
      const current = timestamps[key];
      if (current === undefined || compareHlc(value, current) > 0) timestamps[key] = value;
    }
  }

  result.fields_updated_at = timestamps;
  result.server_updated_at = laterNonNull(
    (local.server_updated_at as string | null | undefined) ?? null,
    (remote.server_updated_at as string | null | undefined) ?? null,
  );
  return result as T;
}
