import type { Item } from "../../src/domain/item";
import type {
  ItemQuery,
  ItemRepository,
  MetaKey,
  MetaStore,
  MetaValues,
  Unsubscribe,
} from "../../src/application/ports/item-repository";

export class InMemoryItemRepository implements ItemRepository {
  private readonly items = new Map<string, Item>();
  private readonly pending = new Set<string>();
  private readonly listeners = new Set<() => void>();
  private readonly metaValues = new Map<MetaKey, string>();

  readonly meta: MetaStore = {
    get: async <K extends MetaKey>(key: K) => this.metaValues.get(key) as MetaValues[K] | undefined,
    set: async <K extends MetaKey>(key: K, value: MetaValues[K]) => {
      this.metaValues.set(key, value);
    },
  };

  async get(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async put(item: Item, options: { enqueue: boolean }): Promise<void> {
    this.items.set(item.id, item);
    if (options.enqueue) this.pending.add(item.id);
    for (const listener of [...this.listeners]) listener();
  }

  async query(query: ItemQuery = {}): Promise<Item[]> {
    return [...this.items.values()].filter(
      (item) =>
        (query.includeDeleted || item.deletedAt === null) &&
        (query.type === undefined || item.type === query.type) &&
        (query.status === undefined || item.status === query.status),
    );
  }

  async outbox(): Promise<string[]> {
    return [...this.pending];
  }

  async clearOutbox(ids: string[]): Promise<void> {
    for (const id of ids) this.pending.delete(id);
  }

  subscribe(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
