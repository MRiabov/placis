import type { PublicSiteManifest } from "@placis/website-components";

export type PublicSiteRuntimeEnv = Partial<{
  PLACIS_API_BASE_URL: string;
  PUBLIC_SITE_API_BASE_URL: string;
  PUBLIC_SITE_ENV: string;
  PUBLIC_SITE_HOST_OVERRIDE: string;
  PUBLIC_SITE_PRIVATE_APP_BASE_URL: string;
}>;

export type PublicSiteResolveResponse = {
  status: string;
  tenant_slug?: string | null;
  host?: string | null;
  domain_id?: string | null;
  domain_type?: string | null;
  path: string;
  manifest?: PublicSiteManifest;
  cache?: {
    ttl_seconds?: number;
    [key: string]: unknown;
  };
  app_shell?: {
    runtime?: string;
    bundle?: string;
    shared_across_tenants?: boolean;
    tenant_specific_build?: boolean;
    [key: string]: unknown;
  };
};

export type PublicSitePreviewModuleResponse = {
  preview_package_id?: string;
  module?: string;
  manifest?: PublicSiteManifest;
  entry_link?: Record<string, unknown> | null;
  sandboxed?: boolean;
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
      "PUBLIC_SITE_API_BASE_URL or PLACIS_API_BASE_URL must be configured for the public-site Worker.",
    );
  }

  return (configuredUrl ?? "http://localhost:8000").replace(/\/$/, "");
}

export function privateAppBaseUrl(
  runtimeEnv: PublicSiteRuntimeEnv = {},
): string {
  const configuredUrl =
    runtimeEnv.PUBLIC_SITE_PRIVATE_APP_BASE_URL ??
    import.meta.env.PUBLIC_SITE_PRIVATE_APP_BASE_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }
  return runtimeEnv.PUBLIC_SITE_ENV === "production"
    ? "https://app.placis.com"
    : "http://localhost:5173";
}

export function privateAppPreviewUrl({
  previewToken,
  runtimeEnv = {},
}: {
  previewToken: string;
  runtimeEnv?: PublicSiteRuntimeEnv;
}): string {
  const target = new URL(
    `/preview/${encodeURIComponent(previewToken)}/website`,
    privateAppBaseUrl(runtimeEnv),
  );
  target.searchParams.set("claim", "1");
  return target.toString();
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

export async function resolvePublicSite({
  apiBaseUrl = publicSiteApiBaseUrl(),
  host,
  path,
}: {
  apiBaseUrl?: string;
  host: string;
  path: string;
}): Promise<PublicSiteResolveResponse> {
  const url = new URL("/api/v1/public/site/resolve", apiBaseUrl);
  url.searchParams.set("host", host);
  url.searchParams.set("path", path || "/");
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
  });
  if (!response.ok) {
    return {
      status: "not_found",
      host,
      path,
    };
  }
  return (await response.json()) as PublicSiteResolveResponse;
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

export async function requestPreviewChanges({
  apiBaseUrl = publicSiteApiBaseUrl(),
  previewToken,
}: {
  apiBaseUrl?: string;
  previewToken: string;
}): Promise<void> {
  const response = await fetch(
    new URL(
      `/api/v1/preview/${encodeURIComponent(previewToken)}/request-changes`,
      apiBaseUrl,
    ),
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        note: "Contractor requested changes from the public-site preview.",
        source: "public_site_preview",
      }),
    },
  );
  if (!response.ok) {
    throw new Error("Preview action failed");
  }
}
