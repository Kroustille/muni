import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { signIn } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("plants garden", () => {
  test("quick-adds a plant offline-capable flow", async ({ page }) => {
    await signIn(page);
    await page.goto("/plants");
    await expect(page.getByTestId("plant-list")).toBeVisible();
    await page.getByTestId("plant-quick-add-input").fill("Monstera");
    await page.getByTestId("plant-quick-add-submit").click();
    await expect(page.getByRole("link", { name: "Monstera" })).toBeVisible();
  });

  test("records watering with same-day dedupe", async ({ page }) => {
    await signIn(page);
    await page.goto("/plants");
    await page.getByTestId("plant-quick-add-input").fill("Ficus");
    await page.getByTestId("plant-quick-add-submit").click();
    await page.getByRole("link", { name: "Ficus" }).click();
    await expect(page.getByTestId("plant-detail")).toBeVisible();

    await page.getByTestId("plant-water-button").click();
    await expect(page.getByTestId("plant-last-watered")).toContainText(t("plants.lastWatered.today"));

    await page.getByTestId("plant-water-button").click();
    await expect(page.getByText(t("plants.dedupe.today"))).toBeVisible();
  });
});
