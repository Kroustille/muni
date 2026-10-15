import type { ItemWire } from "../../domain/item";

export type { ItemWire };

/**
 * Per-user item persistence for the server sync service.
 * Every data method is scoped by `userId`; `findByIds` acquires row locks and must run
 * inside `transaction`.
 */
export interface ServerItemRepository {
  transaction<T>(fn: (repo: ServerItemRepository) => Promise<T>): Promise<T>;

  /** `(user_id, id)` row locks for the given ids; omits missing rows. */
  findByIds(userId: string, ids: string[]): Promise<ItemWire[]>;

  upsert(userId: string, rows: ItemWire[]): Promise<void>;

  /** Ascending by `server_updated_at`, including soft-deleted rows. */
  listSince(userId: string, since: string | null, limit: number): Promise<ItemWire[]>;
}
