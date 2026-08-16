import {
  clerk,
  clerkSetup,
  setupClerkTestingToken,
} from "@clerk/testing/playwright";
import { type Page, test as setup } from "@playwright/test";

import {
  cmsClerkStorageStatePath,
  ensureClerkE2eUser,
  hasClerkTestConfig,
  requireClerkTestConfig,
} from "./clerkTestConfig";

requireClerkTestConfig("frontend-2 Clerk setup");

setup.describe("frontend-2 Clerk setup", () => {
  setup.describe.configure({ mode: "serial" });
  setup.skip(
    !hasClerkTestConfig,
    "frontend-2 Clerk E2E setup requires CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.",
  );

  setup("configure Clerk testing token", async () => {
    if (process.env.CLERK_TESTING_TOKEN) {
      return;
    }

    await clerkSetup();
  });

  setup("authenticate frontend-2 Clerk user", async ({ page }) => {
    const { email, organizationId } = await ensureClerkE2eUser();
    await setupClerkTestingToken({ page });
    await page.goto("/login?redirect_url=%2Fcms");
    await signInE2eUser(page, email);
    // The e2e user belongs to an org, but the sign-in flow leaves the active
    // org unset; seed it so the session token carries the org_id claim (the
    // backend derives the tenant from that claim).
    await page.waitForFunction(() => window.Clerk?.loaded === true);
    await page.evaluate(
      (orgId) => window.Clerk.setActive({ organization: orgId }),
      organizationId,
    );
    // The AuthGate bounces the signed-in user back to /cms (redirect_url).
    await page.waitForURL("**/cms", { timeout: 20_000 });
    await page.context().storageState({ path: cmsClerkStorageStatePath });
  });
});

async function signInE2eUser(page: Page, email: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await clerk.signIn({
        emailAddress: email,
        page,
      });
      return;
    } catch (error) {
      lastError = error;
      await page.goto("/login?redirect_url=%2Fcms");
      await new Promise((resolve) => {
        setTimeout(resolve, 1_000 * 2 ** attempt);
      });
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
