import path from "node:path";
import { defineConfig } from "@playwright/test";

const PORT = 3100;

// Tests run against a production build reading e2e/.data (seeded by scripts/e2e-seed.ts) with no API key,
// so the app is in replay mode. Set E2E_BASE_URL to test a server that is already running.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}` },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `tsx scripts/e2e-seed.ts && pnpm build && pnpm start --port ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        env: { ATLAS_DATA_DIR: path.resolve("e2e/.data"), OPENAI_API_KEY: "", ATLAS_QDRANT_URL: "" },
      },
});
