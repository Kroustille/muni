import { expect, test } from "@playwright/test";

import fr from "../../src/i18n/fr.json";
import {
  addItem,
  locators,
  openList,
  selectors,
  signIn,
  t,
} from "./lists.spec";

test.describe("movie pause and watched date", () => {
  test("pause film and set watched date on vu", async ({ page }) => {
    await signIn(page);
    const title = `Film Pause ${Date.now()}`;
    await addItem(page, "movie", title);
    await openList(page, "movies");
    await locators.itemLink(page, title).click();

    await page.getByLabel(t("field.status")).selectOption({ label: t("status.paused") });
    await page.getByRole("button", { name: selectors.actionSave }).click();
    await page.reload();
    await expect(page.getByLabel(t("field.status"))).toHaveValue("paused");

    await page.getByLabel(t("field.status")).selectOption({ label: t("status.watched") });
    await expect(page.getByLabel(t("movies.watchedAt"))).toBeVisible();
    await page.getByLabel(t("movies.watchedAt")).fill("2026-03-15");
    await page.getByRole("button", { name: selectors.actionSave }).click();
    await page.reload();
    await expect(page.getByLabel(t("movies.watchedAt"))).toHaveValue("2026-03-15");
  });
});
