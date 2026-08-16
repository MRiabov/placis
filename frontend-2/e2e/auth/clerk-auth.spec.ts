import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

import { isPrivateAppLoginPath } from "../../src/shared/auth/authRoutes";
import {
  cmsClerkStorageStatePath,
  ensureClerkE2eUser,
  hasClerkTestConfig,
  requireClerkTestConfig,
} from "./clerkTestConfig";

requireClerkTestConfig("frontend-2 Clerk E2E");

/** Business profile + org-gate fixtures matching the parity stub: with a
 *  selected org the dashboard renders instead of the org chooser. */
async function stubCmsDashboardApi(page: import("@playwright/test").Page) {
  await page.route("**/api/v1/website/editor/business-profile", (route) =>
    route.fulfill({
      json: {
        business_location: "Unit 4, Waterford Business Park",
        business_name: "Bellfield Construction",
        company_number: "123456",
        created_at: "2026-01-01T00:00:00Z",
        description:
          "Residential construction, extensions, and refurbishment projects across Waterford and the South East.",
        email: "hello@bellfield.example",
        established_year: 2016,
      },
    }),
  );
  await page.route("**/api/v1/me", (route) =>
    route.fulfill({
      json: {
        user: { id: "local_user", name: "Local User" },
        platform_role: "platform_admin",
        tenant: {
          id: "00000000-0000-0000-0000-000000000001",
          name: "Bellfield Construction",
          slug: "bellfield",
          status: "active",
          plan: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      },
    }),
  );
}

test.describe("frontend-2 Clerk auth", () => {
  test("treats Clerk nested login routes as auth routes", () => {
    expect(isPrivateAppLoginPath("/login")).toBe(true);
    expect(isPrivateAppLoginPath("/login/sso-callback")).toBe(true);
    expect(isPrivateAppLoginPath("/login/factor-one")).toBe(true);
    expect(isPrivateAppLoginPath("/sign-up")).toBe(false);
    expect(isPrivateAppLoginPath("/cms")).toBe(false);
    expect(isPrivateAppLoginPath("/cms/website")).toBe(false);
  });

  test.skip(
    !hasClerkTestConfig,
    "frontend-2 Clerk E2E test requires CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.",
  );

  test("redirects signed-out /cms visits to /login without loading dashboard data", async ({
    page,
  }) => {
    await setupClerkTestingToken({ page });
    let requestedEditorApi = false;
    await page.route("**/api/v1/website/editor/**", async (route) => {
      requestedEditorApi = true;
      await route.fulfill({
        contentType: "application/json",
        json: { detail: "Unexpected unauthenticated CMS API request" },
        status: 500,
      });
    });

    await page.goto("/cms");

    await expect(page).toHaveURL(/\/login\?redirect_url=%2Fcms$/, {
      timeout: 20_000,
    });
    await expect(page.locator("main.cms-auth-page")).toBeVisible({
      timeout: 20_000,
    });
    expect(requestedEditorApi).toBe(false);
  });
});

test.describe("frontend-2 Clerk account menu (signed in)", () => {
  test.skip(
    !hasClerkTestConfig,
    "frontend-2 Clerk E2E test requires Clerk test credentials.",
  );
  test.use({ storageState: cmsClerkStorageStatePath });

  test("shows the signed-in Clerk user in the account menu and signs out", async ({
    page,
  }) => {
    const { email, organizationId } = await ensureClerkE2eUser();
    await stubCmsDashboardApi(page);

    await page.goto("/cms");
    // The tenant <-> Clerk org 1-1 contract: the session's active organization
    // is what the backend reads as the org_id claim to resolve the tenant.
    // Assert it through Clerk's own client state (native, no token decoding).
    await page.waitForFunction(() => {
      const clerk = (window as { Clerk?: { organization?: unknown } }).Clerk;
      return Boolean(clerk?.organization);
    });
    const activeOrgId = await page.evaluate(() => {
      const clerk = (window as {
        Clerk?: { organization?: { id?: string } };
      }).Clerk;
      return clerk?.organization?.id ?? null;
    });
    expect(activeOrgId).toBe(organizationId);

    // The sidebar account menu shows the Clerk user's identity (the e2e user
    // has no display name, so the email is the trigger label).
    const accountTrigger = page.getByLabel("Open account menu");
    await expect(accountTrigger).toBeVisible({ timeout: 20_000 });
    await expect(accountTrigger).toContainText(email);

    await accountTrigger.click();
    await expect(page.getByText("Settings")).toBeVisible();
    await expect(page.getByText("User Management")).toBeVisible();
    await expect(page.getByText("Organization")).toBeVisible();

    await page.getByText("Log out").click();
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
  });
});
