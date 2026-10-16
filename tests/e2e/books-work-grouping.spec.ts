import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { signIn } from "./lists.spec";

const t = (key: keyof typeof fr): string => fr[key];

const WORK_ID = "OL45804W";
const ISBN_A = "9782070368228";
const ISBN_B = "9782070612758";

test.describe("books work grouping", () => {
  test("two ISBNs from the same work stay grouped in the list", async ({ page }) => {
    await page.route("**/api/books/search*", async (route) => {
      const url = new URL(route.request().url());
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const results =
        q.includes("folio")
          ? [
              {
                isbn: ISBN_B,
                title: "L'Étranger (folio)",
                author: "Camus",
              },
            ]
          : [
              {
                isbn: ISBN_A,
                title: "L'Étranger",
                author: "Camus",
              },
            ];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results }),
      });
    });

    await page.route("**/api/books/lookup*", async (route) => {
      const url = new URL(route.request().url());
      const isbn = url.searchParams.get("isbn");
      const title = isbn === ISBN_B ? "L'Étranger (folio)" : "L'Étranger";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          isbn,
          title,
          author: "Camus",
          workId: WORK_ID,
        }),
      });
    });

    await signIn(page);
    await page.goto("/lists/books");

    await page.getByRole("button", { name: t("books.catalog.search") }).click();
    await page.getByLabel(t("books.catalog.search.placeholder")).fill("étranger");
    await page.getByRole("button", { name: t("books.lookup.search") }).click();
    await page.getByRole("button", { name: "L'Étranger" }).click();
    await page.getByRole("button", { name: t("action.save") }).click();
    await expect(page.getByRole("link", { name: "L'Étranger" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: t("books.catalog.search") }).click();
    await page.getByLabel(t("books.catalog.search.placeholder")).fill("étranger folio");
    await page.getByRole("button", { name: t("books.lookup.search") }).click();
    await page.getByRole("button", { name: "L'Étranger (folio)" }).click();
    await page.getByRole("button", { name: t("action.save") }).click();
    await expect(page.getByRole("link", { name: "L'Étranger (folio)" })).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByText(t("books.editions.count").replace("{count}", "2"))).toBeVisible({
      timeout: 10_000,
    });
  });
});
