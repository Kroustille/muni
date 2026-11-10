import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";
import { seedFitnessSessionLibrary } from "./fitness-helpers";

test("duplicates workout from history", async ({ page }) => {
  await signIn(page);
  await seedFitnessSessionLibrary(page, "Dup");
  await page.goto("/fitness");
  await page.getByTestId("fitness-free-workout").click();
  await page.getByTestId("fitness-workout-complete").click();
  // Completing writes asynchronously; duplicating is refused while a workout
  // is still in progress, so retry until the completion has landed.
  await expect(async () => {
    await page.goto("/fitness/history");
    await page
      .getByRole("button", { name: /Dupliquer/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/fitness\/workout\//, { timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
  await expect(page.getByTestId("fitness-workout-editor")).toBeVisible();
});
