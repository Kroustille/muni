import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { signIn } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("fitness today", () => {
  test("starts free workout and completes", async ({ page }) => {
    await signIn(page);
    await page.goto("/fitness/program");
    await page.getByTestId("fitness-program-name").fill("Test");
    await page.getByTestId("fitness-program-save").click();
    await expect(page).toHaveURL(/\/fitness$/);
    await page.goto("/fitness");
    await page.getByTestId("fitness-free-workout").click();
    await expect(page.getByTestId("fitness-workout-editor")).toBeVisible();
    await page.getByTestId("fitness-workout-complete").click();
  });
});
