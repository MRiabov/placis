import { defineConfig, devices } from "@playwright/test";

const frontendPort = process.env.PLACIS_FRONTEND2_E2E_PORT ?? "5174";
const frontendBaseUrl = `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  testDir: "./e2e",
  // Cold CI workers transform the frozen old app's dev bundle slowly; the
  // parity waits are defensive (domcontentloaded + catch'd networkidle), so
  // the budget goes to the first-cold goto, not the assertion.
  timeout: 90_000,
  workers: process.env.CI ? 1 : undefined,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  webServer: [
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
    {
      // The frozen old app is the parity oracle for the port.
      command:
        "cd ../frontend && CHOKIDAR_USEPOLLING=1 ./node_modules/.bin/vite --host 127.0.0.1 --port 5173 --strictPort",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
    },
  ],
  use: { trace: "retain-on-failure" },
  projects: [
    {
      name: "cms-auth-setup",
      testMatch: /cms-auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/cms-auth\.setup\.ts/, /media-upload\.spec\.ts/],
    },
    {
      name: "chromium-cms-auth",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /media-upload\.spec\.ts/,
      dependencies: ["cms-auth-setup"],
    },
  ],
});
