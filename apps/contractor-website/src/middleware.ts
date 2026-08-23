import { defineMiddleware } from "astro:middleware";
import type {
  Cache as CloudflareCache,
  Request as CloudflareRequest,
  Response as CloudflareResponse,
} from "@cloudflare/workers-types";
import { requestHost, type PublicSiteRuntimeEnv } from "./lib/publicSiteApi";

type StaticSiteEnv = Partial<{
  CMS_STATIC_SITE_BUCKET: R2Bucket;
  CMS_STATIC_SITE_KEY_PREFIX: string;
}> &
  PublicSiteRuntimeEnv;

const cacheableMethods = new Set(["GET", "HEAD"]);
const cacheWriteMethods = new Set(["GET"]);
const trustedStaticHtmlRenderers = new Set([
  "astro",
  "public-site-astro",
  "public-site-astro-static",
]);

export const onRequest = defineMiddleware(async (context, next) => {
  if (!cacheableMethods.has(context.request.method)) {
    return next();
  }
  const env = context.locals.runtime?.env as StaticSiteEnv | undefined;
  const bucket = env?.CMS_STATIC_SITE_BUCKET;
  if (!bucket) {
    return next();
  }
  const host = requestHost(context.request, context.url, env);
  const key = staticArtifactKey({
    host,
    pathname: context.url.pathname,
    prefix: env.CMS_STATIC_SITE_KEY_PREFIX ?? "sites",
  });
  const htmlArtifact = isHtmlArtifactPath(context.url.pathname);
  const cache = context.locals.runtime?.caches.default as
    | CloudflareCache
    | undefined;
  const cacheRequest = new Request(context.request.url, {
    method: "GET",
  }) as unknown as CloudflareRequest;
  const cached = await cache?.match(cacheRequest);
  if (cached) {
    const cachedResponse = cached as unknown as Response;
    if (htmlArtifact && !isTrustedStaticHtmlResponse(cachedResponse)) {
      if (cache) {
        context.locals.runtime?.ctx.waitUntil(cache.delete(cacheRequest));
      }
    } else {
      const headers = new Headers(cachedResponse.headers);
      headers.set("x-placis-static-publication", "r2-cache-hit");
      if (context.request.method === "HEAD") {
        return new Response(null, {
          headers,
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
        });
      }
      return new Response(cachedResponse.body, {
        headers,
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
      });
    }
  }
  const object = await bucket.get(key);
  if (!object) {
    return next();
  }
  if (htmlArtifact && !isTrustedStaticHtmlObject(object)) {
    return next();
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("x-placis-static-publication", "r2");
  const renderer = staticHtmlRenderer(object);
  if (renderer) {
    headers.set("x-placis-static-renderer", renderer);
  }
  if (!headers.has("cache-control")) {
    headers.set(
      "cache-control",
      "public, max-age=60, stale-while-revalidate=300",
    );
  }
  if (context.request.method === "HEAD") {
    return new Response(null, { headers });
  }
  const response = new Response(object.body, { headers });
  if (cache && cacheWriteMethods.has(context.request.method)) {
    const cacheResponse = response.clone() as unknown as CloudflareResponse;
    context.locals.runtime?.ctx.waitUntil(
      cache.put(cacheRequest, cacheResponse),
    );
  }
  return response;
});

function isHtmlArtifactPath(pathname: string) {
  const normalizedPath =
    pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return (
    normalizedPath === "/" ||
    normalizedPath.endsWith(".html") ||
    !/\.[^/]+$/.test(normalizedPath)
  );
}

function isTrustedStaticHtmlResponse(response: Response) {
  const renderer = response.headers.get("x-placis-static-renderer");
  return Boolean(renderer && trustedStaticHtmlRenderers.has(renderer));
}

function isTrustedStaticHtmlObject(object: R2ObjectBody) {
  const renderer = staticHtmlRenderer(object);
  return Boolean(renderer && trustedStaticHtmlRenderers.has(renderer));
}

function staticHtmlRenderer(object: R2ObjectBody) {
  return (
    object.customMetadata?.["placis-renderer"] ??
    object.customMetadata?.["x-placis-static-renderer"] ??
    object.customMetadata?.renderer
  );
}

function staticArtifactKey({
  host,
  pathname,
  prefix,
}: {
  host: string;
  pathname: string;
  prefix: string;
}) {
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, "") || "sites";
  const normalizedHost = host
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
  const normalizedPath =
    pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  if (normalizedPath === "/") {
    return `${normalizedPrefix}/${normalizedHost}/index.html`;
  }
  if (/\.[a-z0-9]{2,8}$/i.test(normalizedPath)) {
    return `${normalizedPrefix}/${normalizedHost}${normalizedPath}`;
  }
  return `${normalizedPrefix}/${normalizedHost}${normalizedPath}/index.html`;
}
