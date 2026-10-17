import { expect, test } from "@playwright/test";
import { addItem, locators, openList, selectors, signIn, t } from "./list-helpers";

test("bulk deletes shopping items with one undo", async ({ page }) => {
  await signIn(page);
  const names = ["Bulk A", "Bulk B", "Bulk C"];
  for (const name of names) {
    await addItem(page, "shopping", name);
  }
  await openList(page, "shopping");
  await page.getByRole("button", { name: t("list.selection.toggle") }).click();
  for (const name of names) {
    await page.getByRole("checkbox", { name }).check();
  }
  await page.getByRole("button", { name: t("list.selection.delete") }).click();
  await expect(page.getByText(t("item.deletedMany").replace("{count}", "3"))).toBeVisible();
  await locators.undoButton(page).click();
  for (const name of names) {
    await expect(page.getByText(name)).toBeVisible();
  }
});
