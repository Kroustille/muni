import { expect, test } from "@playwright/test";
import {
  addItem,
  locators,
  saveItem,
  openItem,
  openList,
  selectors,
  signIn,
  t,
} from "./list-helpers";
import { openSearch, searchFor, searchLocators } from "./search-helpers";

test("global search matches book author metadata", async ({ page, context }) => {
  await signIn(page);
  const title = "Roman discret";
  await addItem(page, "book", title);
  await openList(page, "books");
  await openItem(page, title);
  await page.getByLabel(t("field.author")).fill("AuteurUnique");
  await saveItem(page);

  await context.setOffline(true);
  await openSearch(page);
  await searchFor(page, "auteurunique");
  await expect(searchLocators.resultRow(page, title)).toBeVisible();
});
