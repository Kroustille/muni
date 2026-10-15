import type { ItemWire } from "../../domain/item";

export type { ItemWire };

export type RowError = { id?: string; index?: number; message: string };

export type RemoteStoreErrorKind = "unauthenticated" | "validation" | "network";

export class RemoteStoreError extends Error {
  constructor(
    readonly kind: RemoteStoreErrorKind,
    readonly rowErrors: RowError[] = [],
    message: string = kind,
  ) {
    super(message);
    this.name = "RemoteStoreError";
  }
}

export type PullResult = { items: ItemWire[]; cursor: string };

export interface RemoteStore {
  push(items: ItemWire[]): Promise<ItemWire[]>;
  pull(since: string | null, limit: number): Promise<PullResult>;
}
