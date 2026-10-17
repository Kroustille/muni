import { expect, test } from "@playwright/test";

import { addItem, locators, openList, selectors, signIn, t } from "./list-helpers";

test.describe("book reading heatmap", () => {
  test("lights activity after pages read update", async ({ page }) => {
    await signIn(page);
    const title = "Les Misérables";
    await addItem(page, "book", title);
    await openList(page, "books");
    await locators.itemLink(page, title).click();

    await page.getByLabel(t("field.status")).selectOption({ label: t("status.reading") });
    await page.getByLabel(t("books.pagesRead")).fill("15");
    await page.getByRole("button", { name: selectors.actionSave }).click();

    await page.goto("/books/insights");
    await expect(page.getByTestId("reading-heatmap")).toBeVisible();
    await expect(page.getByTestId("reading-heatmap").locator(".bg-accent").first()).toBeVisible();
  });
});
