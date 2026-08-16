import { describe, expect, it } from "vitest";

import {
  activatePreview,
  claimPreview,
  createPreviewClaimCheckout,
  getPreviewClaimStatus,
  getPreviewModule,
} from "./preview";
import { previewToken } from "@/test/msw/server";

describe("preview api", () => {
  it("loads the website preview module", async () => {
    const modulePayload = await getPreviewModule(previewToken, "website");
    expect(modulePayload.module).toBe("website");
    expect(modulePayload.manifest.manifest_version).toBe(
      "public_site_manifest.v1",
    );
  });

  it("throws when the preview token is unknown", async () => {
    await expect(getPreviewModule("unknown-token", "website")).rejects.toThrow(
      "Failed to load preview module",
    );
  });

  it("starts activation", async () => {
    const response = await activatePreview(previewToken);
    expect(response.status).toBe("activation_started");
  });

  it("starts a claim", async () => {
    const response = await claimPreview(previewToken);
    expect(response.status).toBe("claim_started");
  });

  it("creates a claim checkout with a Stripe url", async () => {
    const checkout = await createPreviewClaimCheckout(previewToken);
    expect(checkout.provider).toBe("stripe");
    expect(checkout.url).toContain("checkout.stripe.test");
    expect(checkout.amount).toBe(4900);
  });

  it("reads the claim status", async () => {
    const status = await getPreviewClaimStatus(previewToken);
    expect(status.status).toBe("checkout_pending");
  });
});
