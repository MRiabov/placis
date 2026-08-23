import type { APIRoute } from "astro";
import {
  privateAppPreviewUrl,
  publicSiteApiBaseUrl,
  requestPreviewChanges,
  type PublicSiteRuntimeEnv,
} from "../../../lib/publicSiteApi";

const supportedActions = new Set(["activate", "claim", "request-changes"]);

export const POST: APIRoute = async ({ locals, params, request, url }) => {
  const runtimeEnv = locals.runtime?.env as PublicSiteRuntimeEnv | undefined;
  const previewToken = params.previewToken ?? "";
  const action = params.action ?? "";
  const formData = await request.formData().catch(() => new FormData());
  const returnTo = safeReturnTo(
    String(formData.get("return_to") || `/preview/${previewToken}/`),
    previewToken,
  );

  if (!previewToken || !supportedActions.has(action)) {
    return redirectWithStatus(url, returnTo, {
      message: "Preview action is not available.",
      status: "failed",
    });
  }

  if (action === "activate" || action === "claim") {
    return Response.redirect(
      privateAppPreviewUrl({ previewToken, runtimeEnv }),
      303,
    );
  }

  try {
    await requestPreviewChanges({
      apiBaseUrl: publicSiteApiBaseUrl(runtimeEnv),
      previewToken,
    });
    return redirectWithStatus(url, returnTo, {
      message: "Change request recorded. We will follow up on this draft.",
      status: "change_requested",
    });
  } catch {
    return redirectWithStatus(url, returnTo, {
      message: "Preview action could not be recorded.",
      status: "failed",
    });
  }
};

function safeReturnTo(value: string, previewToken: string) {
  const fallback = `/preview/${previewToken}/`;
  if (!value.startsWith(`/preview/${previewToken}`)) {
    return fallback;
  }
  return value;
}

function redirectWithStatus(
  url: URL,
  returnTo: string,
  result: { message: string; status: string },
) {
  const target = new URL(returnTo, url.origin);
  target.searchParams.set("preview_action", result.status);
  target.searchParams.set("preview_message", result.message);
  return Response.redirect(target, 303);
}
