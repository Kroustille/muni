import type { Item, ItemStatus, ItemType } from "../../domain/item";
import type { ReadingGoal } from "../../domain/reading-goal";

export type ItemQuery = {
  type?: ItemType;
  status?: ItemStatus;
  includeDeleted?: boolean;
};

export type MetaValues = {
  deviceId: string;
  hlcState: string;
  userId: string;
  pullCursor: string;
<<<<<<< HEAD
  quotePullCursor: string;
=======
  readingGoals: ReadingGoal[];
>>>>>>> bd5c4f0 (feat(002): T334 reading goal settings and repositories)
};

export type MetaKey = keyof MetaValues;

export interface MetaStore {
  get<K extends MetaKey>(key: K): Promise<MetaValues[K] | undefined>;
  set<K extends MetaKey>(key: K, value: MetaValues[K]): Promise<void>;
}

export type Unsubscribe = () => void;

export interface ItemRepository {
  get(id: string): Promise<Item | undefined>;
  put(item: Item, options: { enqueue: boolean }): Promise<void>;
  query(query?: ItemQuery): Promise<Item[]>;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
  readonly meta: MetaStore;
  subscribe(listener: () => void): Unsubscribe;
}
