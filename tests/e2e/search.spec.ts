import { expect, test } from "@playwright/test";
import {
  addItem,
  locators,
  mailpitUrl,
  openList,
  selectors,
  signIn,
  t,
  type ItemKind,
} from "./list-helpers";
import {
  openSearch,
  searchFor,
  searchLocators,
  searchTypeLabel,
} from "./search-helpers";

test.beforeEach(async ({ request }) => {
  await request.delete(`${mailpitUrl}/api/v1/messages`).catch(() => undefined);
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
    await expect(row).toContainText(searchTypeLabel(kind));
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
  await expect(row).toContainText(searchTypeLabel("book"));
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
