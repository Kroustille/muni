import { merge } from "../../src/domain/merge";
import { itemWireSchema, type ItemWire } from "../../src/domain/item";
import type { PullResult, RemoteStore, RowError } from "../../src/application/ports/remote-store";
import { RemoteStoreError } from "../../src/application/ports/remote-store";

function rowHasUserId(row: object): boolean {
  return Object.prototype.hasOwnProperty.call(row, "user_id");
}

function wiresEqual(a: ItemWire, b: ItemWire): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export class InMemoryRemoteStore implements RemoteStore {
  private readonly items = new Map<string, ItemWire>();
  private clock = 0;

  private nextServerUpdatedAt(): string {
    this.clock += 1;
    return new Date(Date.UTC(2026, 0, 1, 0, 0, this.clock)).toISOString();
  }

  /** Seeds server rows for integration scenarios (each row gets a `server_updated_at` if missing). */
  seed(rows: ItemWire[]): void {
    for (const row of rows) {
      this.items.set(row.id, {
        ...row,
        server_updated_at: row.server_updated_at ?? this.nextServerUpdatedAt(),
      });
    }
  }

  snapshot(): ItemWire[] {
    return [...this.items.values()];
  }

  async push(items: ItemWire[]): Promise<ItemWire[]> {
    const rowErrors: RowError[] = [];
    const planned: { id: string; merged: ItemWire }[] = [];

    for (let index = 0; index < items.length; index++) {
      const raw = items[index]!;
      if (rowHasUserId(raw)) {
        rowErrors.push({ index, id: raw.id, message: "user_id is not allowed" });
        continue;
      }
      const parsed = itemWireSchema.safeParse(raw);
      if (!parsed.success) {
        rowErrors.push({
          index,
          id: raw.id,
          message: parsed.error.issues.map((issue) => issue.message).join("; "),
        });
        continue;
      }
      const incoming = parsed.data;
      const existing = this.items.get(incoming.id);
      let merged: ItemWire;
      if (!existing) {
        merged = { ...incoming, server_updated_at: this.nextServerUpdatedAt() };
      } else {
        merged = merge(existing, incoming);
        if (!wiresEqual(merged, existing)) {
          merged = { ...merged, server_updated_at: this.nextServerUpdatedAt() };
        }
      }
      planned.push({ id: incoming.id, merged });
    }

    if (rowErrors.length > 0) {
      throw new RemoteStoreError("validation", rowErrors);
    }

    const results: ItemWire[] = [];
    for (const { id, merged } of planned) {
      this.items.set(id, merged);
      results.push(merged);
    }
    return results;
  }

  async pull(since: string | null, limit: number): Promise<PullResult> {
    const batch = [...this.items.values()]
      .filter((row) => {
        const updated = row.server_updated_at;
        if (!updated) return false;
        return since === null || updated > since;
      })
      .sort((a, b) => (a.server_updated_at ?? "").localeCompare(b.server_updated_at ?? ""))
      .slice(0, limit);

    const last = batch.at(-1);
    const cursor = last?.server_updated_at ?? since ?? "";
    return { items: batch, cursor };
  }
}
