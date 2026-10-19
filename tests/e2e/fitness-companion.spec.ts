import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";

test("recovery and adherence settings", async ({ page }) => {
  await signIn(page);
  await page.goto("/fitness/settings");
  await page.getByTestId("fitness-adherence-toggle").check();
  await page.getByRole("button", { name: /Enregistrer/i }).click();
  await page.goto("/");
  await expect(page.getByTestId("home-fitness-card")).toBeVisible();
});
