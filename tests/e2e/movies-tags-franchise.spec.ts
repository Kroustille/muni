import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { locators, selectors, signIn, titleFieldLabel } from "./lists.spec";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("movies tags and franchise filters", () => {
  test("assign tag and franchise then filter list", async ({ page }) => {
    await signIn(page);
    await page.goto("/movies");

    const titleA = `Tag Franchise A ${Date.now()}`;
    const titleB = `Tag Franchise B ${Date.now()}`;

    await locators.quickAddButton(page).click();
    await page.getByRole("button", { name: t("type.movie") }).click();
    await page.getByLabel(titleFieldLabel("movie")).fill(titleA);
    await page.getByRole("button", { name: selectors.actionAdd }).click();
    await expect(locators.itemLink(page, titleA)).toBeVisible({ timeout: 15_000 });

    await locators.quickAddButton(page).click();
    await page.getByRole("button", { name: t("type.movie") }).click();
    await page.getByLabel(titleFieldLabel("movie")).fill(titleB);
    await page.getByRole("button", { name: selectors.actionAdd }).click();
    await expect(locators.itemLink(page, titleB)).toBeVisible({ timeout: 15_000 });
  });
});
