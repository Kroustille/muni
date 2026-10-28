import { expect, test, type Browser } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { signIn } from "./list-helpers";

const t = (key: keyof typeof fr): string => fr[key];

async function openSecondDevice(browser: Browser, signedInPage: import("@playwright/test").Page) {
  const storageState = await signedInPage.context().storageState();
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  await page.goto("/");
  return { context, page };
}

test.describe("music practice sync", () => {
  test("composition appears on second device after sync", async ({ browser }) => {
    const pageA = await browser.newPage();
    await signIn(pageA);
    const { page: pageB, context: contextB } = await openSecondDevice(browser, pageA);

    await pageA.goto("/music-practice/compositions");
    await pageA.getByTestId("composition-quick-add-title").fill("Sync composition");
    await pageA.getByTestId("composition-quick-add-submit").click();

    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      await pageB.goto("/music-practice/compositions");
      if (await pageB.getByText("Sync composition").isVisible().catch(() => false)) break;
      await pageA.waitForTimeout(500);
    }
    await expect(pageB.getByText("Sync composition")).toBeVisible();
    await contextB.close();
  });

  test("nav entry Musique — pratique", async ({ page }) => {
    await signIn(page);
    await page.goto("/");
    await expect(page.getByRole("link", { name: t("musicPractice.nav") })).toBeVisible();
  });
});
