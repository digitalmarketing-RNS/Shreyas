import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * End-to-end checks against a production build: every /design route in both themes and two
 * widths (screenshots and axe), the theme switch, and font loading. `npm run e2e`.
 * Locally an already running server on port 3100 is reused; in CI a fresh build is started.
 */
export default defineConfig({
  testDir: "./e2e",
  // Traces and failure screenshots go outside the repo, so nothing here is linted or committed.
  outputDir: process.env.PW_OUTPUT_DIR ?? path.join(os.tmpdir(), "crm-web-playwright"),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 90_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
