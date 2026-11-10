import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import {
  listPath,
  locators,
  saveItem,
  openQuickAddType,
  selectors,
  signIn,
  titleFieldLabel,
} from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("movies recommendations", () => {
  test("shows Pour vous when library has enough matches", async ({ page }) => {
    await signIn(page);
    await page.goto(listPath("movies"));

    const watchedTitle = `Rec Watched ${Date.now()}`;
    const pool = ["Rec A", "Rec B", "Rec C"].map(
      (label, index) => `${label} ${Date.now()}-${index}`,
    );

    await openQuickAddType(page, "movie");
    const addWatched = page.getByRole("dialog");
    await addWatched.getByLabel(titleFieldLabel("movie"), { exact: true }).fill(watchedTitle);
    await addWatched.getByLabel(t("books.tags.add")).fill("rec-pick");
    await addWatched.getByRole("button", { name: t("books.tags.add") }).click();
    await locators.quickAddSubmit(page).click();
    await expect(locators.itemLink(page, watchedTitle)).toBeVisible({ timeout: 15_000 });

    await locators.itemLink(page, watchedTitle).click();
    await locators
      .rowStatus(locators.listRow(page, watchedTitle))
      .selectOption(t("status.watched"));
    await saveItem(page);

    for (const title of pool) {
      await openQuickAddType(page, "movie");
      const addPool = page.getByRole("dialog");
      await addPool.getByLabel(titleFieldLabel("movie"), { exact: true }).fill(title);
      await addPool.getByLabel(t("books.tags.add")).fill("rec-pick");
      await addPool.getByRole("button", { name: t("books.tags.add") }).click();
      await locators.quickAddSubmit(page).click();
      await expect(locators.itemLink(page, title)).toBeVisible({ timeout: 15_000 });
    }

    await expect(
      page.getByRole("heading", { name: t("movies.discovery.recommendations") }),
    ).toBeVisible({ timeout: 15_000 });
    for (const title of pool) {
      await expect(page.getByRole("button", { name: title })).toBeVisible();
    }
  });
});
