import { expect, test } from "@playwright/test";
import {
  addItem,
  listPath,
  locators,
  mailpitUrl,
  openList,
  selectors,
  signIn,
  t,
} from "./list-helpers";

test.beforeEach(async ({ request }) => {
  await request.delete(`${mailpitUrl}/api/v1/messages`).catch(() => undefined);
});

test("checks off a shopping item on the list", async ({ page }) => {
  await signIn(page);
  const name = "Lait";
  await addItem(page, "shopping", name);
  await openList(page, "shopping");

  const checkbox = locators.shoppingCheck(page, name);
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await expect(checkbox).toBeChecked();

  await page.reload();
  await expect(locators.shoppingCheck(page, name)).toBeChecked();
});

test("shows rating only when a book is read and restores it when read again", async ({ page }) => {
  await signIn(page);
  const title = "Le Petit Prince";
  await addItem(page, "book", title);
  await openList(page, "books");

  const row = locators.listRow(page, title);
  await expect(locators.ratingGroup(page)).toHaveCount(0);

  await locators.rowStatus(row).selectOption({ label: selectors.statusRead });
  await expect(locators.ratingGroup(page)).toBeVisible();
  await locators.ratingStar(page, 4).click();

  await locators.rowStatus(row).selectOption({ label: selectors.statusToRead });
  await expect(locators.ratingGroup(page)).toHaveCount(0);

  await locators.rowStatus(row).selectOption({ label: selectors.statusRead });
  await expect(locators.ratingStar(page, 4)).toHaveAttribute("aria-pressed", "true");
});

test("filters books by status on the list view", async ({ page }) => {
  await signIn(page);
  const toRead = "1984";
  const reading = "Dune";
  const read = "Bel-Ami";
  await addItem(page, "book", toRead);
  await addItem(page, "book", reading);
  await addItem(page, "book", read);
  await openList(page, "books");

  const toReadRow = locators.listRow(page, toRead);
  const readingRow = locators.listRow(page, reading);
  const readRow = locators.listRow(page, read);

  await locators.rowStatus(readingRow).selectOption({ label: selectors.statusReading });
  await locators.rowStatus(readRow).selectOption({ label: selectors.statusRead });

  await locators.statusFilter(page, selectors.statusAll).click();
  await expect(toReadRow).toBeVisible();
  await expect(readingRow).toBeVisible();
  await expect(readRow).toBeVisible();

  await locators.statusFilter(page, selectors.statusToRead).click();
  await expect(toReadRow).toBeVisible();
  await expect(readingRow).toHaveCount(0);
  await expect(readRow).toHaveCount(0);

  await locators.statusFilter(page, selectors.statusReading).click();
  await expect(readingRow).toBeVisible();
  await expect(toReadRow).toHaveCount(0);

  await locators.statusFilter(page, selectors.statusRead).click();
  await expect(readRow).toBeVisible();
  await expect(toReadRow).toHaveCount(0);
});

test("edits a recipe and persists ingredients and steps after reload", async ({ page }) => {
  await signIn(page);
  const title = "Crêpes";
  await addItem(page, "recipe", title);
  await openList(page, "recipes");
  await locators.itemLink(page, title).click();
  await expect(page).toHaveURL(/\/items\/[^/]+$/);

  await page.getByLabel(selectors.fieldNotes).fill("Pour le goûter");
  await page.getByRole("button", { name: selectors.addIngredient }).click();
  const ingredientRows = page.getByRole("group", { name: selectors.fieldIngredients }).getByRole("listitem");
  await ingredientRows.nth(0).getByLabel(t("field.quantity")).fill("250 g");
  await ingredientRows.nth(0).getByLabel(t("field.name")).fill("farine");

  await page.getByRole("button", { name: selectors.addStep }).click();
  const stepFields = page.getByRole("group", { name: selectors.fieldSteps }).getByRole("textbox");
  await stepFields.nth(0).fill("Mélanger la pâte");
  await stepFields.nth(1).fill("Cuire à la poêle");

  await page.getByRole("button", { name: selectors.actionSave }).click();

  await page.reload();
  await expect(page.getByLabel(selectors.fieldNotes)).toHaveValue("Pour le goûter");
  await expect(ingredientRows.nth(0).getByLabel(t("field.quantity"))).toHaveValue("250 g");
  await expect(ingredientRows.nth(0).getByLabel(t("field.name"))).toHaveValue("farine");
  await expect(stepFields.nth(0)).toHaveValue("Mélanger la pâte");
  await expect(stepFields.nth(1)).toHaveValue("Cuire à la poêle");
});

test("deletes an item and restores it with Undo", async ({ page }) => {
  await signIn(page);
  const title = "Amélie";
  await addItem(page, "movie", title);
  await openList(page, "movies");
  await locators.itemLink(page, title).click();

  await page.getByRole("button", { name: selectors.actionDelete }).click();
  await expect(page.getByText(selectors.itemDeleted)).toBeVisible();
  await locators.undoButton(page).click();

  await page.goto(listPath("movies"));
  await expect(locators.itemLink(page, title)).toBeVisible();
});
