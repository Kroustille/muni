import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { listPath, locators, openQuickAddType, selectors, signIn, titleFieldLabel } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("movies discovery filters", () => {
  test("filter by mood and tag", async ({ page }) => {
    await signIn(page);
    await page.goto(listPath("movies"));

    const tagged = `Movie Discovery ${Date.now()}`;
    const other = `Movie Other ${Date.now()}`;

    await openQuickAddType(page, "movie");
    const addTagged = page.getByRole("dialog");
    await addTagged.getByLabel(titleFieldLabel("movie")).fill(tagged);
    await addTagged.getByLabel(t("books.tags.add")).fill("movie-disc-tag");
    await addTagged.getByRole("button", { name: t("books.tags.add") }).click();
    await locators.quickAddSubmit(page).click();
    await expect(locators.itemLink(page, tagged)).toBeVisible({ timeout: 15_000 });

    await openQuickAddType(page, "movie");
    await page.getByRole("dialog").getByLabel(titleFieldLabel("movie")).fill(other);
    await locators.quickAddSubmit(page).click();
    await expect(locators.itemLink(page, other)).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: tagged }).click();
    await page.getByLabel(t("movies.discovery.mood")).selectOption(t("books.mood.joyeux"));
    await page.getByRole("button", { name: selectors.actionSave }).click();

    await page.getByRole("button", { name: t("movies.discovery.filters") }).click();
    await page.getByLabel(t("movies.discovery.mood")).selectOption(t("books.mood.joyeux"));
    await page.getByRole("button", { name: "movie-disc-tag" }).click();
    await page.getByRole("button", { name: t("action.close") }).click();

    await expect(locators.itemLink(page, tagged)).toBeVisible();
    await expect(locators.itemLink(page, other)).toHaveCount(0);
  });
});
