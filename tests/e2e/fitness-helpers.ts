import { expect, type Page } from "@playwright/test";

export async function seedFitnessSessionLibrary(page: Page, title: string): Promise<void> {
  await page.goto("/fitness/sessions");
  await page.getByRole("button", { name: /Ajouter une séance/i }).click();
  await page.getByTestId("fitness-session-template-title").fill(title);
  await page.getByTestId("fitness-session-library-save").click();
  await expect(page).toHaveURL(/\/fitness$/);
}
