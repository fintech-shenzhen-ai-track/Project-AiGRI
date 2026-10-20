import { defineConfig } from "@playwright/test";

// The e2e suite runs against a Next.js server it starts itself (production build), so it does not
// need the Docker stack. Set E2E_BASE_URL to run against an already running stack instead.
const externalBase = process.env.E2E_BASE_URL;
const port = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: externalBase ?? `http://127.0.0.1:${port}`,
    reducedMotion: "reduce",
  },
  projects: [
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 900 } } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: externalBase
    ? undefined
    : {
        command: `pnpm exec next build && pnpm exec next start -p ${port} -H 127.0.0.1`,
        url: `http://127.0.0.1:${port}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
        env: { NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" },
      },
});
