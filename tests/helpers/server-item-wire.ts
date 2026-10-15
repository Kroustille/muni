import { itemToWire, updateItem, type ItemPatch, type ItemWire, type NewItemInput } from "@/domain/item";
import { makeItem } from "./item-repository.contract";

export const TEST_DEVICE_ID = "device-pg-items";

export function testHlc(wallMs: number, counter = 0, deviceId = TEST_DEVICE_ID): string {
  return `${wallMs}-${counter}-${deviceId}`;
}

export function isoAt(offsetMs: number, base = Date.parse("2026-01-01T12:00:00.000Z")): string {
  return new Date(base + offsetMs).toISOString();
}

export type ServerItemWireInput = {
  id?: string;
  serverUpdatedAt?: string | null;
  item?: Partial<NewItemInput>;
  patch?: ItemPatch;
};

/** Builds a domain-valid `ItemWire` for server repository integration tests. */
export function makeServerItemWire(input: ServerItemWireInput = {}): ItemWire {
  let item = makeItem({ ...(input.item ?? {}), ...(input.id ? { id: input.id } : {}) });
  if (input.patch) {
    item = updateItem(item, input.patch);
  }
  return itemToWire(item, input.serverUpdatedAt ?? null);
}
