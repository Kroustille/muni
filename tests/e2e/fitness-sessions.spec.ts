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

test("shows French exercise labels and can remove from template", async ({ page }) => {
  await signIn(page);
  await page.goto("/fitness/sessions");
  await page.getByRole("button", { name: /Ajouter une séance/i }).click();
  await page.getByRole("button", { name: /Ajouter un exercice/i }).click();
  await page.getByTestId("fitness-exercise-search").fill("pompes");
  await page
    .getByRole("button", { name: /^Pompes$/i })
    .first()
    .click();
  await expect(page.getByTestId("fitness-session-exercise-label-pompes")).toHaveText("Pompes");
  await page.getByTestId("fitness-session-template-exercise-remove").click();
  await expect(page.getByTestId("fitness-session-exercise-label-pompes")).toHaveCount(0);
});
