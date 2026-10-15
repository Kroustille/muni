import { expect, test, type Locator, type Page } from "@playwright/test";
import fr from "../../src/i18n/fr.json";

/** i18n keys the capture UI must add alongside existing catalog entries (T064–T066). */
export type PendingCaptureKey = "field.recommendedBy" | "validation.titleRequired";

export type CaptureKey = keyof typeof fr | PendingCaptureKey;

export const t = (key: CaptureKey): string => (fr as Record<string, string>)[key];

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

/** French accessible names and copy the quick-add flow must expose (via `t()`). */
export const selectors = {
  quickAdd: t("nav.quickAdd"),
  actionAdd: t("action.add"),
  fieldAuthor: t("field.author"),
  fieldQuantity: t("field.quantity"),
  fieldNotes: t("field.notes"),
  fieldRecommendedBy: t("field.recommendedBy"),
  validationTitleRequired: t("validation.titleRequired"),
};

export const locators = {
  quickAddButton: (page: Page) => page.getByRole("button", { name: selectors.quickAdd }),
  typeButton: (page: Page, kind: ItemKind) =>
    page.getByRole("button", { name: quickAddTypeLabel(kind) }),
  titleField: (page: Page, kind: ItemKind) => page.getByLabel(titleFieldLabel(kind)),
  authorField: (page: Page) => page.getByLabel(selectors.fieldAuthor),
  quantityField: (page: Page) => page.getByLabel(selectors.fieldQuantity),
  recommendedByField: (page: Page) => page.getByLabel(selectors.fieldRecommendedBy),
  notesField: (page: Page) => page.getByLabel(selectors.fieldNotes),
  submitButton: (page: Page) => page.getByRole("button", { name: selectors.actionAdd }),
  validationError: (page: Page) => page.getByText(selectors.validationTitleRequired),
  suggestion: (page: Page, name: string) => page.getByRole("option", { name }),
  itemLink: (page: Page, title: string) => page.getByRole("link", { name: title }),
  listRow: (page: Page, title: string) => page.getByRole("listitem").filter({ hasText: title }),
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

export async function openQuickAdd(page: Page, kind: ItemKind): Promise<void> {
  await locators.quickAddButton(page).click();
  await locators.typeButton(page, kind).click();
}

export async function openList(page: Page, type: ListRoute): Promise<void> {
  await page.goto(listPath(type));
  await expect(page.getByRole("heading", { name: listTitle(type) })).toBeVisible();
}

export type QuickAddFields = {
  title: string;
  author?: string;
  quantity?: string;
  recommendedBy?: string;
  notes?: string;
};

export async function fillQuickAdd(page: Page, kind: ItemKind, fields: QuickAddFields): Promise<void> {
  await locators.titleField(page, kind).fill(fields.title);
  if (fields.author !== undefined) {
    await locators.authorField(page).fill(fields.author);
  }
  if (fields.quantity !== undefined) {
    await locators.quantityField(page).fill(fields.quantity);
  }
  if (fields.recommendedBy !== undefined) {
    await locators.recommendedByField(page).fill(fields.recommendedBy);
  }
  if (fields.notes !== undefined) {
    await locators.notesField(page).fill(fields.notes);
  }
}

export async function submitQuickAdd(page: Page): Promise<void> {
  await locators.submitButton(page).click();
}

async function tap(locator: Locator, taps: { count: number }): Promise<void> {
  taps.count += 1;
  await locator.click();
}

test.beforeEach(async ({ request }) => {
  await request.delete(`${mailpit}/api/v1/messages`).catch(() => undefined);
});

test("generic quick add resets the chosen type after dismiss", async ({ page }) => {
  await signIn(page);
  await locators.quickAddButton(page).click();
  await locators.typeButton(page, "book").click();
  await expect(locators.titleField(page, "book")).toBeVisible();
  await page.getByRole("button", { name: fr["action.close"] }).click();
  await locators.quickAddButton(page).click();
  await expect(locators.typeButton(page, "book")).toBeVisible();
  await expect(locators.titleField(page, "book")).toHaveCount(0);
});

test("adds one item of each type and shows entered fields in its list", async ({ page }) => {
  await signIn(page);

  const shoppingName = "Beurre";
  await openQuickAdd(page, "shopping");
  await fillQuickAdd(page, "shopping", { title: shoppingName, quantity: "200 g" });
  await submitQuickAdd(page);
  await openList(page, "shopping");
  await expect(locators.listRow(page, shoppingName)).toContainText("200 g");

  const bookTitle = "Bel-Ami";
  const bookAuthor = "Guy de Maupassant";
  await openQuickAdd(page, "book");
  await fillQuickAdd(page, "book", { title: bookTitle, author: bookAuthor });
  await submitQuickAdd(page);
  await openList(page, "books");
  await expect(locators.listRow(page, bookTitle)).toContainText(bookAuthor);

  const movieTitle = "Amélie";
  const recommender = "Camille";
  await openQuickAdd(page, "movie");
  await fillQuickAdd(page, "movie", { title: movieTitle, recommendedBy: recommender });
  await submitQuickAdd(page);
  await openList(page, "movies");
  await expect(locators.listRow(page, movieTitle)).toContainText(recommender);

  const recipeTitle = "Crêpes";
  const recipeNotes = "Pour le goûter";
  await openQuickAdd(page, "recipe");
  await fillQuickAdd(page, "recipe", { title: recipeTitle, notes: recipeNotes });
  await submitQuickAdd(page);
  await openList(page, "recipes");
  await expect(locators.listRow(page, recipeTitle)).toContainText(recipeNotes);
});

test("title-only quick add leaves optional text fields empty on the detail screen", async ({
  page,
}) => {
  await signIn(page);
  const title = "1984";
  await openQuickAdd(page, "book");
  await fillQuickAdd(page, "book", { title });
  await submitQuickAdd(page);
  await openList(page, "books");
  await locators.itemLink(page, title).click();
  await expect(page).toHaveURL(/\/items\/[^/]+$/);

  await expect(locators.authorField(page)).toHaveValue("");
  await expect(locators.recommendedByField(page)).toHaveValue("");
  await expect(locators.notesField(page)).toHaveValue("");
});

test("rejects a whitespace-only title with a validation message", async ({ page }) => {
  await signIn(page);
  await openQuickAdd(page, "book");
  await locators.titleField(page, "book").fill("   ");
  await submitQuickAdd(page);
  await expect(locators.validationError(page)).toBeVisible();
  await openList(page, "books");
  await expect(page.getByText(t("list.empty"))).toBeVisible();
});

test('suggests past "recommended by" names while typing', async ({ page }) => {
  await signIn(page);
  const firstTitle = "Dune";
  const name = "Marie Dupont";
  await openQuickAdd(page, "book");
  await fillQuickAdd(page, "book", { title: firstTitle, recommendedBy: name });
  await submitQuickAdd(page);

  await openQuickAdd(page, "book");
  await fillQuickAdd(page, "book", { title: "Le Petit Prince" });
  await locators.recommendedByField(page).fill("Mar");
  await expect(locators.suggestion(page, name)).toBeVisible();
});

test("saves an offline add and shows it in the list immediately", async ({ page, context }) => {
  await signIn(page);
  await openList(page, "shopping");
  const title = "Lait";
  await context.setOffline(true);
  await openQuickAdd(page, "shopping");
  await fillQuickAdd(page, "shopping", { title });
  await submitQuickAdd(page);
  await expect(locators.listRow(page, title)).toBeVisible();
});

test("adds an item in at most three taps plus typing the title", async ({ page }) => {
  await signIn(page);
  const taps = { count: 0 };
  await tap(locators.quickAddButton(page), taps);
  await tap(locators.typeButton(page, "movie"), taps);
  await locators.titleField(page, "movie").fill("Interstellar");
  await tap(locators.submitButton(page), taps);
  expect(taps.count).toBeLessThanOrEqual(3);
  await openList(page, "movies");
  await expect(locators.listRow(page, "Interstellar")).toBeVisible();
});
