import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";
import { seedFitnessSessionLibrary } from "./fitness-helpers";

test("logs sets offline", async ({ page, context }) => {
  await signIn(page);
  await seedFitnessSessionLibrary(page, "Log");
  await page.goto("/fitness");
  await page.getByTestId("fitness-free-workout").click();
  await context.setOffline(true);
  await page.getByRole("button", { name: /Ajouter un exercice/i }).click();
  await page.getByTestId("fitness-exercise-search").fill("deadlift");
  await page
    .getByRole("button", { name: /Soulevé de terre/i })
    .first()
    .click();
  await expect(page.getByTestId("fitness-set-reps")).toBeVisible();
  await expect(page.getByTestId("fitness-set-charge")).toBeVisible();
  await page.getByTestId("fitness-set-reps").fill("8");
  await page.getByTestId("fitness-set-charge").fill("100");
  await page.getByTestId("fitness-set-rpe").fill("8");
  await expect(page.getByTestId("fitness-set-reps")).toHaveValue("8");
  await expect(page.getByTestId("fitness-set-charge")).toHaveValue("100");
  await context.setOffline(false);
  await expect(page.getByTestId("fitness-workout-editor")).toBeVisible();
});

test("shows duration-first inputs for cardio exercise", async ({ page }) => {
  await signIn(page);
  await seedFitnessSessionLibrary(page, "Cardio");
  await page.goto("/fitness");
  await page.getByTestId("fitness-free-workout").click();
  await page.getByRole("button", { name: /Ajouter un exercice/i }).click();
  await page.getByTestId("fitness-exercise-search").fill("course");
  await page
    .getByRole("button", { name: /Course à pied/i })
    .first()
    .click();
  const block = page.getByTestId("fitness-exercise-block-course-footing");
  await expect(block.getByTestId("fitness-set-duration")).toBeVisible();
  await expect(block.getByTestId("fitness-set-reps")).toHaveCount(0);
  await expect(block.getByTestId("fitness-set-charge")).toHaveCount(0);
});
