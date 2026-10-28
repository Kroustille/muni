import type { CookbookWire } from "@/domain/cookbook";

export type CookbookPullResult = {
  cookbooks: CookbookWire[];
  cursor: string;
};

export interface CookbookRemoteStore {
  push(cookbooks: CookbookWire[]): Promise<CookbookWire[]>;
  pull(since: string | null, limit: number): Promise<CookbookPullResult>;
}
