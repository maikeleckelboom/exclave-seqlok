import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.SIGNALSMITH_PLAYWRIGHT_PORT ?? 5175);
const baseURL = `http://127.0.0.1:${port.toString()}`;

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  metadata: {
    signalsmithRuntime: "simulator",
  },
  outputDir: "test-results/browser",
  reporter: [["list"]],
  testDir: "tests/browser",
  timeout: 45_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm exec vite --mode simulator --host 127.0.0.1 --port ${port.toString()} --strictPort`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    url: baseURL,
  },
});
