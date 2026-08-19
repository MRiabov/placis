import { expect, test } from "@playwright/test";

import {
  interceptPreviewApi,
  previewStates,
} from "./previewVisual";

const frontendPort = process.env.PLACIS_FRONTEND2_E2E_PORT ?? "5174";
const frontendBaseUrl = `http://127.0.0.1:${frontendPort}`;
const oldAppBaseUrl =
  process.env.PLACIS_OLD_FRONTEND_URL ?? "http://127.0.0.1:5173";

/** GOLDEN_CAPTURE=1 runs the capture describe against the old app
 *  (--update-snapshots writes the committed goldens); otherwise the parity
 *  describe runs against frontend-2 and diffs against those goldens. */
const captureMode = process.env.GOLDEN_CAPTURE === "1";

test.describe("preview parity (frontend-2 vs golden)", () => {
  test.skip(captureMode, "golden capture run");
  test.use({ baseURL: frontendBaseUrl });

  for (const state of previewStates) {
    test(`renders ${state.name} like the reference`, async ({ page }) => {
      await interceptPreviewApi(page);
      await page.goto(state.path);
      await expect(
        page.getByText("Bellfield Construction").first(),
      ).toBeVisible();
      if (state.name === "claim") {
        await expect(
          page.getByText("Pay to activate this website"),
        ).toBeVisible();
      }
      await expect(page).toHaveScreenshot(`preview-${state.name}.png`, {
        animations: "disabled",
      });
    });
  }
});

test.describe("preview golden capture (frozen reference)", () => {
  test.skip(!captureMode, "manual: GOLDEN_CAPTURE=1 + old app on 5173");
  test.use({ baseURL: oldAppBaseUrl });

  for (const state of previewStates) {
    test(`captures ${state.name}`, async ({ page }) => {
      await interceptPreviewApi(page);
      await page.goto(state.path);
      await expect(
        page.getByText("Bellfield Construction").first(),
      ).toBeVisible();
      if (state.name === "claim") {
        await expect(
          page.getByText("Pay to activate this website"),
        ).toBeVisible();
      }
      await expect(page).toHaveScreenshot(`preview-${state.name}.png`, {
        animations: "disabled",
      });
    });
  }
});
