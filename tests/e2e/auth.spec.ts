import { expect, test, type Page } from "@playwright/test";
import fr from "../../src/i18n/fr.json";

const t = (key: keyof typeof fr): string => fr[key];
const mailpit = process.env.MAILPIT_URL ?? "http://localhost:8025";

async function readMagicLink(email: string): Promise<string> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const search = await fetch(
      `${mailpit}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    );
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages.length > 0) {
      const res = await fetch(`${mailpit}/api/v1/message/${messages[0].ID}`);
      const { Text } = (await res.json()) as { Text: string };
      const match = Text.match(/https?:\/\/\S+\/auth\/verify\?token=[^\s>"')]+/);
      if (match) return match[0];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No magic link received for ${email}`);
}

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
}

async function requestLink(page: Page, email: string): Promise<string> {
  await page.goto("/sign-in");
  await page.getByLabel(t("signIn.email")).fill(email);
  await page.getByRole("button", { name: t("signIn.sendLink") }).click();
  await expect(page.getByText(t("signIn.linkSent"))).toBeVisible();
  return readMagicLink(email);
}

async function signIn(page: Page): Promise<string> {
  const email = uniqueEmail();
  const link = await requestLink(page, email);
  await page.goto(link);
  await expect(page).toHaveURL("/");
  return email;
}

test.beforeEach(async ({ request }) => {
  await request.delete(`${mailpit}/api/v1/messages`).catch(() => undefined);
});

test("signs in with a magic link read through the Mailpit API", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("link", { name: t("nav.settings") })).toBeVisible();
});

test("a used magic link shows the expired or used message", async ({ page }) => {
  const link = await requestLink(page, uniqueEmail());
  await page.goto(link);
  await expect(page).toHaveURL("/");
  await page.context().clearCookies();
  await page.goto(link);
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByText(t("signIn.linkExpired"))).toBeVisible();
});

test("an invalid magic link shows the expired or used message", async ({ page }) => {
  await page.goto("/auth/verify?token=not-a-real-token");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByText(t("signIn.linkExpired"))).toBeVisible();
});

test("never signed in and offline, the sign-in screen explains the need to connect", async ({
  page,
  context,
}) => {
  await page.goto("/sign-in");
  await expect(page.getByLabel(t("signIn.email"))).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByText(t("signIn.offline"))).toBeVisible();
});

test("reloading offline after sign-in opens the app", async ({ page, context }) => {
  await signIn(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: t("nav.settings") })).toBeVisible();
});

test("an expired session does not block local data", async ({ page }) => {
  await signIn(page);
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: "{}" }),
  );
  await page.reload();
  await expect(page).not.toHaveURL(/\/sign-in/);
  await expect(page.getByRole("link", { name: t("nav.settings") })).toBeVisible();
});

test("signs out from settings", async ({ page }) => {
  await signIn(page);
  await page.getByRole("link", { name: t("nav.settings") }).click();
  await expect(page).toHaveURL(/\/settings/);
  await page.getByRole("button", { name: t("settings.signOut") }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  const session = await page.request.get("/api/auth/session");
  expect(session.status()).toBe(401);
});
