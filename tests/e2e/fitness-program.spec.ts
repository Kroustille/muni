import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";

test.describe("fitness session library", () => {
  test("creates templates offline", async ({ page, context }) => {
    await signIn(page);
    await page.goto("/fitness/sessions");
    await page.getByRole("button", { name: /Ajouter une séance/i }).click();
    await page.getByTestId("fitness-session-template-title").fill("Force 3x");
    await context.setOffline(true);
    await page.getByTestId("fitness-session-library-save").click();
    await expect(page).toHaveURL(/\/fitness$/);
    await context.setOffline(false);
  });
});
