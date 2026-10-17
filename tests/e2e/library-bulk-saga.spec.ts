import { expect, test } from "@playwright/test";
import { addItem, openList, signIn, t } from "./lists.spec";

test("assigns selected movies to a saga", async ({ page }) => {
  await signIn(page);
  await addItem(page, "movie", "Film One");
  await addItem(page, "movie", "Film Two");
  await openList(page, "movies");
  await page.getByRole("button", { name: t("list.selection.toggle") }).click();
  await page.getByRole("checkbox", { name: "Film One" }).check();
  await page.getByRole("checkbox", { name: "Film Two" }).check();
  await page.getByRole("button", { name: t("list.selection.assignSaga") }).click();
  await page.getByLabel(t("list.bulk.saga.name")).fill("Ma saga");
  await page.getByLabel(t("list.bulk.saga.order")).fill("1");
  await page.getByRole("button", { name: t("list.bulk.confirm") }).click();
  await expect(page.getByText("Film One")).toBeVisible();
});
