import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { listPath, locators, selectors, signIn, titleFieldLabel } from "./lists.spec";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("books recommendations", () => {
  test("shows Pour vous when library has enough matches", async ({ page }) => {
    await signIn(page);
    await page.goto(listPath("books"));

    const readTitle = `Rec Read ${Date.now()}`;
    const pool = ["Rec A", "Rec B", "Rec C"].map(
      (label, index) => `${label} ${Date.now()}-${index}`,
    );

    await locators.quickAddButton(page).click();
    await page.getByRole("button", { name: t("type.book") }).click();
    await page.getByLabel(titleFieldLabel("book")).fill(readTitle);
    await page.getByLabel(t("books.tags.add")).fill("rec-pick");
    await page.getByRole("button", { name: t("books.tags.add") }).click();
    await page.getByRole("button", { name: selectors.actionAdd }).click();
    await expect(locators.itemLink(page, readTitle)).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: readTitle }).click();
    await locators.rowStatus(locators.listRow(page, readTitle)).selectOption(t("status.read"));
    await page.getByRole("button", { name: selectors.actionSave }).click();

    for (const title of pool) {
      await locators.quickAddButton(page).click();
      await page.getByRole("button", { name: t("type.book") }).click();
      await page.getByLabel(titleFieldLabel("book")).fill(title);
      await page.getByLabel(t("books.tags.add")).fill("rec-pick");
      await page.getByRole("button", { name: t("books.tags.add") }).click();
      await page.getByRole("button", { name: selectors.actionAdd }).click();
      await expect(locators.itemLink(page, title)).toBeVisible({ timeout: 15_000 });
    }

    await expect(page.getByRole("heading", { name: t("books.discovery.recommendations") })).toBeVisible({
      timeout: 15_000,
    });
    for (const title of pool) {
      await expect(page.getByRole("button", { name: title })).toBeVisible();
    }
  });
});
