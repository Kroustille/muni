import { expect, test } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { signIn } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

test.describe("music practice compositions", () => {
  test("quick add and session note offline persistence", async ({ page, context }) => {
    await signIn(page);
    await page.goto("/music-practice/compositions");
    await expect(page.getByTestId("music-practice-tabs")).toBeVisible();
    await page.getByTestId("composition-quick-add-title").fill("Pad dub mars");
    await page.getByTestId("composition-quick-add-submit").click();
    await expect(page.getByText("Pad dub mars")).toBeVisible();

    await page.getByRole("link", { name: "Pad dub mars" }).click();
    await page.getByTestId("composition-note-text").fill("Session du jour");
    await page.getByTestId("composition-note-submit").click();
    await expect(page.getByTestId("composition-session-notes")).toContainText("Session du jour");

    await context.setOffline(true);
    await page.getByTestId("composition-note-text").fill("Hors ligne");
    await page.getByTestId("composition-note-submit").click();
    await expect(page.getByTestId("composition-session-notes")).toContainText("Hors ligne");
    await context.setOffline(false);
  });

  test("empty state copy SC-004", async ({ page }) => {
    await signIn(page);
    await page.goto("/music-practice/compositions");
    await expect(page.getByTestId("composition-empty")).toHaveText(t("musicPractice.empty.compositions"));
  });
});
