import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { addItem, signIn } from "./lists.spec";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("book quotes", () => {
  test("adds a quote offline then keeps it visible", async ({ page, context }) => {
    await signIn(page);
    await addItem(page, "book", "Le Petit Prince");
    await page.getByRole("link", { name: "Le Petit Prince" }).click();

    await context.setOffline(true);
    await page.getByLabel(t("books.quotes.add")).fill("On ne voit bien qu'avec le cœur.");
    await page.getByRole("button", { name: t("books.quotes.add") }).click();

    await expect(page.getByText("On ne voit bien qu'avec le cœur.")).toBeVisible();
    await context.setOffline(false);
  });
});
