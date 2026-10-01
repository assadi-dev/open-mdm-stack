import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { AUTH_FILE } from "./e2e/support/auth";

if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const isCI = !!process.env.CI;

const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [[isCI ? "github" : "list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "public",
      testMatch: /public\/.*\.spec\.ts/,
      use: desktop,
    },
    {
      name: "authenticated",
      testMatch: /authenticated\/.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...desktop, storageState: AUTH_FILE },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: isCI ? "npm run build && npm run start" : "npm run dev",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
        stderr: "pipe",
      },
});
