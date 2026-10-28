import { expect, test, type Page } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import { signIn, t } from "./list-helpers";

const suggestionsTitle = fr["suggestions.title"];

async function seedStaleBookAndRecipe(page: Page): Promise<void> {
  await page.goto("/lists/books");
  await page.getByRole("button", { name: t("action.add") }).click();
  await page.getByLabel(t("field.title")).fill("Livre stale");
  await page.getByRole("button", { name: t("action.save") }).click();

  await page.goto("/lists/recipes");
  await page.getByRole("button", { name: t("action.add") }).click();
  await page.getByLabel(t("field.title")).fill("Recette stale");
  await page.getByRole("button", { name: t("action.save") }).click();

  await page.evaluate(async () => {
    const openReq = indexedDB.open("muni");
    await new Promise<void>((resolve, reject) => {
      openReq.onerror = () => reject(openReq.error);
      openReq.onsuccess = () => {
        const db = openReq.result;
        const tx = db.transaction("items", "readwrite");
        const store = tx.objectStore("items");
        const oldIso = "2025-06-01T10:00:00.000Z";
        const req = store.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) return;
          const item = cursor.value as {
            type: string;
            title: string;
            createdAt: string;
            fieldsUpdatedAt: Record<string, string>;
            status: string | null;
          };
          if (item.title === "Livre stale" && item.type === "book") {
            item.status = "to_read";
            item.createdAt = oldIso;
            item.fieldsUpdatedAt = { ...item.fieldsUpdatedAt, status: oldIso };
            cursor.update(item);
          }
          if (item.title === "Recette stale" && item.type === "recipe") {
            item.createdAt = oldIso;
            item.fieldsUpdatedAt = { ...item.fieldsUpdatedAt };
            cursor.update(item);
          }
          cursor.continue();
        };
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
}

test.beforeEach(async ({ request }) => {
  const mailpit = process.env.MAILPIT_URL ?? "http://localhost:8025";
  await request.delete(`${mailpit}/api/v1/messages`).catch(() => undefined);
});

test("shows two suggestions on Accueil when pool allows", async ({ page }) => {
  await signIn(page);
  await seedStaleBookAndRecipe(page);
  await page.goto("/");

  const card = page.getByTestId("activity-suggestions-card");
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(suggestionsTitle)).toBeVisible();
  await expect(card.getByRole("listitem")).toHaveCount(2);
});

test("keeps the same snapshot when revisiting Accueil same day", async ({ page }) => {
  await signIn(page);
  await seedStaleBookAndRecipe(page);
  await page.goto("/");
  await expect(page.getByTestId("activity-suggestions-card")).toBeVisible({ timeout: 15_000 });
  const firstTitles = await page.getByTestId("activity-suggestions-card").locator("li p").allTextContents();
  await page.goto("/lists/books");
  await page.goto("/");
  const secondTitles = await page.getByTestId("activity-suggestions-card").locator("li p").allTextContents();
  expect(secondTitles).toEqual(firstTitles);
});

test("dismisses a row without backfill until refresh", async ({ page }) => {
  await signIn(page);
  await seedStaleBookAndRecipe(page);
  await page.goto("/");
  const card = page.getByTestId("activity-suggestions-card");
  await expect(card).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: fr["suggestions.action.dismiss"] }).first().click();
  await expect(page.getByRole("button", { name: fr["suggestions.action.dismiss"] })).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("button", { name: fr["suggestions.action.dismiss"] })).toHaveCount(1);
});

test("primary action navigates to item detail", async ({ page }) => {
  await signIn(page);
  await seedStaleBookAndRecipe(page);
  await page.goto("/");
  await expect(page.getByTestId("activity-suggestions-card")).toBeVisible({ timeout: 15_000 });
  await page
    .getByRole("button", { name: new RegExp(fr["suggestions.action.open"]) })
    .first()
    .click();
  await expect(page).toHaveURL(/\/items\//);
});

test("manual refresh recomputes while respecting dismissals", async ({ page }) => {
  await signIn(page);
  await seedStaleBookAndRecipe(page);
  await page.goto("/");
  await expect(page.getByTestId("activity-suggestions-card")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: fr["suggestions.action.dismiss"] }).first().click();
  await page.getByRole("button", { name: fr["suggestions.action.refresh"] }).click();
  await expect(page.getByRole("button", { name: fr["suggestions.action.dismiss"] })).toHaveCount(1);
});
