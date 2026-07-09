import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.SIGNALSMITH_PLAYWRIGHT_PORT ?? 5187);
const baseURL = `http://127.0.0.1:${port.toString()}`;

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  outputDir: "test-results/browser",
  reporter: [["list"]],
  testDir: "tests/browser",
  timeout: 60_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm exec vite --host 127.0.0.1 --port ${port.toString()} --strictPort`,
    reuseExistingServer: false,
    timeout: 30_000,
    url: baseURL,
  },
});
