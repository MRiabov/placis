// TEMPORARY parity suite: compares the port's semantic HTML against the
// frozen old app (the oracle) on shared routes. Dropped at the port cutover
// when frontend/ is removed. Each ported route gets a spec here.
import { expect, test } from "@playwright/test";
import { diffSemanticHtml, extractSemanticHtml } from "./semanticHtml";

const OLD_APP_BASE_URL =
  process.env.PLACIS_OLD_APP_E2E_URL ?? "http://127.0.0.1:5173";
const PORT_BASE_URL =
  process.env.PLACIS_FRONTEND2_E2E_URL ?? "http://127.0.0.1:5174";

/** Business profile matching the old app's screenshot fixture (devScreenshotFixtureData). */
const businessProfileFixture = {
  business_location: "Unit 4, Waterford Business Park",
  business_name: "Bellfield Construction",
  company_number: "123456",
  created_at: "2026-01-01T00:00:00Z",
  description:
    "Residential construction, extensions, and refurbishment projects across Waterford and the South East.",
  email: "hello@bellfield.example",
  established_year: 2016,
};

async function stubCmsApi(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.route("**/api/v1/website/editor/business-profile", (route) =>
    route.fulfill({ json: businessProfileFixture }),
  );
  // The port's org gate: a session with a tenant (1-1 Clerk org mapping)
  // renders the dashboard; no chooser exists anymore.
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

test("cms dashboard is semantically equivalent", async ({ page }) => {
  await stubCmsApi(page);
  // The old app renders the CMS deterministically in screenshot mode
  // (fake token, no auth gate).
  await page.goto(`${OLD_APP_BASE_URL}/cms?placis_screenshot=1`, {
    waitUntil: "domcontentloaded",
  });
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
  const oldSemantic = await extractSemanticHtml(page);

  await stubCmsApi(page);
  await page.goto(`${PORT_BASE_URL}/cms`, { waitUntil: "domcontentloaded" });
  await page
    .getByText("Welcome to the website dashboard", { exact: false })
    .first()
    .waitFor({ timeout: 10_000 })
    .catch(() => {});
  const portSemantic = await extractSemanticHtml(page);

  const differences = diffSemanticHtml(oldSemantic, portSemantic);
  expect(
    differences,
    `Semantic HTML drift on /cms:\n${differences.join("\n")}`,
  ).toEqual([]);
});
