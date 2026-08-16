import { createClerkClient } from "@clerk/backend";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { type Page, test as setup } from "@playwright/test";

import {
  ensureClerkE2eUser,
  hasClerkTestConfig,
  requireClerkTestConfig,
} from "../../frontend/e2e/cms/clerkTestConfig";
import { f2ClerkStorageStatePath, hasClerkTestingToken } from "./authConfig";

const APP_BASE_URL =
  process.env.PLACIS_FRONTEND2_E2E_URL ?? "http://127.0.0.1:5174";

requireClerkTestConfig("frontend-2 CMS Clerk setup");

setup.describe("frontend-2 CMS Clerk setup", () => {
  setup.describe.configure({ mode: "serial" });
  setup.skip(
    !hasClerkTestConfig,
    "frontend-2 CMS Clerk E2E setup requires test keys or CLERK_TESTING_TOKEN.",
  );

  setup("authenticate CMS Clerk user", async ({ page }) => {
    const { email, password } = await ensureClerkE2eUser();
    await ensurePlacisPlatformAdmin();
    if (hasClerkTestingToken) {
      await setupClerkTestingToken({ page });
    }
    await signInF2TestUser(page, email, password);
    // Select a Placis tenant so the editor resolves a real org.
    await selectPlacisTenant(page);
    await page
      .getByRole("button", { name: "New chat" })
      .waitFor({ timeout: 20_000 });
    await page.context().storageState({ path: f2ClerkStorageStatePath });
  });
});

/** The real backend derives Placis platform role from the Clerk user's
 *  public_metadata.placis_platform_role; a platform admin sees all tenants
 *  through /me, which is what the editor needs. Kept out of the frozen
 *  old-app test helpers. */
async function ensurePlacisPlatformAdmin(): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return;
  }
  const client = createClerkClient({
    apiUrl: process.env.CLERK_API_URL ?? "https://api.clerk.com",
    secretKey,
  });
  const email = process.env.CLERK_E2E_EMAIL ?? "placis+clerk_test@example.com";
  const { data: users } = await client.users.getUserList({
    emailAddress: [email],
  });
  const userId = users[0]?.id;
  if (!userId) {
    return;
  }
  await client.users.updateUser(userId, {
    publicMetadata: { placis_platform_role: "platform_admin" },
  });
}

async function signInF2TestUser(page: Page, email: string, password: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(`${APP_BASE_URL}/login`);
      // Clerk may already hold a session (dev instance): the app then lands
      // directly on the Placis org chooser without a sign-in form.
      const emailInput = page
        .locator('input[name="emailAddress"], input[type="email"]')
        .first();
      await emailInput.waitFor({ timeout: 15_000 });
      await emailInput.fill(email);
      const passwordInput = page
        .locator('input[name="password"], input[type="password"]')
        .first();
      await passwordInput.waitFor({ timeout: 10_000 });
      await passwordInput.fill(password);
      await page
        .getByRole("button", { name: /continue|sign in/i })
        .first()
        .click();
      return;
    } catch (error) {
      lastError = error;
      // If the org chooser is already visible we are authenticated.
      if (
        await page
          .getByText("Choose an org")
          .isVisible()
          .catch(() => false)
      ) {
        return;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 1_000 * 2 ** attempt);
      });
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function selectPlacisTenant(page: Page): Promise<void> {
  const chooser = page.getByText("Choose an org");
  if (!(await chooser.isVisible().catch(() => false))) {
    return;
  }
  // Prefer the dedicated e2e tenant; fall back to the first offered org.
  const e2eTenant = page
    .locator("button")
    .filter({ hasText: "bellfield-construction-e2e" })
    .first();
  if (await e2eTenant.isVisible().catch(() => false)) {
    await e2eTenant.click();
    return;
  }
  await page
    .locator("button")
    .filter({ hasText: /oncall\.ai/ })
    .first()
    .click();
}
