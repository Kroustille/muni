import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { locators, openList, selectors, signIn, titleFieldLabel } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("books discovery filters", () => {
  test("filter by mood and tag", async ({ page }) => {
    await signIn(page);
    await openList(page, "books");

    const tagged = `Discovery Mood ${Date.now()}`;
    const other = `Discovery Other ${Date.now()}`;

    await locators.quickAddButton(page).click();
    await page.getByRole("button", { name: t("type.book") }).click();
    await page.getByLabel(titleFieldLabel("book")).fill(tagged);
    await page.getByLabel(t("books.tags.add")).fill("disc-tag");
    await page.getByRole("button", { name: t("books.tags.add") }).click();
    await page.getByRole("button", { name: selectors.actionAdd }).click();
    await expect(locators.itemLink(page, tagged)).toBeVisible({ timeout: 15_000 });

    await locators.quickAddButton(page).click();
    await page.getByRole("button", { name: t("type.book") }).click();
    await page.getByLabel(titleFieldLabel("book")).fill(other);
    await page.getByRole("button", { name: selectors.actionAdd }).click();
    await expect(locators.itemLink(page, other)).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: tagged }).click();
    await page.getByLabel(t("books.discovery.mood")).selectOption(t("books.mood.joyeux"));
    await page.getByRole("button", { name: selectors.actionSave }).click();

    await page.getByRole("button", { name: t("books.discovery.filters") }).click();
    await page.getByLabel(t("books.discovery.mood")).selectOption(t("books.mood.joyeux"));
    await page.getByRole("button", { name: "disc-tag" }).click();
    await page.getByRole("button", { name: t("action.close") }).click();

    await expect(locators.itemLink(page, tagged)).toBeVisible();
    await expect(locators.itemLink(page, other)).toHaveCount(0);
  });
});
