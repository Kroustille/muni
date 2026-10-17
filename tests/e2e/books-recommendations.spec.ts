import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { listPath, locators, openQuickAddType, selectors, signIn, titleFieldLabel } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("books recommendations", () => {
  test("shows Pour vous when library has enough matches", async ({ page }) => {
    await signIn(page);
    await page.goto(listPath("books"));

    const readTitle = `Rec Read ${Date.now()}`;
    const pool = ["Rec A", "Rec B", "Rec C"].map(
      (label, index) => `${label} ${Date.now()}-${index}`,
    );

    await openQuickAddType(page, "book");
    const addRead = page.getByRole("dialog");
    await addRead.getByLabel(titleFieldLabel("book")).fill(readTitle);
    await addRead.getByLabel(t("books.tags.add")).fill("rec-pick");
    await addRead.getByRole("button", { name: t("books.tags.add") }).click();
    await locators.quickAddSubmit(page).click();
    await expect(locators.itemLink(page, readTitle)).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: readTitle }).click();
    await locators.rowStatus(locators.listRow(page, readTitle)).selectOption(t("status.read"));
    await page.getByRole("button", { name: selectors.actionSave }).click();

    for (const title of pool) {
      await openQuickAddType(page, "book");
      const addPool = page.getByRole("dialog");
      await addPool.getByLabel(titleFieldLabel("book")).fill(title);
      await addPool.getByLabel(t("books.tags.add")).fill("rec-pick");
      await addPool.getByRole("button", { name: t("books.tags.add") }).click();
      await locators.quickAddSubmit(page).click();
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
