import type { WebsiteManifest } from "@placis/website-components";

export type PublicSiteRuntimeEnv = Partial<{
  PLACIS_API_BASE_URL: string;
  PUBLIC_SITE_API_BASE_URL: string;
  PUBLIC_SITE_ENV: string;
  PUBLIC_SITE_HOST_OVERRIDE: string;
}>;

export type PublicSitePreviewModuleResponse = {
  preview_package_id?: string;
  module?: string;
  manifest?: WebsiteManifest;
};

export function publicSiteApiBaseUrl(
  runtimeEnv: PublicSiteRuntimeEnv = {},
): string {
  const configuredUrl =
    runtimeEnv.PUBLIC_SITE_API_BASE_URL ??
    runtimeEnv.PLACIS_API_BASE_URL ??
    import.meta.env.PUBLIC_SITE_API_BASE_URL ??
    import.meta.env.PLACIS_API_BASE_URL;

  if (
    !configuredUrl &&
    runtimeEnv.PUBLIC_SITE_ENV &&
    runtimeEnv.PUBLIC_SITE_ENV !== "local"
  ) {
    throw new Error(
      "PUBLIC_SITE_API_BASE_URL or PLACIS_API_BASE_URL must be configured for the contractor-website Worker.",
    );
  }

  return (configuredUrl ?? "http://localhost:8000").replace(/\/$/, "");
}

export function requestHost(
  request: Request,
  fallbackUrl: URL,
  runtimeEnv: PublicSiteRuntimeEnv = {},
): string {
  if (
    runtimeEnv.PUBLIC_SITE_ENV === "local" &&
    runtimeEnv.PUBLIC_SITE_HOST_OVERRIDE
  ) {
    return runtimeEnv.PUBLIC_SITE_HOST_OVERRIDE;
  }
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  return forwardedHost?.split(",")[0]?.trim() || host || fallbackUrl.host;
}

export async function resolvePreviewWebsite({
  apiBaseUrl = publicSiteApiBaseUrl(),
  previewToken,
}: {
  apiBaseUrl?: string;
  previewToken: string;
}): Promise<PublicSitePreviewModuleResponse | null> {
  const url = new URL(
    `/api/v1/preview/${encodeURIComponent(previewToken)}/module/website`,
    apiBaseUrl,
  );
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as PublicSitePreviewModuleResponse;
}
