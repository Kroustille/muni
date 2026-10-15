import type { ItemWire } from "../../src/domain/item";
import type { ServerItemRepository } from "../../src/application/ports/server-item-repository";

function rowKey(userId: string, id: string): string {
  return `${userId}\0${id}`;
}

function compareServerUpdatedAt(a: ItemWire, b: ItemWire): number {
  const left = a.server_updated_at ?? "";
  const right = b.server_updated_at ?? "";
  if (left === right) return a.id.localeCompare(b.id);
  return left.localeCompare(right);
}

export class InMemoryServerItemRepository implements ServerItemRepository {
  private readonly items = new Map<string, ItemWire>();
  private txDepth = 0;
  private snapshot: Map<string, ItemWire> | null = null;
  private readonly rowLocks = new Set<string>();
  private txChain: Promise<void> = Promise.resolve();

  async transaction<T>(fn: (repo: ServerItemRepository) => Promise<T>): Promise<T> {
    let release!: () => void;
    const gate = this.txChain;
    this.txChain = new Promise((resolve) => {
      release = resolve;
    });
    await gate;

    const outermost = this.txDepth === 0;
    if (outermost) this.snapshot = new Map(this.items);
    this.txDepth += 1;
    try {
      const result = await fn(this);
      if (outermost) this.snapshot = null;
      return result;
    } catch (error) {
      if (outermost && this.snapshot) {
        this.items.clear();
        for (const [key, row] of this.snapshot) this.items.set(key, row);
        this.snapshot = null;
      }
      throw error;
    } finally {
      this.txDepth -= 1;
      if (this.txDepth === 0) this.rowLocks.clear();
      release();
    }
  }

  async findByIds(userId: string, ids: string[]): Promise<ItemWire[]> {
    if (this.txDepth === 0) {
      throw new Error("findByIds must run inside transaction");
    }
    const rows: ItemWire[] = [];
    for (const id of ids) {
      const key = rowKey(userId, id);
      this.rowLocks.add(key);
      const row = this.items.get(key);
      if (row) rows.push({ ...row });
    }
    return rows;
  }

  async upsert(userId: string, rows: ItemWire[]): Promise<void> {
    for (const row of rows) {
      this.items.set(rowKey(userId, row.id), { ...row });
    }
  }

  async listSince(userId: string, since: string | null, limit: number): Promise<ItemWire[]> {
    const prefix = `${userId}\0`;
    const matches = [...this.items.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([, row]) => row)
      .filter(
        (row) =>
          since === null ||
          (row.server_updated_at !== null && row.server_updated_at > since),
      )
      .sort(compareServerUpdatedAt)
      .slice(0, limit)
      .map((row) => ({ ...row }));
    return matches;
  }

  /** Test helper: direct read without locks. */
  getRow(userId: string, id: string): ItemWire | undefined {
    const row = this.items.get(rowKey(userId, id));
    return row ? { ...row } : undefined;
  }
}
