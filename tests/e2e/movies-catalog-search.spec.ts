import { expect, test } from "@playwright/test";

test.describe("movies catalog search", () => {
  test("search, preview, and save from mocked API", async ({ page }) => {
    await page.route("**/api/movies/search*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              wikidataId: "Q193048",
              title: "Amélie",
              releaseYear: 2001,
              imdbId: "tt0211915",
              mediaKind: "film",
              catalogRating: 8.3,
            },
          ],
        }),
      });
    });

    await page.route("**/api/movies/entity*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          wikidataId: "Q193048",
          title: "Amélie",
          releaseYear: 2001,
          imdbId: "tt0211915",
          mediaKind: "film",
          catalogRating: 8.3,
          synopsis: "Amélie est une serveuse discrète.",
        }),
      });
    });

    await page.goto("/lists/movies");
    await page.getByRole("button", { name: "Rechercher dans le catalogue" }).click();
    await page.getByLabel("Titre du film ou de la série").fill("Amélie");
    await page.getByRole("button", { name: "Rechercher" }).click();
    await page.getByRole("button", { name: "Amélie" }).click();
    await expect(page.getByText("Amélie est une serveuse discrète.")).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("link", { name: "Amélie" })).toBeVisible({ timeout: 10_000 });
  });
});
