import type { APIRoute } from "astro";
import type { PublicSiteManifest } from "@placis/website-components";
import {
  publicSiteApiBaseUrl,
  requestHost,
  resolvePublicSite,
  type PublicSiteRuntimeEnv,
} from "../lib/publicSiteApi";
import { faviconSvg } from "../lib/rootFiles";

export const prerender = false;

export const GET: APIRoute = async ({ locals, request, url }) => {
  const runtimeEnv = locals.runtime?.env as PublicSiteRuntimeEnv | undefined;
  const host = requestHost(request, url, runtimeEnv);
  const apiBaseUrl = publicSiteApiBaseUrl(runtimeEnv);
  const resolved = await resolvePublicSite({ apiBaseUrl, host, path: "/" });
  if (resolved.status !== "published") {
    return new Response("Site not found\n", { status: 404 });
  }
  return new Response(
    faviconSvg((resolved.manifest ?? {}) as PublicSiteManifest),
    {
      headers: {
        "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
        "content-type": "image/svg+xml; charset=utf-8",
      },
    },
  );
};
