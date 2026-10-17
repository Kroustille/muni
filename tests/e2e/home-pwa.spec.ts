import { expect, test, type Page } from "@playwright/test";
import fr from "../../src/i18n/fr.json";
import {
  addItem,
  listTitle,
  signIn,
  t,
  type ListRoute,
} from "./list-helpers";

const listRoutes: ListRoute[] = ["shopping", "books", "movies", "recipes"];

const home = {
  emptyState: (page: Page) => page.getByText(t("home.empty")),
  recentRegion: (page: Page) => page.getByRole("region", { name: t("home.recent") }),
  recentItems: (page: Page) => home.recentRegion(page).getByRole("listitem"),
  listCard: (page: Page, type: ListRoute) =>
    page.getByRole("region", { name: listTitle(type) }),
};

async function expectListCount(page: Page, type: ListRoute, count: number): Promise<void> {
  const card = home.listCard(page, type);
  await expect(card).toBeVisible();
  await expect(card.getByText(String(count), { exact: true })).toBeVisible();
}

async function bodyBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test.beforeEach(async ({ request }) => {
  const mailpit = process.env.MAILPIT_URL ?? "http://localhost:8025";
  await request.delete(`${mailpit}/api/v1/messages`).catch(() => undefined);
});

test("shows the first-launch empty state with a zero count on each list card", async ({
  page,
}) => {
  await signIn(page);
  await expect(page).toHaveURL("/");

  await expect(home.emptyState(page)).toBeVisible();
  for (const type of listRoutes) {
    await expectListCount(page, type, 0);
  }
  await expect(home.recentRegion(page)).toHaveCount(0);
});

test("shows per-list counts and recent items newest first on home", async ({ page }) => {
  await signIn(page);
  await addItem(page, "shopping", "Pain");
  await addItem(page, "shopping", "Beurre");
  await addItem(page, "book", "Les Misérables");
  await addItem(page, "movie", "Le Fabuleux Destin d'Amélie Poulain");

  await page.goto("/");
  await expect(home.emptyState(page)).toHaveCount(0);

  await expectListCount(page, "shopping", 2);
  await expectListCount(page, "books", 1);
  await expectListCount(page, "movies", 1);
  await expectListCount(page, "recipes", 0);

  const recent = home.recentItems(page);
  await expect(recent).toHaveCount(4);
  await expect(recent.nth(0)).toContainText("Le Fabuleux Destin d'Amélie Poulain");
  await expect(recent.nth(0)).toContainText(t("type.movie"));
  await expect(recent.nth(1)).toContainText("Les Misérables");
  await expect(recent.nth(1)).toContainText(t("type.book"));
  await expect(recent.nth(2)).toContainText("Beurre");
  await expect(recent.nth(2)).toContainText(t("type.shopping"));
  await expect(recent.nth(3)).toContainText("Pain");
  await expect(recent.nth(3)).toContainText(t("type.shopping"));
});

const INK_TEAL_LIGHT_BG = "rgb(244, 246, 248)";
const INK_TEAL_DARK_BG = "rgb(2, 6, 23)";

test("follows the system color scheme for light and dark theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await signIn(page);
  await expect(await bodyBackground(page)).toBe(INK_TEAL_DARK_BG);

  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  await expect(await bodyBackground(page)).toBe(INK_TEAL_LIGHT_BG);
});

test("applies forced light and dark themes from settings", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await signIn(page);
  await page.goto("/settings");

  await page.getByRole("button", { name: fr["settings.theme.light"], pressed: false }).click();
  await expect(await bodyBackground(page)).toBe(INK_TEAL_LIGHT_BG);

  await page.getByRole("button", { name: fr["settings.theme.dark"], pressed: false }).click();
  await expect(await bodyBackground(page)).toBe(INK_TEAL_DARK_BG);

  await page.getByRole("button", { name: fr["settings.theme.system"], pressed: false }).click();
  await expect(await bodyBackground(page)).toBe(INK_TEAL_DARK_BG);
});

test("serves a standalone French PWA manifest", async ({ page, request }) => {
  await signIn(page);
  const manifestUrl = new URL("/manifest.webmanifest", page.url()).toString();
  const response = await request.get(manifestUrl);
  expect(response.ok()).toBeTruthy();

  const manifest = (await response.json()) as {
    name?: string;
    display?: string;
    icons?: { src: string }[];
  };
  expect(manifest.name).toBe(fr["app.name"]);
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons?.length).toBeGreaterThan(0);
});

test("registers a service worker that controls the app", async ({ page }) => {
  await signIn(page);
  await page.evaluate(() => navigator.serviceWorker.ready);

  const controlled = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(registration?.active);
  });
  expect(controlled).toBe(true);
});

test("reloads the home screen offline after the shell is cached", async ({ page, context }) => {
  await signIn(page);
  await addItem(page, "recipe", "Tarte tatin");
  await page.goto("/");
  await expect(home.recentItems(page).first()).toContainText("Tarte tatin");
  await expect(home.recentItems(page).first()).toContainText(t("type.recipe"));

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();

  await expect(page).toHaveURL("/");
  await expect(home.recentItems(page).first()).toContainText("Tarte tatin");
  await expect(page.getByRole("link", { name: t("nav.settings") })).toBeVisible();
});
