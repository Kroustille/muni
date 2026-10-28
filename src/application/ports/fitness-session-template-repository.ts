import type { FitnessSessionTemplate } from "@/domain/fitness/session-template";

export type Unsubscribe = () => void;

export interface FitnessSessionTemplateRepository {
  get(id: string): Promise<FitnessSessionTemplate | undefined>;
  list(): Promise<FitnessSessionTemplate[]>;
  upsert(template: FitnessSessionTemplate, options?: { enqueue?: boolean }): Promise<FitnessSessionTemplate>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerFitnessSessionTemplateRepository {
  transaction<T>(fn: (repo: ServerFitnessSessionTemplateRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<FitnessSessionTemplate[]>;
  upsert(userId: string, template: FitnessSessionTemplate): Promise<FitnessSessionTemplate>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<FitnessSessionTemplate[]>;
}
