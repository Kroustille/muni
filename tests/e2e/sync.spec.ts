import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import {
  addItem,
  locators,
  openList,
  selectors,
  signIn,
  t,
} from "./list-helpers";

const mailpit = process.env.MAILPIT_URL ?? "http://localhost:8025";

/** SC-003: changes reach other signed-in devices within 10 s of reconnecting. */
const SYNC_WITHIN_MS = 10_000;

const UNDO_MS = 5_000;

async function eventuallyWithinSync(run: () => Promise<void>): Promise<void> {
  const deadline = Date.now() + SYNC_WITHIN_MS;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      await run();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw lastError ?? new Error(`Sync did not complete within ${SYNC_WITHIN_MS}ms`);
}

async function openSecondDevice(
  browser: Browser,
  signedInPage: Page,
): Promise<{ context: BrowserContext; page: Page }> {
  const storageState = await signedInPage.context().storageState();
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("link", { name: t("nav.settings") })).toBeVisible();
  return { context, page };
}

test.beforeEach(async ({ request }) => {
  await request.delete(`${mailpit}/api/v1/messages`).catch(() => undefined);
});

test("two devices converge after offline edits within 10 seconds", async ({ browser }) => {
  const pageA = await browser.newPage();
  await signIn(pageA);
  const { page: pageB, context: contextB } = await openSecondDevice(browser, pageA);

  const sharedTitle = "Dune";
  await addItem(pageA, "book", sharedTitle);
  await eventuallyWithinSync(async () => {
    await openList(pageB, "books");
    await expect(locators.listRow(pageB, sharedTitle)).toBeVisible();
  });

  const contextA = pageA.context();
  await contextA.setOffline(true);
  await contextB.setOffline(true);

  const onlyOnA = "Bel-Ami";
  const onlyOnB = "1984";
  await addItem(pageA, "book", onlyOnA);
  await addItem(pageB, "book", onlyOnB);

  await contextA.setOffline(false);
  await contextB.setOffline(false);

  const titles = [sharedTitle, onlyOnA, onlyOnB];
  for (const page of [pageA, pageB]) {
    await eventuallyWithinSync(async () => {
      await openList(page, "books");
      for (const title of titles) {
        await expect(locators.listRow(page, title)).toBeVisible();
      }
    });
  }

  await contextB.close();
});

test("same-field conflict resolves to the latest edit on both devices", async ({ browser }) => {
  const pageA = await browser.newPage();
  await signIn(pageA);
  const { page: pageB, context: contextB } = await openSecondDevice(browser, pageA);

  const title = "Le Petit Prince";
  await addItem(pageA, "book", title);
  await eventuallyWithinSync(async () => {
    await openList(pageB, "books");
    await expect(locators.itemLink(pageB, title)).toBeVisible();
  });

  const contextA = pageA.context();
  await contextA.setOffline(true);
  await contextB.setOffline(true);

  const earlierNote = "Première version";
  const laterNote = "Dernière version";

  await openList(pageA, "books");
  await locators.itemLink(pageA, title).click();
  await pageA.getByLabel(selectors.fieldNotes).fill(earlierNote);
  await pageA.getByRole("button", { name: selectors.actionSave }).click();

  await openList(pageB, "books");
  await locators.itemLink(pageB, title).click();
  await pageB.getByLabel(selectors.fieldNotes).fill(laterNote);
  await pageB.getByRole("button", { name: selectors.actionSave }).click();

  await contextA.setOffline(false);
  await contextB.setOffline(false);

  for (const page of [pageA, pageB]) {
    await eventuallyWithinSync(async () => {
      await openList(page, "books");
      await locators.itemLink(page, title).click();
      await expect(page.getByLabel(selectors.fieldNotes)).toHaveValue(laterNote);
    });
  }

  await contextB.close();
});

test("delete on one device removes the item on the other after sync", async ({ browser }) => {
  const pageA = await browser.newPage();
  await signIn(pageA);
  const { page: pageB, context: contextB } = await openSecondDevice(browser, pageA);

  const title = "Amélie";
  await addItem(pageA, "movie", title);
  await eventuallyWithinSync(async () => {
    await openList(pageB, "movies");
    await expect(locators.itemLink(pageB, title)).toBeVisible();
  });

  await openList(pageA, "movies");
  await locators.itemLink(pageA, title).click();
  await pageA.getByRole("button", { name: selectors.actionDelete }).click();
  await expect(pageA.getByText(selectors.itemDeleted)).toBeVisible();
  await expect(pageA.getByText(selectors.itemDeleted)).toBeHidden({
    timeout: UNDO_MS + 2_000,
  });

  await eventuallyWithinSync(async () => {
    await openList(pageB, "movies");
    await expect(locators.itemLink(pageB, title)).toHaveCount(0);
  });

  await contextB.close();
});

test("two accounts never see each other's items after syncing", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await signIn(pageA);
  await signIn(pageB);

  const accountAItem = "Beurre secret";
  const accountBItem = "Lait privé";
  await addItem(pageA, "shopping", accountAItem);
  await addItem(pageB, "shopping", accountBItem);

  await eventuallyWithinSync(async () => {
    await openList(pageA, "shopping");
    await expect(locators.listRow(pageA, accountBItem)).toHaveCount(0);
  });

  await eventuallyWithinSync(async () => {
    await openList(pageB, "shopping");
    await expect(locators.listRow(pageB, accountAItem)).toHaveCount(0);
  });

  await contextA.close();
  await contextB.close();
});
