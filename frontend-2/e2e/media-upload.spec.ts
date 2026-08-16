import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

import {
  hasClerkTestConfig,
  requireClerkTestConfig,
} from "../../frontend/e2e/cms/clerkTestConfig";
import { f2ClerkStorageStatePath, hasClerkTestingToken } from "./authConfig";

const APP_BASE_URL =
  process.env.PLACIS_FRONTEND2_E2E_URL ?? "http://127.0.0.1:5174";

requireClerkTestConfig("frontend-2 media upload E2E");

/** Real-backend media upload. No API mocks: this exercises the full chain
 *  (files/uploads -> signed-url -> complete -> assets) against the running
 *  backend, which is where contract regressions like the metadata.file_upload
 *  422 live. */
test.describe("CMS media library upload (real backend)", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ storageState: f2ClerkStorageStatePath });

  test.skip(
    !hasClerkTestConfig,
    "frontend-2 media upload E2E requires Clerk test credentials.",
  );

  test.beforeEach(async ({ page }) => {
    if (hasClerkTestingToken) {
      await setupClerkTestingToken({ page });
    }
  });

  test("uploads an image and it appears in the media library", async ({
    page,
  }) => {
    const altText = `E2E upload photo ${Date.now()}`;
    await page.goto(`${APP_BASE_URL}/cms`);
    await page.getByRole("button", { name: "Sites" }).first().waitFor({ timeout: 30_000 });
    await page.getByRole("button", { name: "Sites" }).first().click();
    await page.getByText("Website editor").first().waitFor({ timeout: 30_000 });
    await page.getByRole("button", { name: "Media" }).click();
    await page.getByPlaceholder("Describe the image before upload").fill(altText);

    // Playwright's setInputFiles does not land files on this input (files end
    // up empty), so drive the upload through the dropzone path, which calls
    // the same uploadFiles chain a real drag-and-drop uses.
    await page.evaluate(() => {
      const zone = document.querySelector(
        "[data-cms-media-upload-dropzone]",
      ) as HTMLElement | null;
      if (!zone) {
        throw new Error("media dropzone not found");
      }
      const file = new File(
        [new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])],
        "e2e-upload.jpg",
        { type: "image/jpeg" },
      );
      const transfer = new DataTransfer();
      transfer.items.add(file);
      zone.dispatchEvent(
        new DragEvent("dragover", {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        }),
      );
      zone.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        }),
      );
    });

    // The uploaded asset should appear in the grid with the alt text as its
    // label. Before the metadata.file_upload fix this timed out because the
    // real backend rejected POST /assets with 422 and the panel swallowed it.
    await expect(
      page.getByRole("button", { name: altText }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/image · upload/)).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Review" })).toHaveValue(
      "pending_review",
    );
  });
});
