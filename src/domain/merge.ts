import { compareHlc } from "./clock";
import type { ItemWire } from "./item";

const MERGED_FIELDS = [
  "title",
  "author",
  "status",
  "recommended_by",
  "rating",
  "notes",
  "quantity",
  "checked",
  "ingredients",
  "steps",
  "deleted_at",
] as const satisfies readonly (keyof ItemWire)[];

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

export function merge(local: ItemWire, remote: ItemWire): ItemWire {
  const result = structuredClone(local) as Record<string, unknown>;
  const timestamps: Record<string, string> = {};

  for (const field of MERGED_FIELDS) {
    const l = local.fields_updated_at[field];
    const r = remote.fields_updated_at[field];
    let remoteWins: boolean;
    if (l !== undefined && r !== undefined) {
      const order = compareHlc(l, r);
      remoteWins = order !== 0 ? order < 0 : compareValues(local[field], remote[field]) < 0;
    } else if (l === undefined && r === undefined) {
      remoteWins = compareValues(local[field], remote[field]) < 0;
    } else {
      remoteWins = l === undefined;
    }
    const winner = remoteWins ? remote : local;
    result[field] = structuredClone(winner[field]);
    const stamp = winner.fields_updated_at[field];
    if (stamp !== undefined) timestamps[field] = stamp;
  }

  for (const [key, value] of [
    ...Object.entries(local.fields_updated_at),
    ...Object.entries(remote.fields_updated_at),
  ]) {
    if (!(MERGED_FIELDS as readonly string[]).includes(key)) {
      const current = timestamps[key];
      if (current === undefined || compareHlc(value, current) > 0) timestamps[key] = value;
    }
  }

  result.fields_updated_at = timestamps;
  result.server_updated_at = laterNonNull(local.server_updated_at, remote.server_updated_at);
  return result as ItemWire;
}
