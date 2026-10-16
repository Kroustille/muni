import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { locators, selectors, signIn, titleFieldLabel } from "./lists.spec";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("movies tags and franchise filters", () => {
  test("assign tag and franchise on detail", async ({ page }) => {
    await signIn(page);
    await page.goto("/movies");

    const title = `Tag Franchise ${Date.now()}`;

    await locators.quickAddButton(page).click();
    await page.getByRole("button", { name: t("type.movie") }).click();
    await page.getByLabel(titleFieldLabel("movie")).fill(title);
    await page.getByRole("button", { name: selectors.actionAdd }).click();
    await expect(locators.itemLink(page, title)).toBeVisible({ timeout: 15_000 });

    await locators.itemLink(page, title).click();
    await page.getByLabel(t("books.tags.add")).fill("ciné-tag");
    await page.getByRole("button", { name: t("books.tags.add") }).click();
    await page.getByLabel(t("movies.franchise.name")).fill("Ma saga");
    await page.getByLabel(t("movies.franchise.order")).fill("2");
    await page.getByRole("button", { name: selectors.actionSave }).click();
    await page.reload();
    await expect(page.getByLabel(t("movies.franchise.name"))).toHaveValue("Ma saga");
    await expect(page.getByLabel(t("movies.franchise.order"))).toHaveValue("2");
  });
});
