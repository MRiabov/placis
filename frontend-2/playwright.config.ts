import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";

const frontendPort = process.env.PLACIS_FRONTEND2_E2E_PORT ?? "5174";
const frontendBaseUrl = `http://127.0.0.1:${frontendPort}`;

const oldAppRoot = path.resolve(__dirname, "../frontend");
const hasOldApp = fs.existsSync(oldAppRoot);
const hasOldCmsClerkHelper = fs.existsSync(
  path.join(oldAppRoot, "e2e/cms/clerkTestConfig.ts"),
);

const webServers = [
  {
    command: `CHOKIDAR_USEPOLLING=1 ./node_modules/.bin/vite --host 127.0.0.1 --port ${frontendPort} --strictPort`,
    url: frontendBaseUrl,
    reuseExistingServer: !process.env.CI,
    // The parity oracle compares deterministic no-auth renders (the old
    // app runs in screenshot mode). CI injects a real
    // VITE_CLERK_PUBLISHABLE_KEY as a project env var, which would activate
    // the port's Clerk auth gate and redirect /cms to /login; pin the port
    // server to no Clerk key so the parity render stays deterministic.
    env: { VITE_CLERK_PUBLISHABLE_KEY: "" },
  },
];
if (hasOldApp) {
  webServers.push({
    // The frozen old app is the parity oracle for the port.
    command:
      "cd ../frontend && CHOKIDAR_USEPOLLING=1 ./node_modules/.bin/vite --host 127.0.0.1 --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    env: { VITE_CLERK_PUBLISHABLE_KEY: "" },
  });
}

const chromiumIgnore = [
  /cms-auth\.setup\.ts/,
  /media-upload\.spec\.ts/,
  ...(hasOldApp ? [] : [/parity\//]),
];

const projects: NonNullable<PlaywrightTestConfig["projects"]> = [
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
    testIgnore: chromiumIgnore,
  },
];
if (hasOldCmsClerkHelper) {
  projects.unshift({
    name: "cms-auth-setup",
    testMatch: /cms-auth\.setup\.ts/,
  });
  projects.push({
    name: "chromium-cms-auth",
    use: { ...devices["Desktop Chrome"] },
    testMatch: /media-upload\.spec\.ts/,
    dependencies: ["cms-auth-setup"],
  });
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  // Default workers (not CI=1). Clerk Frontend API / testing-token specs live
  // in playwright.auth.config.ts with workers: 1 (2 req/s testing tokens).
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  webServer: webServers,
  use: { trace: "retain-on-failure" },
  projects,
});
