import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";

test("duplicates workout from history", async ({ page }) => {
  await signIn(page);
  await page.goto("/fitness/program");
  await page.getByTestId("fitness-program-name").fill("Dup");
  await page.getByTestId("fitness-program-save").click();
  await page.goto("/fitness");
  await page.getByTestId("fitness-free-workout").click();
  await page.getByTestId("fitness-workout-complete").click();
  await page.goto("/fitness/history");
  await page.getByRole("button", { name: /Dupliquer/i }).first().click();
  await expect(page.getByTestId("fitness-workout-editor")).toBeVisible();
});
