import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { signIn } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("fitness program", () => {
  test("creates program offline", async ({ page, context }) => {
    await signIn(page);
    await page.goto("/fitness/program");
    await page.getByTestId("fitness-program-name").fill("Force 3x");
    await context.setOffline(true);
    await page.getByTestId("fitness-program-save").click();
    await expect(page).toHaveURL(/\/fitness$/);
    await context.setOffline(false);
  });
});
