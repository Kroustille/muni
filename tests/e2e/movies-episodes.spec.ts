import { expect, test } from "@playwright/test";

import fr from "../../src/i18n/fr.json";
import { listPath, locators, openItem, signIn } from "./list-helpers";

// Serwist routes /api/* through the service worker, which bypasses page.route mocks.
test.use({ serviceWorkers: "block" });

const t = (key: keyof typeof fr): string => fr[key];

test.describe("movie episode progress smoke", () => {
  test("marks épisode vu on série saved from mocked catalog", async ({ page }) => {
    await page.route("**/api/movies/search*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              wikidataId: "Q23640",
              title: "Série Fixture",
              releaseYear: 2020,
              imdbId: "tt0944947",
              mediaKind: "series",
              catalogRating: 9,
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
          wikidataId: "Q23640",
          title: "Série Fixture",
          releaseYear: 2020,
          imdbId: "tt0944947",
          mediaKind: "series",
          catalogRating: 9,
          synopsis: "Résumé série.",
        }),
      });
    });

    await signIn(page);
    await page.goto(listPath("movies"));
    await page.getByRole("button", { name: "Rechercher dans le catalogue" }).click();
    await page.getByLabel("Titre du film ou de la série").fill("Série");
    await page.getByRole("button", { name: "Rechercher", exact: true }).click();
    await page.getByRole("button", { name: "Série Fixture" }).click();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await openItem(page, "Série Fixture");

    await expect(page.getByRole("heading", { name: t("movies.episodes.title") })).toBeVisible();
    await page.getByRole("button", { name: "S1E1" }).click();
    await expect(page.getByTestId("next-episode-banner")).toContainText("S1E2");
    await page.reload();
    await expect(page.getByRole("button", { name: /^S1E1/ })).toContainText("✓");
  });
});
