import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";

test("shows progression page", async ({ page }) => {
  await signIn(page);
  await page.goto("/fitness/exercises/squat/progression");
  await expect(page.getByTestId("fitness-progression")).toBeVisible();
});
