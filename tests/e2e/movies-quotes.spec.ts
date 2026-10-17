import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { addItem, signIn } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("movie quotes", () => {
  test("adds a quote offline then keeps it visible", async ({ page, context }) => {
    await signIn(page);
    await addItem(page, "movie", "Le Fabuleux Destin");
    await page.getByRole("link", { name: "Le Fabuleux Destin" }).click();

    await context.setOffline(true);
    await page.getByLabel(t("movies.quotes.add")).fill("Sans amour, on ne vit pas, on survit.");
    await page.getByRole("button", { name: t("movies.quotes.add") }).click();

    await expect(page.getByText("Sans amour, on ne vit pas, on survit.")).toBeVisible();
    await context.setOffline(false);
  });
});
