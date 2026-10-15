import { expect, test, type Locator, type Page } from "@playwright/test";
import fr from "../../src/i18n/fr.json";

export const t = (key: keyof typeof fr): string => fr[key];

const mailpit = process.env.MAILPIT_URL ?? "http://localhost:8025";

export type ListRoute = "shopping" | "books" | "movies" | "recipes";
export type ItemKind = "shopping" | "book" | "movie" | "recipe";

export const listPath = (type: ListRoute): string => `/lists/${type}`;

export const listTitle = (type: ListRoute): string => {
  const map: Record<ListRoute, keyof typeof fr> = {
    shopping: "list.shopping",
    books: "list.books",
    movies: "list.movies",
    recipes: "list.recipes",
  };
  return t(map[type]);
};

export const quickAddTypeLabel = (kind: ItemKind): string => {
  const map: Record<ItemKind, keyof typeof fr> = {
    shopping: "type.shopping",
    book: "type.book",
    movie: "type.movie",
    recipe: "type.recipe",
  };
  return t(map[kind]);
};

export const titleFieldLabel = (kind: ItemKind): string =>
  kind === "shopping" ? t("field.name") : t("field.title");

/** i18n-backed accessible names the browse/update UI must expose. */
export const selectors = {
  quickAdd: t("nav.quickAdd"),
  statusAll: t("status.all"),
  statusToRead: t("status.to_read"),
  statusReading: t("status.reading"),
  statusRead: t("status.read"),
  statusToWatch: t("status.to_watch"),
  statusWatched: t("status.watched"),
  fieldStatus: t("field.status"),
  fieldRating: t("field.rating"),
  fieldIngredients: t("field.ingredients"),
  fieldSteps: t("field.steps"),
  fieldNotes: t("field.notes"),
  actionAdd: t("action.add"),
  actionSave: t("action.save"),
  actionDelete: t("action.delete"),
  actionUndo: t("action.undo"),
  itemDeleted: t("item.deleted"),
  addIngredient: t("action.addIngredient"),
  addStep: t("action.addStep"),
};

export const locators = {
  quickAddButton: (page: Page) => page.getByRole("button", { name: selectors.quickAdd }),
  statusFilter: (page: Page, label: string) => page.getByRole("button", { name: label }),
  shoppingCheck: (page: Page, itemName: string) =>
    page.getByRole("checkbox", { name: itemName }),
  itemLink: (page: Page, title: string) => page.getByRole("link", { name: title }),
  listRow: (page: Page, title: string) => page.getByRole("listitem").filter({ hasText: title }),
  rowStatus: (row: Locator) => row.getByLabel(selectors.fieldStatus),
  ratingGroup: (page: Page) => page.getByRole("group", { name: selectors.fieldRating }),
  ratingStar: (page: Page, stars: 1 | 2 | 3 | 4 | 5) =>
    locators.ratingGroup(page).getByRole("button", { name: String(stars) }),
  undoButton: (page: Page) => page.getByRole("button", { name: selectors.actionUndo }),
};

async function readMagicLink(email: string): Promise<string> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const search = await fetch(
      `${mailpit}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    );
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages.length > 0) {
      const res = await fetch(`${mailpit}/api/v1/message/${messages[0].ID}`);
      const { Text } = (await res.json()) as { Text: string };
      const match = Text.match(/https?:\/\/\S+\/auth\/verify\?token=[^\s>"')]+/);
      if (match) return match[0];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No magic link received for ${email}`);
}

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
}

export async function signIn(page: Page): Promise<void> {
  const email = uniqueEmail();
  await page.goto("/sign-in");
  await page.getByLabel(t("signIn.email")).fill(email);
  await page.getByRole("button", { name: t("signIn.sendLink") }).click();
  await expect(page.getByText(t("signIn.linkSent"))).toBeVisible();
  const link = await readMagicLink(email);
  await page.goto(link);
  await expect(page).toHaveURL("/");
}

export async function addItem(page: Page, kind: ItemKind, title: string): Promise<void> {
  await locators.quickAddButton(page).click();
  await page.getByRole("button", { name: quickAddTypeLabel(kind) }).click();
  await page.getByLabel(titleFieldLabel(kind)).fill(title);
  await page.getByRole("button", { name: selectors.actionAdd }).click();
  await expect(page.getByText(title)).toBeVisible();
}

export async function openList(page: Page, type: ListRoute): Promise<void> {
  await page.goto(listPath(type));
  await expect(page.getByRole("heading", { name: listTitle(type) })).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await request.delete(`${mailpit}/api/v1/messages`).catch(() => undefined);
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
