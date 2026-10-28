import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";

test.describe("music practice track link", () => {
  test("learning piece shows reference-only picker", async ({ page }) => {
    await signIn(page);
    await page.goto("/music-practice/apprentissage");
    await page.getByTestId("piece-quick-add").fill("Piece ref");
    await page.getByTestId("piece-quick-add").press("Enter");
    await page.getByRole("link", { name: "Piece ref" }).click();
    await expect(page.getByTestId("learning-piece-track-picker")).toBeVisible();
    await expect(page.getByTestId("track-link-search")).toBeVisible();
  });
});
