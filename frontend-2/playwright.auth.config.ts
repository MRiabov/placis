import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "vite";

// Load local env the same way the old frontend's config did: frontend-2,
// repo root, and ../frontend (the vite envDir where frontend/.env.local holds
// the real Clerk keys). Vars already set in the process env win.
const env = loadEnv("", process.cwd(), "");
for (const [key, value] of Object.entries(env)) {
  process.env[key] ??= value;
}
const rootEnv = loadEnv("", path.resolve(process.cwd(), ".."), "");
for (const [key, value] of Object.entries(rootEnv)) {
  process.env[key] ??= value;
}
const frontendEnv = loadEnv("", path.resolve(process.cwd(), "../frontend"), "");
for (const [key, value] of Object.entries(frontendEnv)) {
  process.env[key] ??= value;
}
process.env.CLERK_PUBLISHABLE_KEY ??= process.env.VITE_CLERK_PUBLISHABLE_KEY;

// Dedicated port so this suite never reuses the parity/dev servers on 5173/5174.
const authPort = process.env.PLACIS_FRONTEND2_AUTH_E2E_PORT ?? "5176";
const authBaseUrl = `http://127.0.0.1:${authPort}`;

export default defineConfig({
  testDir: "./e2e/auth",
  timeout: 60_000,
  // Clerk testing tokens are 2 req/s (mint + Frontend API). This whole config
  // hits sign-in / bot-protection; keep one worker. Mint once in clerk-setup.
  workers: 1,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  webServer: {
    command: `CHOKIDAR_USEPOLLING=1 ./node_modules/.bin/vite --host 127.0.0.1 --port ${authPort} --strictPort`,
    url: authBaseUrl,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: authBaseUrl,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "clerk-setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["clerk-setup"],
      testIgnore: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
