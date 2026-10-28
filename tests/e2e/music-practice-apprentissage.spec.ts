import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { signIn } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("music practice apprentissage", () => {
  test("instrument, exercise, plan, mark done", async ({ page }) => {
    await signIn(page);
    await page.goto("/music-practice/apprentissage");
    await page.getByTestId("instrument-quick-add").fill("Guitare");
    await page.getByTestId("instrument-quick-add").press("Enter");
    await page.getByTestId("exercise-quick-add").fill("Gamme pentatonique");
    await page.getByTestId("exercise-quick-add").press("Enter");
    await expect(
      page.locator('[data-testid^="exercise-row-"]').filter({ hasText: "Gamme pentatonique" }),
    ).toBeVisible();

    await expect(page.getByTestId("plan-pick-exercise").locator("option", { hasText: "Gamme pentatonique" })).toHaveCount(1);
    await page.getByTestId("plan-pick-exercise").selectOption({ label: "Gamme pentatonique" });
    await page.getByTestId("plan-add-assignment").click();
    await page.getByTestId("plan-save").click();

    const markDone = page.locator("[data-testid^=today-mark-done-]").first();
    await expect(markDone).toBeVisible({ timeout: 10_000 });
    await markDone.click();
    await expect(page.locator("[data-testid^=recent-log-]").first()).toBeVisible();

    await page.getByTestId("piece-quick-add").fill("Blackbird");
    await page.getByTestId("piece-quick-add").press("Enter");
    await expect(page.getByText("Blackbird")).toBeVisible();
  });

  test("empty exercise copy", async ({ page }) => {
    await signIn(page);
    await page.goto("/music-practice/apprentissage");
    await page.getByTestId("exercise-search").fill("zzzz-no-match");
    await expect(page.getByTestId("exercise-empty")).toHaveText(t("musicPractice.empty.exercises"));
  });
});
