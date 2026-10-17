import { expect, test } from "@playwright/test";
import { addItem, openList, signIn, t } from "./list-helpers";

test("filters the books list with local search", async ({ page }) => {
  await signIn(page);
  await addItem(page, "book", "Visible title");
  await openList(page, "books");
  await page.getByLabel(t("list.search.label")).fill("invisible");
  await expect(page.getByText(t("list.search.empty"))).toBeVisible();
  await page.getByLabel(t("list.search.label")).fill("visible");
  await expect(page.getByText("Visible title")).toBeVisible();
});
