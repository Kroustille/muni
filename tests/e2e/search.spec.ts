import { expect, test, type Page } from "@playwright/test";
import {
  addItem,
  locators,
  openList,
  quickAddTypeLabel,
  selectors,
  signIn,
  t,
  type ItemKind,
} from "./lists.spec";

const mailpit = process.env.MAILPIT_URL ?? "http://localhost:8025";

export const searchSelectors = {
  placeholder: t("search.placeholder"),
  empty: t("search.empty"),
  navSearch: t("nav.search"),
};

export const searchLocators = {
  navLink: (page: Page) => page.getByRole("link", { name: searchSelectors.navSearch }),
  input: (page: Page) => page.getByPlaceholder(searchSelectors.placeholder),
  emptyState: (page: Page) => page.getByText(searchSelectors.empty),
  resultRow: (page: Page, title: string) =>
    page.getByRole("listitem").filter({ hasText: title }),
  resultLink: (page: Page, title: string) => page.getByRole("link", { name: title }),
};

export async function openSearch(page: Page): Promise<void> {
  await searchLocators.navLink(page).click();
  await expect(page).toHaveURL("/search");
  await expect(page.getByRole("heading", { name: searchSelectors.navSearch })).toBeVisible();
  await expect(searchLocators.input(page)).toBeVisible();
}

export async function searchFor(page: Page, query: string): Promise<void> {
  const input = searchLocators.input(page);
  await input.fill(query);
  await input.press("Enter");
}

const typeLabel = (kind: ItemKind): string => quickAddTypeLabel(kind);

test.beforeEach(async ({ request }) => {
  await request.delete(`${mailpit}/api/v1/messages`).catch(() => undefined);
});

test("finds matching items from every list with their type while offline", async ({
  page,
  context,
}) => {
  await signIn(page);
  const items: { kind: ItemKind; title: string }[] = [
    { kind: "shopping", title: "Chocolat noir" },
    { kind: "book", title: "Le Chat noir" },
    { kind: "movie", title: "La Nuit noire" },
    { kind: "recipe", title: "Risotto noir" },
  ];
  for (const { kind, title } of items) {
    await addItem(page, kind, title);
  }

  await context.setOffline(true);
  await openSearch(page);
  await searchFor(page, "noir");

  for (const { kind, title } of items) {
    const row = searchLocators.resultRow(page, title);
    await expect(row).toBeVisible();
    await expect(row).toContainText(typeLabel(kind));
    await expect(searchLocators.resultLink(page, title)).toBeVisible();
  }
});

test("matches accents and case insensitively while offline", async ({ page, context }) => {
  await signIn(page);
  const title = "Éléphant";
  await addItem(page, "book", title);

  await context.setOffline(true);
  await openSearch(page);
  await searchFor(page, "elephant");

  const row = searchLocators.resultRow(page, title);
  await expect(row).toBeVisible();
  await expect(row).toContainText(typeLabel("book"));
});

test("shows an empty state when nothing matches", async ({ page, context }) => {
  await signIn(page);
  await addItem(page, "movie", "Amélie");

  await context.setOffline(true);
  await openSearch(page);
  await searchFor(page, "zzzzintrouvable");

  await expect(searchLocators.emptyState(page)).toBeVisible();
  await expect(page.getByRole("link", { name: "Amélie" })).toHaveCount(0);
});

test("does not match notes, only title or name", async ({ page, context }) => {
  await signIn(page);
  const title = "Titre discret";
  await addItem(page, "book", title);
  await openList(page, "books");
  await locators.itemLink(page, title).click();
  await page.getByLabel(t("field.notes")).fill("motsecretintrouvable");
  await page.getByRole("button", { name: selectors.actionSave }).click();

  await context.setOffline(true);
  await openSearch(page);
  await searchFor(page, "motsecretintrouvable");

  await expect(searchLocators.emptyState(page)).toBeVisible();
  await expect(searchLocators.resultRow(page, title)).toHaveCount(0);
});
