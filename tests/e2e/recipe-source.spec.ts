import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { openItem, openQuickAdd, signIn, submitQuickAdd } from "./list-helpers";

test("add recipe with cookbook source and page", async ({ page }) => {
  await signIn(page);
  await openQuickAdd(page, "recipe");
  await page.getByLabel(fr["field.title"]).fill("Crêpes");
  await page.getByText(fr["recipe.source.section"]).click();
  await page.getByLabel(fr["recipe.source.cookbook"]).fill("Grand Livre");
  await page
    .getByRole("option", { name: fr["recipe.source.create"].replace("{query}", "Grand Livre") })
    .click();
  await page.getByLabel(fr["recipe.source.page"]).fill("42");
  await submitQuickAdd(page);
  await openItem(page, "Crêpes");
  await expect(page.getByLabel(fr["recipe.source.cookbook"])).toHaveValue("Grand Livre");
  await expect(page.getByLabel(fr["recipe.source.page"])).toHaveValue("42");
});

test("search finds recipes by cookbook title", async ({ page }) => {
  await signIn(page);
  await openQuickAdd(page, "recipe");
  await page.getByLabel(fr["field.title"]).fill("Tarte A");
  await page.getByText(fr["recipe.source.section"]).click();
  await page.getByLabel(fr["recipe.source.cookbook"]).fill("Desserts faciles");
  await page
    .getByRole("option", {
      name: fr["recipe.source.create"].replace("{query}", "Desserts faciles"),
    })
    .click();
  await submitQuickAdd(page);

  await openQuickAdd(page, "recipe");
  await page.getByLabel(fr["field.title"]).fill("Tarte B");
  await page.getByText(fr["recipe.source.section"]).click();
  await page.getByLabel(fr["recipe.source.cookbook"]).fill("Desserts");
  await page.getByRole("option", { name: "Desserts faciles" }).click();
  await submitQuickAdd(page);

  await page.goto("/search");
  await page.getByPlaceholder(fr["search.placeholder"]).fill("dessert");
  await expect(page.getByRole("link", { name: "Tarte A" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tarte B" })).toBeVisible();
});
