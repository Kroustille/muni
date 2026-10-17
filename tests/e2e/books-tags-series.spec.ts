import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { listPath, locators, selectors, signIn, titleFieldLabel } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("books tags and series filters", () => {
  test("assign tag and series then filter list", async ({ page }) => {
    await signIn(page);
    await page.goto(listPath("books"));

    const titleA = `Tag Series A ${Date.now()}`;
    const titleB = `Tag Series B ${Date.now()}`;

    await locators.quickAddButton(page).click();
    await page.getByRole("button", { name: t("type.book") }).click();
    await page.getByLabel(titleFieldLabel("book")).fill(titleA);
    await page.getByLabel(t("books.tags.add")).fill("e2e-tag");
    await page.getByRole("button", { name: t("books.tags.add") }).click();
    await page.getByLabel(t("books.series.name")).fill("e2e-series");
    await locators.quickAddSubmit(page).click();
    await expect(locators.itemLink(page, titleA)).toBeVisible({ timeout: 15_000 });

    await locators.quickAddButton(page).click();
    await page.getByRole("button", { name: t("type.book") }).click();
    await page.getByLabel(titleFieldLabel("book")).fill(titleB);
    await locators.quickAddSubmit(page).click();
    await expect(locators.itemLink(page, titleB)).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "e2e-tag" }).click();
    await expect(locators.itemLink(page, titleA)).toBeVisible();
    await expect(locators.itemLink(page, titleB)).toHaveCount(0);

    await page.getByRole("button", { name: selectors.statusAll }).first().click();
    await page.getByRole("button", { name: "e2e-series" }).click();
    await expect(locators.itemLink(page, titleA)).toBeVisible();
    await expect(locators.itemLink(page, titleB)).toHaveCount(0);
  });
});
