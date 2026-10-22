import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests only (src/**/*.test.ts). The Playwright suite in e2e/ runs with `npm run e2e`.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    // The formatters must match the server's output, so the tests pin Node's ICU results in the
    // org's zone regardless of the machine's TZ.
    env: { TZ: "UTC" },
  },
});
