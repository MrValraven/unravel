import { defineConfig, devices } from "@playwright/test";

const DEV_SERVER_PORT = 5199;
const BASE_URL = `http://localhost:${DEV_SERVER_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    // Dialogs and cards animate; reduced motion keeps screenshots, axe scans and clicks steady.
    contextOptions: { reducedMotion: "reduce" },
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Pixel 7"] } },
    { name: "webkit", use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    command: `npx vite --port ${DEV_SERVER_PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
