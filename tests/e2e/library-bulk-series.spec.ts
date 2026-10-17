import { expect, test } from "@playwright/test";
import { addItem, openList, signIn, t } from "./list-helpers";

test("assigns selected books to a series", async ({ page }) => {
  await signIn(page);
  await addItem(page, "book", "Book One");
  await addItem(page, "book", "Book Two");
  await openList(page, "books");
  await page.getByRole("button", { name: t("list.selection.toggle") }).click();
  await page.getByRole("checkbox", { name: "Book One" }).check();
  await page.getByRole("checkbox", { name: "Book Two" }).check();
  await page.getByRole("button", { name: t("list.selection.assignSeries") }).click();
  await page.getByLabel(t("list.bulk.series.name")).fill("Ma série");
  await page.getByLabel(t("list.bulk.series.order")).fill("1");
  await page.getByRole("button", { name: t("list.bulk.confirm") }).click();
  await expect(page.getByText("Book One")).toBeVisible();
});
