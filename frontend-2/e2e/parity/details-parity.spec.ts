// TEMPORARY parity suite: compares the port's semantic HTML against the
// frozen old app (the oracle) on shared routes. Dropped at the port cutover
// when frontend/ is removed. Each ported route gets a spec here.
//
// Business details: the old app renders it as a standalone page, the port
// inside the CMS shell, so the diff is scoped to the shared content region
// (.cms-details-editor) via extractSemanticHtml(page, selector).
import { expect, test, type Page } from "@playwright/test";
import { diffSemanticHtml, extractSemanticHtml } from "./semanticHtml";

const OLD_APP_BASE_URL =
  process.env.PLACIS_OLD_APP_E2E_URL ?? "http://127.0.0.1:5173";
const PORT_BASE_URL =
  process.env.PLACIS_FRONTEND2_E2E_URL ?? "http://127.0.0.1:5174";

/** Byte-identical to the old app's screenshot fixture logo so `src` attrs
 *  match (devScreenshotFixtureData.svgDataUrl). */
function svgDataUrl(title: string, background: string, accent: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">` +
    `<rect width="1400" height="900" fill="${background}"/>` +
    `<path d="M0 700 C280 590 480 610 720 500 C970 386 1110 320 1400 370 L1400 900 L0 900 Z" fill="${accent}" opacity=".92"/>` +
    `<rect x="115" y="145" width="500" height="310" rx="24" fill="#ffffff" opacity=".12"/>` +
    `<path d="M165 400 L365 215 L570 400 Z" fill="#ffffff" opacity=".25"/>` +
    `<rect x="250" y="400" width="240" height="120" fill="#ffffff" opacity=".18"/>` +
    `<text x="118" y="650" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#ffffff">${title}</text>` +
    `<text x="122" y="714" font-family="Arial, sans-serif" font-size="30" fill="#ffffff" opacity=".78">Dev screenshot fixture</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const heroImage = svgDataUrl("Bellfield Construction", "#12312b", "#e8d8af");
const timestamp = "2026-07-05T12:00:00Z";

/** Business profile + assets matching the old app's screenshot fixtures
 *  (devScreenshotFixtureData) so both apps render the same values. */
const businessProfileFixture = {
  business_location: "Unit 4, Waterford Business Park",
  business_name: "Bellfield Construction",
  company_number: "123456",
  created_at: timestamp,
  description:
    "Residential construction, extensions, and refurbishment projects across Waterford and the South East.",
  email: "hello@bellfield.example",
  established_year: 2016,
  featured_services: ["Extensions", "Renovations", "New builds"],
  id: "profile-bellfield",
  legal_name: "Bellfield Construction Ltd",
  logo_asset_id: "asset-logo",
  logo_url: heroImage,
  opening_hours: [
    {
      closes_at: "17:30",
      day: "monday",
      is_closed: false,
      note: null,
      opens_at: "08:00",
    },
    {
      closes_at: "17:30",
      day: "tuesday",
      is_closed: false,
      note: null,
      opens_at: "08:00",
    },
    {
      closes_at: "17:30",
      day: "wednesday",
      is_closed: false,
      note: null,
      opens_at: "08:00",
    },
    {
      closes_at: "17:30",
      day: "thursday",
      is_closed: false,
      note: null,
      opens_at: "08:00",
    },
    {
      closes_at: "17:30",
      day: "friday",
      is_closed: false,
      note: null,
      opens_at: "08:00",
    },
    {
      closes_at: null,
      day: "saturday",
      is_closed: false,
      note: "Surveys by appointment",
      opens_at: null,
    },
  ],
  phone: "+353 87 998 2864",
  registered_office: "Unit 4, Waterford Business Park",
  service_area: ["Waterford", "Kilkenny", "Wexford"],
  tenant_id: "tenant-bellfield",
  trade: "Construction",
  updated_at: timestamp,
  vat_number: null,
  website_url: "https://bellfield.example",
};

const mediaAssetsFixture = [
  {
    alt_text: "Bellfield Construction logo",
    asset_type: "logo",
    can_remove: true,
    can_replace: true,
    created_at: timestamp,
    file_id: "file-logo",
    id: "asset-logo",
    metadata: { public_url: heroImage },
    preview_url: heroImage,
    provenance: { source_label: "Screenshot fixture" },
    review_status: "approved",
    source: "upload",
    source_url: heroImage,
    status: "ready",
    tenant_slug: "bellfield-preview",
    updated_at: timestamp,
  },
  {
    alt_text: "Residential extension project in progress",
    asset_type: "image",
    can_remove: true,
    can_replace: true,
    created_at: timestamp,
    file_id: "file-hero",
    id: "asset-hero",
    metadata: {},
    preview_url: heroImage,
    provenance: { source_label: "Screenshot fixture" },
    review_status: "approved",
    source: "generated",
    source_url: heroImage,
    status: "ready",
    tenant_slug: "bellfield-preview",
    updated_at: timestamp,
  },
];

async function stubCmsApi(page: Page): Promise<void> {
  await page.route("**/api/v1/website/editor/business-profile", (route) =>
    route.fulfill({ json: businessProfileFixture }),
  );
  await page.route("**/api/v1/website/editor/assets", (route) =>
    route.fulfill({ json: { items: mediaAssetsFixture } }),
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

test("cms business details are semantically equivalent", async ({ page }) => {
  // The old app renders the CMS deterministically in screenshot mode
  // (fake token, no auth gate); the fixture profile is served by its API shim.
  await page.goto(`${OLD_APP_BASE_URL}/cms/details?placis_screenshot=1`, {
    waitUntil: "domcontentloaded",
  });
  await page
    .waitForLoadState("networkidle", { timeout: 15_000 })
    .catch(() => {});
  await page.waitForSelector('input[value="Bellfield Construction"]', {
    timeout: 30_000,
  });
  const oldSemantic = await extractSemanticHtml(page, ".cms-details-editor");

  await stubCmsApi(page);
  await page.goto(`${PORT_BASE_URL}/cms`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Details" }).click();
  await page.waitForSelector('input[value="Bellfield Construction"]', {
    timeout: 30_000,
  });
  const portSemantic = await extractSemanticHtml(page, ".cms-details-editor");

  const differences = diffSemanticHtml(oldSemantic, portSemantic);
  expect(
    differences,
    `Semantic HTML drift on business details:\n${differences.join("\n")}`,
  ).toEqual([]);
});
