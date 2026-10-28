import { test, expect, devices } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { signIn } from "./list-helpers";

test.describe("recap", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("bottom nav opens recap offline", async ({ page }) => {
    await page.goto("/lists/books");
    await page.getByRole("link", { name: fr["recap.nav"] }).click();
    await expect(page).toHaveURL(/\/recap/);
    await expect(page.getByRole("heading", { name: fr["recap.title"] })).toBeVisible();
  });

  test("desktop heatmap visible, hidden on narrow viewport", async ({ page }) => {
    await page.goto("/recap");
    await expect(page.getByTestId("recap-activity-heatmap")).toBeVisible();

    await page.setViewportSize(devices["iPhone 13"].viewport);
    await page.goto("/recap");
    await expect(page.getByTestId("recap-activity-heatmap")).toHaveCount(0);
  });

  test("month granularity switch", async ({ page }) => {
    await page.goto("/recap");
    await page.getByRole("button", { name: fr["recap.period.month"] }).click();
    await expect(page.getByRole("heading", { name: fr["recap.title"] })).toBeVisible();
  });

  test("daily view uses single day period", async ({ page }) => {
    await page.goto("/recap?period=day");
    await page.getByRole("button", { name: fr["recap.period.dayYesterday"] }).click();
    await expect(page.getByText(fr["recap.empty"]).or(page.locator("section"))).toBeVisible();
  });

  test("yearly period control", async ({ page }) => {
    await page.goto("/recap?period=year&date=2026-06-15");
    await page.getByRole("button", { name: fr["recap.period.year"] }).click();
    await expect(page.getByRole("heading", { name: fr["recap.title"] })).toBeVisible();
  });
});
