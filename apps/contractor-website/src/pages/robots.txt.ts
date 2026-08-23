import type { APIRoute } from "astro";
import {
  publicSiteApiBaseUrl,
  requestHost,
  resolvePublicSite,
  type PublicSiteRuntimeEnv,
} from "../lib/publicSiteApi";
import { robotsTxt } from "../lib/rootFiles";

export const prerender = false;

export const GET: APIRoute = async ({ locals, request, url }) => {
  const runtimeEnv = locals.runtime?.env as PublicSiteRuntimeEnv | undefined;
  const host = requestHost(request, url, runtimeEnv);
  const apiBaseUrl = publicSiteApiBaseUrl(runtimeEnv);
  const resolved = await resolvePublicSite({ apiBaseUrl, host, path: "/" });
  if (resolved.status !== "published") {
    return new Response("Site not found\n", { status: 404 });
  }
  return new Response(robotsTxt(host), {
    headers: {
      "cache-control": "public, max-age=300, stale-while-revalidate=300",
      "content-type": "text/plain; charset=utf-8",
    },
  });
};
