import { test } from "@playwright/test";

test.describe("catalog multi-add books", () => {
  test.skip(true, "Requires catalog API fixtures; run in full Docker e2e stack");
});
