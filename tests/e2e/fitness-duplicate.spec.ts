import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";
import { seedFitnessSessionLibrary } from "./fitness-helpers";

test("duplicates workout from history", async ({ page }) => {
  await signIn(page);
  await seedFitnessSessionLibrary(page, "Dup");
  await page.goto("/fitness");
  await page.getByTestId("fitness-free-workout").click();
  await page.getByTestId("fitness-workout-complete").click();
  await page.goto("/fitness/history");
  await page.getByRole("button", { name: /Dupliquer/i }).first().click();
  await expect(page.getByTestId("fitness-workout-editor")).toBeVisible();
});
