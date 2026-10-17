import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { openList, signIn } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("books title catalog search (desktop)", () => {
  test("search, preview, and save from mocked API", async ({ page }) => {
    await page.route("**/api/books/search*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              isbn: "9782070368228",
              title: "1984",
              author: "George Orwell",
            },
          ],
        }),
      });
    });

    await page.route("**/api/books/lookup*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          isbn: "9782070368228",
          title: "1984",
          author: "George Orwell",
          synopsis: "Dans un monde totalitaire.",
        }),
      });
    });

    await signIn(page);
    await openList(page, "books");
    await page.getByRole("button", { name: t("books.catalog.search") }).click();
    await page.getByLabel(t("books.catalog.search.placeholder")).fill("1984");
    await page.waitForResponse(
      (res) => res.url().includes("/api/books/search") && res.ok(),
      { timeout: 15_000 },
    );

    const result = page.getByRole("listitem").filter({ hasText: "1984" });
    await expect(result).toBeVisible({ timeout: 10_000 });
    await result.getByRole("button").click();

    await expect(page.getByLabel(t("field.synopsis"))).toHaveValue(
      "Dans un monde totalitaire.",
      { timeout: 10_000 },
    );
    await page.getByRole("button", { name: t("action.save") }).click();
    await expect(page.getByRole("link", { name: "1984" })).toBeVisible({ timeout: 10_000 });
  });
});
