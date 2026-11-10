import { expect, test } from "@playwright/test";

import { addItem, openItem, openList, saveItem, signIn, t } from "./list-helpers";

test.describe("movie watch heatmap", () => {
  test("lights activity after marking a film as watched", async ({ page }) => {
    await signIn(page);
    const title = `Heatmap Film ${Date.now()}`;
    await addItem(page, "movie", title);
    await openList(page, "movies");
    await openItem(page, title);

    await page.getByLabel(t("field.status")).selectOption({ label: t("status.watched") });
    await saveItem(page);

    await page.goto("/movies/insights");
    const heatmap = page.getByTestId("watch-heatmap");
    await expect(heatmap).toBeVisible();
    await expect(heatmap.locator(".bg-accent").first()).toBeVisible();
  });
});
