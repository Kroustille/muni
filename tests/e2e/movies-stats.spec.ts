import { expect, test } from "@playwright/test";

import { addItem, signIn, t } from "./list-helpers";

test.describe("movie stats page", () => {
  test("smoke: insights stats section renders", async ({ page }) => {
    await signIn(page);
    await addItem(page, "movie", "Statistiques Film Test");
    await page.goto("/movies/insights");
    const stats = page.getByTestId("movie-stats");
    await expect(stats).toBeVisible();
    await expect(stats.getByRole("heading", { name: t("movies.insights.stats") })).toBeVisible();
    await expect(page.getByTestId("watch-heatmap")).toBeVisible();
  });
});
