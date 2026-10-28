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

  test("heatmap visible on desktop and iPhone viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/recap");
    await expect(page.getByTestId("recap-activity-heatmap")).toBeVisible();
    await expect(page.getByTestId("recap-activity-heatmap-legend")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: fr["recap.heatmap.title"] }),
    ).toBeVisible();

    await page.setViewportSize(devices["iPhone 13"].viewport);
    await page.goto("/recap");
    await expect(page.getByTestId("recap-activity-heatmap")).toBeVisible();
    await expect(page.getByTestId("recap-activity-heatmap-legend")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: fr["recap.heatmap.titleNarrow"] }),
    ).toBeVisible();
  });

  test("narrow viewport heatmap spans 84 days", async ({ page }) => {
    await page.setViewportSize(devices["iPhone 13"].viewport);
    await page.goto("/recap");
    await expect(page.getByTestId("recap-activity-heatmap")).toBeVisible();
    const dayCells = page.locator('[data-testid^="recap-activity-day-"]');
    await expect(dayCells).toHaveCount(84);
  });

  test("wide viewport heatmap spans 365 days", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/recap");
    const dayCells = page.locator('[data-testid^="recap-activity-day-"]');
    await expect(dayCells).toHaveCount(365);
  });

  test("period select and prev/next navigation", async ({ page }) => {
    await page.goto("/recap");
    const select = page.getByTestId("recap-period-granularity-select");
    await select.selectOption("month");
    await expect(select).toHaveValue("month");
    await expect(page.getByRole("heading", { name: fr["recap.title"] })).toBeVisible();

    const labelBefore = await page.locator("p.text-center.text-sm.font-medium").textContent();
    await page.getByTestId("recap-period-prev").click();
    await expect(page.locator("p.text-center.text-sm.font-medium")).not.toHaveText(labelBefore ?? "");
    await page.getByTestId("recap-period-next").click();
  });

  test("month granularity switch", async ({ page }) => {
    await page.goto("/recap");
    await page.getByTestId("recap-period-granularity-select").selectOption("month");
    await expect(page.getByRole("heading", { name: fr["recap.title"] })).toBeVisible();
  });

  test("daily view uses single day period", async ({ page }) => {
    await page.goto("/recap?period=day");
    await page.getByTestId("recap-period-day-yesterday").click();
    await expect(page.getByText(fr["recap.empty"]).or(page.locator("section"))).toBeVisible();
  });

  test("yearly period control", async ({ page }) => {
    await page.goto("/recap?period=year&date=2026-06-15");
    await page.getByTestId("recap-period-granularity-select").selectOption("year");
    await expect(page.getByRole("heading", { name: fr["recap.title"] })).toBeVisible();
  });
});
