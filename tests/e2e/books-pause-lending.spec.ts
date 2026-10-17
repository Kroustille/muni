import { expect, test } from "@playwright/test";

import fr from "../../src/i18n/fr.json";
import {
  addItem,
  locators,
  openList,
  selectors,
  signIn,
  t,
} from "./list-helpers";

test.describe("book pause and lending", () => {
  test("pause with pages read, lend, and return", async ({ page }) => {
    await signIn(page);
    const title = "Le Comte de Monte-Cristo";
    await addItem(page, "book", title);
    await openList(page, "books");
    await locators.itemLink(page, title).click();

    await page.getByLabel(t("field.status")).selectOption({ label: t("status.paused") });
    await page.getByLabel(t("books.pagesRead")).fill("120");
    await page.getByLabel(t("books.loan.to")).fill("Alex");
    await page.getByLabel(t("books.loan.since")).fill("2026-03-10");
    await page.getByRole("button", { name: selectors.actionSave }).click();

    await page.reload();
    await expect(page.getByLabel(t("field.status"))).toHaveValue("paused");
    await expect(page.getByLabel(t("books.pagesRead"))).toHaveValue("120");
    await expect(page.getByLabel(t("books.loan.to"))).toHaveValue("Alex");

    await page.getByRole("button", { name: t("books.loan.return") }).click();
    await page.reload();
    await expect(page.getByLabel(t("books.loan.to"))).toHaveValue("");

    await page.getByLabel(t("field.status")).selectOption({ label: selectors.statusReading });
    await page.getByRole("button", { name: selectors.actionSave }).click();
    await page.reload();
    await expect(page.getByLabel(t("field.status"))).toHaveValue("reading");
  });
});
