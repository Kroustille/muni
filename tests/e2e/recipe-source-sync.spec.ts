import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { openQuickAdd, signIn, submitQuickAdd } from "./capture.spec";

test("cookbook author syncs after server round-trip", async ({ page, context }) => {
  await signIn(page);
  await openQuickAdd(page, "recipe");
  await page.getByLabel(fr["field.title"]).fill("Sync Cake");
  await page.getByText(fr["recipe.source.section"]).click();
  await page.getByLabel(fr["recipe.source.cookbook"]).fill("Sync Book");
  await page.getByRole("option", { name: fr["recipe.source.create"].replace("{query}", "Sync Book") }).click();
  await page.getByLabel(fr["recipe.source.author"]).fill("Chef Sync");
  await submitQuickAdd(page);

  await page.getByRole("link", { name: "Sync Cake" }).click();
  await expect(page.getByText("Chef Sync")).toBeVisible();

  const pageB = await context.newPage();
  await signIn(pageB);
  await pageB.goto("/search");
  await pageB.getByLabel(fr["nav.search"]).fill("Sync Cake");
  await pageB.getByRole("link", { name: "Sync Cake" }).click();
  await expect(pageB.getByText("Chef Sync")).toBeVisible();
});
