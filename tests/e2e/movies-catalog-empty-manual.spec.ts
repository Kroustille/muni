import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { locators, openQuickAddType, signIn, titleFieldLabel } from "./list-helpers";

// Serwist routes /api/* through the service worker, which bypasses page.route mocks.
test.use({ serviceWorkers: "block" });

const t = (key: keyof typeof fr): string => fr[key];

test.describe("movies catalog empty search", () => {
  test("quick-add manual path when catalog search returns no hits", async ({ page }) => {
    await page.route("**/api/movies/search*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [] }),
      });
    });

    await signIn(page);
    const title = `Film absent ${Date.now()}`;

    await openQuickAddType(page, "movie");
    await page.getByRole("button", { name: t("movies.catalog.search") }).click();
    const catalogDialog = page.getByRole("dialog", { name: t("movies.catalog.search") });
    await catalogDialog.getByLabel(t("movies.catalog.search.placeholder")).fill(title);
    await catalogDialog
      .getByRole("button", { name: t("books.lookup.search"), exact: true })
      .click();
    await expect(catalogDialog.getByText(t("movies.catalog.empty"))).toBeVisible({
      timeout: 10_000,
    });
    await catalogDialog.getByRole("button", { name: t("books.addManually") }).click();

    const quickAddDialog = page.getByRole("dialog", { name: t("type.movie") });
    await expect(quickAddDialog.getByLabel(titleFieldLabel("movie"), { exact: true })).toHaveValue(
      title,
    );
    await locators.quickAddSubmit(page).click();
    await expect(locators.itemLink(page, title)).toBeVisible({ timeout: 15_000 });
  });
});
