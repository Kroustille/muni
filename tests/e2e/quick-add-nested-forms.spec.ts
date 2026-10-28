import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { openQuickAdd, signIn } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

async function assertNoNestedForms(page: import("@playwright/test").Page): Promise<void> {
  const nestedCount = await page.evaluate(
    () => document.querySelectorAll("form form").length,
  );
  expect(nestedCount).toBe(0);
}

test.describe("quick-add nested forms guardrail", () => {
  test("book quick-add with title catalog search has no nested forms", async ({ page }) => {
    await signIn(page);
    await openQuickAdd(page, "book");
    const quickAddDialog = page.getByRole("dialog");
    await quickAddDialog.getByRole("button", { name: t("books.catalog.search") }).click();
    await expect(page.getByLabel(t("books.catalog.search.placeholder"))).toBeVisible();
    await assertNoNestedForms(page);
  });

  test("movie quick-add with catalog search has no nested forms", async ({ page }) => {
    await signIn(page);
    await openQuickAdd(page, "movie");
    const quickAddDialog = page.getByRole("dialog");
    await quickAddDialog.getByRole("button", { name: t("movies.catalog.search") }).click();
    await expect(page.getByLabel(t("movies.catalog.search.placeholder"))).toBeVisible();
    await assertNoNestedForms(page);
  });
});
