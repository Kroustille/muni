import { expect, test } from "@playwright/test";

test.describe("books lookup failure (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test("offers manual add when lookup returns not found", async ({ page }) => {
    await page.route("**/api/books/lookup*", async (route) => {
      await route.fulfill({ status: 404, contentType: "application/json", body: '{"error":"not_found"}' });
    });

    await page.goto("/lists/books");
    const isbnInput = page.getByLabel("ISBN");
    if (await isbnInput.count() === 0) {
      test.skip(true, "ISBN lookup UI not on this entry point");
    }
    await isbnInput.fill("9780000000000");
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(page.getByText("Ajouter manuellement")).toBeVisible({ timeout: 10_000 });
  });
});
