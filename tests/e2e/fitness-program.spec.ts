import { expect, test } from "@playwright/test";
import { signIn } from "./list-helpers";

test.describe("fitness session library", () => {
  test("creates templates offline", async ({ page, context }) => {
    await signIn(page);
    await page.goto("/fitness/sessions");
    await page.getByRole("button", { name: /Ajouter une séance/i }).click();
    await page.getByTestId("fitness-session-template-title").fill("Force 3x");
    await context.setOffline(true);
    // Save writes locally, then navigates to /fitness; wait for that navigation
    // request so reconnecting cannot interrupt the write.
    const leaving = page.waitForRequest(
      (request) => request.isNavigationRequest() && new URL(request.url()).pathname === "/fitness",
    );
    await page.getByTestId("fitness-session-library-save").click();
    await leaving;
    // The template is written locally while offline. The post-save route change
    // needs the network today, so verify persistence after reconnecting.
    await context.setOffline(false);
    await page.goto("/fitness/sessions");
    await expect
      .poll(() =>
        page
          .getByTestId("fitness-session-template-title")
          .evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value)),
      )
      .toContain("Force 3x");
  });
});
