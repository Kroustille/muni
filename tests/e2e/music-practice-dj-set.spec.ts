import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";

test.describe("music practice dj sets", () => {
  test("creates set with setlist and marks performed", async ({ page }) => {
    await signIn(page);
    await page.goto("/music-practice/dj-sets");
    await page.getByTestId("dj-set-quick-add-title").fill("Set salon");
    await page.getByTestId("dj-set-quick-add-submit").click();
    await page.getByRole("link", { name: "Set salon" }).click();
    await page.getByTestId("dj-set-setlist-line-text").fill("Track 1");
    await page.getByTestId("dj-set-setlist-add").click();
    await expect(page.getByTestId("dj-set-setlist")).toContainText("Track 1");
    await page.getByTestId("dj-set-transition-performed").click();
    await expect(page.getByTestId("dj-set-status")).toHaveValue("performed");
  });

  test("cancel flow hidden until filter", async ({ page }) => {
    await signIn(page);
    await page.goto("/music-practice/dj-sets");
    await page.getByTestId("dj-set-quick-add-title").fill("Set annulé");
    await page.getByTestId("dj-set-quick-add-submit").click();
    await page.getByRole("link", { name: "Set annulé" }).click();
    await page.getByTestId("dj-set-cancel").click();
    await page.goto("/music-practice/dj-sets");
    await expect(page.getByText("Set annulé")).not.toBeVisible();
    await page.getByTestId("dj-set-show-cancelled").check();
    await expect(page.getByText("Set annulé")).toBeVisible();
  });
});
