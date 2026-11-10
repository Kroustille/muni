import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { openItem, openQuickAdd, signIn, submitQuickAdd } from "./list-helpers";

test("cookbook author syncs after server round-trip", async ({ browser }) => {
  const pageA = await browser.newPage();
  await signIn(pageA);
  await openQuickAdd(pageA, "recipe");
  await pageA.getByLabel(fr["field.title"], { exact: true }).fill("Sync Cake");
  await pageA.getByText(fr["recipe.source.section"]).click();
  await pageA.getByLabel(fr["recipe.source.cookbook"]).fill("Sync Book");
  await pageA
    .getByRole("option", { name: fr["recipe.source.create"].replace("{query}", "Sync Book") })
    .click();
  await pageA.getByLabel(fr["recipe.source.author"]).fill("Chef Sync");
  await submitQuickAdd(pageA);

  await openItem(pageA, "Sync Cake");
  await expect(pageA.getByLabel(fr["recipe.source.author"])).toHaveValue("Chef Sync");

  // Second device for the same account: same session cookie, empty local data.
  const storageState = await pageA.context().storageState();
  const contextB = await browser.newContext({ storageState });
  const pageB = await contextB.newPage();

  await expect(async () => {
    await pageB.goto("/search");
    await pageB.getByPlaceholder(fr["search.placeholder"]).fill("Sync Cake");
    await expect(pageB.getByRole("link", { name: "Sync Cake" })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });

  await openItem(pageB, "Sync Cake");
  await expect(pageB.getByLabel(fr["recipe.source.author"])).toHaveValue("Chef Sync");

  await contextB.close();
  await pageA.context().close();
});
