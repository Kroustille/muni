import { expect, test } from "@playwright/test";

test.describe("books catalog (desktop)", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("does not show scan control on books list", async ({ page }) => {
    await page.goto("/lists/books");
    await expect(page.getByRole("button", { name: "Scanner" })).toHaveCount(0);
  });
});
