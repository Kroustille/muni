import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";

test("logs sets offline", async ({ page, context }) => {
  await signIn(page);
  await page.goto("/fitness/program");
  await page.getByTestId("fitness-program-name").fill("Log");
  await page.getByTestId("fitness-program-save").click();
  await page.goto("/fitness");
  await page.getByTestId("fitness-free-workout").click();
  await context.setOffline(true);
  await page.getByRole("button", { name: /Ajouter un exercice/i }).click();
  await page.getByTestId("fitness-exercise-search").fill("deadlift");
  await page.getByRole("button", { name: /Soulevé de terre/i }).first().click();
  await page.getByTestId("fitness-set-rpe").fill("8");
  await context.setOffline(false);
  await expect(page.getByTestId("fitness-workout-editor")).toBeVisible();
});
