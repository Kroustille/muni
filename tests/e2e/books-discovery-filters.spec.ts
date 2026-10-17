import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import {
  locators,
  openList,
  openQuickAddType,
  selectors,
  signIn,
  titleFieldLabel,
} from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("books discovery filters", () => {
  test("filter by mood and tag", async ({ page }) => {
    await signIn(page);
    await openList(page, "books");

    const tagged = `Discovery Mood ${Date.now()}`;
    const other = `Discovery Other ${Date.now()}`;

    await openQuickAddType(page, "book");
    const addTagged = page.getByRole("dialog");
    await addTagged.getByLabel(titleFieldLabel("book")).fill(tagged);
    await addTagged.getByLabel(t("books.tags.add")).fill("disc-tag");
    await addTagged.getByRole("button", { name: t("books.tags.add") }).click();
    await locators.quickAddSubmit(page).click();
    await expect(locators.itemLink(page, tagged)).toBeVisible({ timeout: 15_000 });

    await openQuickAddType(page, "book");
    await page.getByRole("dialog").getByLabel(titleFieldLabel("book")).fill(other);
    await locators.quickAddSubmit(page).click();
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
