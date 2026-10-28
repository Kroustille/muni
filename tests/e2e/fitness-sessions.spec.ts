import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";
import { seedFitnessSessionLibrary } from "./fitness-helpers";

test("deletes session template with undo", async ({ page }) => {
  await signIn(page);
  await seedFitnessSessionLibrary(page, "À supprimer");
  await page.goto("/fitness/sessions");
  await page.getByTestId("fitness-session-template-delete").click();
  await expect(page.getByRole("button", { name: /Annuler/i })).toBeVisible();
  await page.getByRole("button", { name: /Annuler/i }).click();
  await expect(page.getByTestId("fitness-session-template-title")).toHaveValue("À supprimer");
});
