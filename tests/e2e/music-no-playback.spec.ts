import { test, expect } from "@playwright/test";

test.describe("music pages have no in-app playback", () => {
  test("artist and track list pages contain no audio elements", async ({ page }) => {
    await page.goto("/music/artists");
    await expect(page.locator("audio")).toHaveCount(0);
    await page.goto("/music/tracks");
    await expect(page.locator("audio")).toHaveCount(0);
  });
});
