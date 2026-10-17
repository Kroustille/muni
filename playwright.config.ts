import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3000);
const skipWebServerBuild = process.env.PLAYWRIGHT_SKIP_WEBSERVER_BUILD === "1";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: skipWebServerBuild ? "yarn start" : "yarn run build && yarn run start",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: skipWebServerBuild ? 120_000 : 180_000,
  },
});
