// TEMPORARY parity suite: compares the port's semantic HTML against the
// frozen old app (the oracle) on shared routes. Dropped at the port cutover
// when frontend/ is removed. Each ported route gets a spec here.
import { expect, test } from "@playwright/test";
import { diffSemanticHtml, extractSemanticHtml } from "./semanticHtml";

const OLD_APP_BASE_URL = process.env.PLACIS_OLD_APP_E2E_URL ?? "http://127.0.0.1:5173";
const PORT_BASE_URL = process.env.PLACIS_FRONTEND2_E2E_URL ?? "http://127.0.0.1:5174";

/** Stub the onboarding API with identical fixtures on both apps so the
 *  identify card renders deterministically. */
async function stubSetupApi(page: import("@playwright/test").Page): Promise<void> {
  await page.route("**/api/v1/setup-sessions", (route) =>
    route.fulfill({
      json: {
        id: "setup-session-parity-1",
        locale: "en-IE",
        requested_modules: ["website", "dashboard"],
        source: "guided_onboarding",
        status: "in_progress",
      },
    }),
  );
  await page.route("**/api/v1/setup-sessions/*/profile", (route) =>
    route.fulfill({
      json: {
        completeness: {
          completed_required_row_ids: [],
          conflict_row_ids: [],
          missing_required_row_ids: ["contact.phone"],
          needs_confirmation_row_ids: [],
          percent: 42,
        },
        current_profile_version_id: "profile-version-1",
        progress_events: [],
        setup_profile_facts: [],
        setup_session: {
          id: "setup-session-parity-1",
          requested_modules: ["website", "dashboard"],
          source: "guided_onboarding",
          status: "in_progress",
        },
      },
    }),
  );
  await page.route("**/api/v1/setup-sessions/*/profile/checklist", (route) =>
    route.fulfill({
      json: [
        {
          can_edit: true,
          can_skip: false,
          conflict_count: 0,
          display_value: null,
          field_path: "business_identity.display_name",
          group_id: "business_identity",
          label: "Business name",
          required: true,
          resolved_value: "Bellfield Construction",
          status: "filled_by_user",
        },
        {
          can_edit: true,
          can_skip: false,
          conflict_count: 0,
          display_value: null,
          field_path: "contact.phone",
          group_id: "contact",
          label: "Phone number",
          required: true,
          resolved_value: null,
          status: "open",
        },
      ],
    }),
  );
}

test("onboarding identify card is semantically equivalent", async ({
  page,
}) => {
  await stubSetupApi(page);

  await page.goto(`${OLD_APP_BASE_URL}/onboarding/find`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  const oldSemantic = await extractSemanticHtml(page);

  await stubSetupApi(page);
  await page.goto(`${PORT_BASE_URL}/onboarding/find`, {
    waitUntil: "domcontentloaded",
  });
  // The identify card header is the deterministic anchor for the port.
  await page
    .getByText("Find your business", { exact: false })
    .first()
    .waitFor({ timeout: 10_000 })
    .catch(() => {});
  const portSemantic = await extractSemanticHtml(page);

  const differences = diffSemanticHtml(oldSemantic, portSemantic);
  expect(
    differences,
    `Semantic HTML drift on /onboarding/find:\n${differences.join("\n")}`,
  ).toEqual([]);
});
