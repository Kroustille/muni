import { expect, test } from "@playwright/test";

import { addItem, signIn, t } from "./lists.spec";

test.describe("book stats page", () => {
  test("smoke: insights stats section renders", async ({ page }) => {
    await signIn(page);
    await addItem(page, "book", "Statistiques Test");
    await page.goto("/books/insights");
    await expect(page.getByRole("heading", { name: t("books.insights.stats") })).toBeVisible();
    await expect(page.getByTestId("book-stats")).toBeVisible();
    await expect(page.getByText("Par mois")).toBeVisible();
  });
});
