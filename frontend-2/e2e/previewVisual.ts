import type { Page } from "@playwright/test";
import { websitePreviewModuleFixture } from "../src/test/fixtures/websitePreview";

const claimStatusFixture = {
  id: "claim-1",
  preview_package_id: "preview-package-1",
  user_id: "user-1",
  provider: "stripe",
  status: "checkout_pending",
  amount: 4900,
  currency: "EUR",
} as const;

/**
 * Serves the same fixture payloads to both the frozen reference app and
 * frontend-2, so the visual parity comparison is data-identical.
 */
export async function interceptPreviewApi(page: Page): Promise<void> {
  await page.route("**/api/v1/preview/**", (route) => {
    const url = route.request().url();
    if (url.includes("/claim/status")) {
      return route.fulfill({ json: claimStatusFixture });
    }
    if (url.includes("/module/")) {
      return route.fulfill({ json: websitePreviewModuleFixture });
    }
    return route.fulfill({
      json: { status: "ok", message: "handled by parity fixture" },
    });
  });
}

export const previewStates = [
  { name: "default", path: "/preview/preview-token/website" },
  { name: "embed", path: "/preview/preview-token/website?embed=1" },
  { name: "claim", path: "/preview/preview-token/website?claim=1" },
] as const;
