import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";
import { seedFitnessSessionLibrary } from "./fitness-helpers";

test.describe("fitness today", () => {
  test("starts free workout and completes", async ({ page }) => {
    await signIn(page);
    await seedFitnessSessionLibrary(page, "Test");
    await page.goto("/fitness");
    await page.getByTestId("fitness-free-workout").click();
    await expect(page.getByTestId("fitness-workout-editor")).toBeVisible();
    await page.getByTestId("fitness-workout-complete").click();
  });
});
