import { test } from "@playwright/test";

test.describe("catalog multi-add movies", () => {
  test.skip(true, "Requires catalog API fixtures; run in full Docker e2e stack");
});
