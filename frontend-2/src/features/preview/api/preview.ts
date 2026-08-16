import { apiClient } from "@/shared/api/client";
import type { components } from "@/generated/api-types";

export type ProductModule = components["schemas"]["ProductModule"];
export type PreviewModuleManifest = components["schemas"]["PreviewModuleManifest-Output"];
type PreviewModuleRead = components["schemas"]["PreviewModuleRead"];
type PreviewActionResponse = components["schemas"]["PreviewActionResponse"];
export type PreviewClaimCheckoutResponse = components["schemas"]["PreviewClaimCheckoutResponse"];
type PreviewClaimRead = components["schemas"]["PreviewClaimRead"];

export async function getPreviewModule(
  previewToken: string,
  module: ProductModule,
): Promise<PreviewModuleRead> {
  const response = await apiClient.GET(
    "/api/v1/preview/{preview_token}/module/{module}",
    {
      params: { path: { preview_token: previewToken, module } },
    },
  );
  if (response.error) {
    throw new Error("Failed to load preview module");
  }
  return response.data;
}

export async function activatePreview(
  previewToken: string,
): Promise<PreviewActionResponse> {
  const response = await apiClient.POST(
    "/api/v1/preview/{preview_token}/activate",
    {
      params: { path: { preview_token: previewToken } },
    },
  );
  if (response.error) {
    throw new Error("Failed to start preview activation");
  }
  return response.data;
}

export async function claimPreview(
  previewToken: string,
): Promise<PreviewActionResponse> {
  const response = await apiClient.POST(
    "/api/v1/preview/{preview_token}/claim",
    {
      params: { path: { preview_token: previewToken } },
    },
  );
  if (response.error) {
    throw new Error("Failed to claim preview");
  }
  return response.data;
}

export async function createPreviewClaimCheckout(
  previewToken: string,
): Promise<PreviewClaimCheckoutResponse> {
  const response = await apiClient.POST(
    "/api/v1/preview/{preview_token}/claim/checkout",
    {
      params: { path: { preview_token: previewToken } },
    },
  );
  if (response.error) {
    throw new Error("Failed to create claim checkout");
  }
  return response.data;
}

export async function getPreviewClaimStatus(
  previewToken: string,
): Promise<PreviewClaimRead> {
  const response = await apiClient.GET(
    "/api/v1/preview/{preview_token}/claim/status",
    {
      params: { path: { preview_token: previewToken } },
    },
  );
  if (response.error) {
    throw new Error("Failed to load preview claim status");
  }
  return response.data;
}
