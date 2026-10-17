import { expect, type Page } from "@playwright/test";
import { quickAddTypeLabel, t, type ItemKind } from "./list-helpers";

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

export const searchTypeLabel = (kind: ItemKind): string => quickAddTypeLabel(kind);
