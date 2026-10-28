import type { Cookbook } from "@/domain/cookbook";

export type Unsubscribe = () => void;

export interface CookbookRepository {
  get(id: string): Promise<Cookbook | undefined>;
  listAll(): Promise<Cookbook[]>;
  upsert(cookbook: Cookbook, options?: { enqueue?: boolean }): Promise<Cookbook>;
  softDelete(id: string): Promise<void>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerCookbookRepository {
  transaction<T>(fn: (repo: ServerCookbookRepository) => Promise<T>): Promise<T>;

  findByIds(userId: string, ids: string[]): Promise<Cookbook[]>;

  upsert(userId: string, cookbook: Cookbook): Promise<Cookbook>;

  pullSince(userId: string, since: Date | null, limit: number): Promise<Cookbook[]>;
}
