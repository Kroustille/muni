import { expect, type Locator, type Page } from "@playwright/test";
import fr from "../../src/i18n/fr.json";

export const t = (key: keyof typeof fr): string => fr[key];

export const mailpitUrl = process.env.MAILPIT_URL ?? "http://localhost:8025";

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
  quickAddButton: (page: Page) =>
    page
      .getByRole("complementary", { name: t("nav.sidebar") })
      .getByRole("button", { name: selectors.quickAdd })
      .or(
        page
          .getByRole("navigation", { name: t("nav.bottom") })
          .getByRole("button", { name: selectors.quickAdd }),
      ),
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
      `${mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    );
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages.length > 0) {
      const res = await fetch(`${mailpitUrl}/api/v1/message/${messages[0].ID}`);
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
