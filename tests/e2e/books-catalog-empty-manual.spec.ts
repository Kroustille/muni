import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { openList, signIn } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("books catalog empty search", () => {
  test("offers manual add without nested forms when Open Library returns no hits", async ({
    page,
  }) => {
    await page.route("**/api/books/search*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [] }),
      });
    });

    await signIn(page);
    await openList(page, "books");
    await page.getByRole("button", { name: t("books.catalog.search") }).click();
    await page.getByLabel(t("books.catalog.search.placeholder")).fill("L'Étranger");
    await page.waitForResponse(
      (res) => res.url().includes("/api/books/search") && res.ok(),
      { timeout: 15_000 },
    );

    await expect(page.getByText(t("books.catalog.empty"))).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: t("books.addManually") })).toBeVisible();
    expect(await page.evaluate(() => document.querySelectorAll("form form").length)).toBe(0);

    await page.getByRole("button", { name: t("books.addManually") }).click();
    await expect(page.getByLabel(t("field.title"))).toHaveValue("L'Étranger");
    await page.getByLabel(t("field.title")).fill("L'Étranger");
    await page.getByRole("button", { name: t("action.save") }).click();
    await expect(page.getByRole("link", { name: "L'Étranger" })).toBeVisible({ timeout: 10_000 });
  });
});
