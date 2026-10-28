import { describe, expect, it } from "vitest";

import { isValidCookedDate, validateCookedDatesForRecipe } from "@/domain/item-recipe";
import { newItem, updateItem } from "@/domain/item";
import { recordRecipeCooked } from "@/application/recipes/record-cooked";
import { InMemoryItemRepository } from "../../helpers/in-memory-item-repository";
import { makeItem } from "../../helpers/item-repository.contract";

describe("recipe cookedDates", () => {
  it("rejects invalid calendar dates", () => {
    expect(isValidCookedDate("2026-02-30")).toBe(false);
    expect(isValidCookedDate("bad")).toBe(false);
  });

  it("validates recipe cookedDates array", () => {
    expect(validateCookedDatesForRecipe("recipe", ["2026-03-01"])).toEqual(["2026-03-01"]);
    expect(() => validateCookedDatesForRecipe("book", ["2026-03-01"])).toThrow();
  });

  it("recordRecipeCooked dedupes same day", async () => {
    const repo = new InMemoryItemRepository();
    const recipe = makeItem({ type: "recipe", status: null, cookedDates: ["2026-03-10"] });
    await repo.put(recipe, { enqueue: false });
    const result = await recordRecipeCooked(repo, { itemId: recipe.id, cookedOn: "2026-03-10" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.item.cookedDates).toEqual(["2026-03-10"]);
    }
  });

  it("recordRecipeCooked appends backdated cook", async () => {
    const repo = new InMemoryItemRepository();
    const recipe = makeItem({ type: "recipe", status: null });
    await repo.put(recipe, { enqueue: false });
    const result = await recordRecipeCooked(repo, { itemId: recipe.id, cookedOn: "2026-01-05" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.item.cookedDates).toEqual(["2026-01-05"]);
    }
  });

  it("excludes deleted recipes from having cooks applied", async () => {
    const repo = new InMemoryItemRepository();
    let recipe = makeItem({ type: "recipe", status: null });
    recipe = updateItem(recipe, { deletedAt: "2026-01-01T00:00:00.000Z" });
    await repo.put(recipe, { enqueue: false });
    const result = await recordRecipeCooked(repo, { itemId: recipe.id, cookedOn: "2026-01-05" });
    expect(result).toEqual({ ok: false, error: "not_recipe" });
  });

  it("persists cookedDates on item domain shape", () => {
    const item = newItem({
      id: "00000000-0000-4000-8000-000000000001",
      type: "recipe",
      title: "Soup",
      createdAt: "2026-01-01T00:00:00.000Z",
      cookedDates: ["2026-02-01"],
    });
    expect(item.cookedDates).toEqual(["2026-02-01"]);
  });
});
