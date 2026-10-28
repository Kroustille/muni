import { isValidCookedDate } from "@/domain/item-recipe";
import { updateItem, type Item } from "@/domain/item";
import type { ItemRepository } from "@/application/ports/item-repository";
import { localTodayDateKey } from "@/application/recap/period";

export type RecordRecipeCookedInput = {
  itemId: string;
  cookedOn?: string;
  timeZone?: string;
};

export type RecordRecipeCookedResult =
  | { ok: true; item: Item }
  | { ok: false; error: "not_found" | "not_recipe" | "invalid_date" | "future_date" };

export async function recordRecipeCooked(
  repo: ItemRepository,
  input: RecordRecipeCookedInput,
): Promise<RecordRecipeCookedResult> {
  const item = await repo.get(input.itemId);
  if (item == null) return { ok: false, error: "not_found" };
  if (item.type !== "recipe" || item.deletedAt != null) return { ok: false, error: "not_recipe" };

  const timeZone = input.timeZone ?? "Europe/Paris";
  const cookedOn = input.cookedOn ?? localTodayDateKey(timeZone);
  if (!isValidCookedDate(cookedOn)) return { ok: false, error: "invalid_date" };
  const today = localTodayDateKey(timeZone);
  if (cookedOn > today) return { ok: false, error: "future_date" };

  const existing = item.cookedDates ?? [];
  if (existing.includes(cookedOn)) {
    return { ok: true, item };
  }

  const stamp = new Date().toISOString();
  const nextDates = [...existing, cookedOn];
  const updated = updateItem(item, {
    cookedDates: nextDates,
    fieldsUpdatedAt: { ...item.fieldsUpdatedAt, cookedDates: stamp },
  });
  await repo.put(updated, { enqueue: true });
  return { ok: true, item: updated };
}
