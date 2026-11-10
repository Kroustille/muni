import { expect, test } from "@playwright/test";

import { signIn, t } from "./list-helpers";

test("Souvenirs and Progression hubs are reachable with calm empty states", async ({ page }) => {
  await signIn(page);
  const sidebar = page.getByRole("complementary", { name: "Navigation principale" });

  await sidebar.getByRole("link", { name: t("memories.nav") }).click();
  await expect(page).toHaveURL(/\/souvenirs$/);
  await expect(page.getByTestId("memories-timeline-empty")).toHaveText(
    t("memories.timeline.empty"),
  );

  await page.getByTestId("memories-tab-list").click();
  await expect(page).toHaveURL(/\/souvenirs\/liste$/);
  await expect(page.getByTestId("memories-list-empty")).toBeVisible();

  await sidebar.getByRole("link", { name: t("progression.nav") }).click();
  await expect(page).toHaveURL(/\/progression$/);
  await expect(page.getByTestId("progression-goals-empty")).toBeVisible();

  await page.getByTestId("progression-tab-achievements").click();
  await expect(page).toHaveURL(/\/progression\/realisations$/);
  await expect(page.getByTestId("progression-achievements-empty")).toBeVisible();
});
