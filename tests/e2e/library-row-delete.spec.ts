import { expect, test } from "@playwright/test";
import { addItem, locators, openList, selectors, signIn } from "./list-helpers";

test("deletes a recipe row with undo", async ({ page }) => {
  await signIn(page);
  const title = "Tarte aux pommes";
  await addItem(page, "recipe", title);
  await openList(page, "recipes");
  await page.getByRole("button", { name: selectors.actionDelete }).click();
  await expect(page.getByText(selectors.itemDeleted)).toBeVisible();
  await locators.undoButton(page).click();
  await expect(page.getByText(title)).toBeVisible();
});
