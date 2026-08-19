import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import {
  activatePreview,
  claimPreview,
  getPreviewClaimStatus,
  getPreviewModule,
  type PreviewModuleManifest,
  type ProductModule,
} from "../api/preview";
import { readUrlSearchParams, redirectTo } from "@/shared/lib/navigation";
import { Button } from "@/shared/ui/button";
import { PayToClaimStrip } from "./PayToClaimStrip";
import { PublicSiteModulePreview } from "./PublicSiteModulePreview";
import { UnsupportedPreviewModule } from "./UnsupportedPreviewModule";
import type { PublicSiteManifest } from "@placis/public-site-components";

interface TargetedPreviewViewProps {
  previewToken: string;
  module: ProductModule;
}

function isPublicSiteManifest(
  manifest: PreviewModuleManifest,
): manifest is PreviewModuleManifest & PublicSiteManifest {
  return manifest.manifest_version === "public_site_manifest.v1";
}

function previewRouteFor(manifest: PreviewModuleManifest | undefined): string {
  return typeof manifest?.route === "string" ? manifest.route : "/";
}

export function TargetedPreviewView({
  previewToken,
  module,
}: TargetedPreviewViewProps): ReactNode {
  const moduleQuery = useQuery({
    enabled: Boolean(previewToken && module),
    queryKey: ["targeted-preview-module", previewToken, module],
    queryFn: () => getPreviewModule(previewToken, module),
  });
  const urlParams = readUrlSearchParams();
  const claimCompleted = urlParams.get("claim") === "success";
  const claimRequested = urlParams.get("claim") === "1";
  const claimFlowActive = claimCompleted || claimRequested;
  const claimStatus = useQuery({
    enabled: claimFlowActive,
    queryKey: ["preview-claim-status", previewToken],
    queryFn: () => getPreviewClaimStatus(previewToken),
    refetchInterval: (query) =>
      query.state.data?.status === "activated" ? false : 2000,
  });
  useEffect(() => {
    if (claimStatus.data?.status === "activated") {
      redirectTo("/cms/website");
    }
  }, [claimStatus.data?.status]);
  const previewAction = useMutation({
    mutationFn: (
      action: "activate" | "claim",
    ) => {
      if (action === "activate") {
        return activatePreview(previewToken);
      }
      if (action === "claim") {
        return claimPreview(previewToken);
      }
      throw new Error(`Unsupported preview action: ${action}`);
    },
  });
  const manifest = moduleQuery.data?.manifest;
  const embedded = readUrlSearchParams().get("embed") === "1";

  if (embedded) {
    return (
      <main className="min-h-screen bg-white text-zinc-950">
        {moduleQuery.isError ? (
          <div className="p-4 text-red-800 text-sm">
            Preview link could not be loaded.
          </div>
        ) : manifest ? (
          renderModulePreview(module, manifest)
        ) : (
          <div className="grid min-h-screen place-items-center p-4 text-sm text-zinc-500">
            Loading website preview...
          </div>
        )}
        {claimCompleted && claimStatus.isPending ? (
          <div className="fixed right-4 bottom-4 rounded-lg bg-zinc-950 px-4 py-3 text-sm text-white shadow-lg">
            Payment received. Activating your website...
          </div>
        ) : null}
      </main>
    );
  }

  if (module !== "website") {
    return <UnsupportedPreviewModule module={module} />;
  }

  return (
    <main className="min-h-screen bg-white pb-28 text-zinc-950">
      {moduleQuery.isError ? (
        <div className="grid min-h-screen place-items-center p-4 text-red-800 text-sm">
          Preview link could not be loaded. It may have expired or the
          website preview may not exist.
        </div>
      ) : manifest ? (
        renderModulePreview(module, manifest)
      ) : (
        <div className="grid min-h-screen place-items-center p-4 text-sm text-zinc-500">
          Loading website preview...
        </div>
      )}
      {claimRequested ? (
        <PayToClaimStrip initialOpen previewToken={previewToken} />
      ) : null}
      <WebsitePreviewActionBar
        busy={previewAction.isPending}
        message={previewAction.data?.message}
        onActivate={() => previewAction.mutate("activate")}
        onClaim={() => previewAction.mutate("claim")}
      />
    </main>
  );
}

function renderModulePreview(
  module: ProductModule,
  manifest: PreviewModuleManifest,
): ReactNode {
  if (module === "website" && isPublicSiteManifest(manifest)) {
    return (
      <PublicSiteModulePreview
        manifest={manifest}
        route={previewRouteFor(manifest)}
      />
    );
  }
  return <UnsupportedPreviewModule module={module} />;
}

function WebsitePreviewActionBar({
  busy,
  message,
  onActivate,
  onClaim,
}: {
  busy?: boolean;
  message?: string | undefined;
  onActivate: () => void;
  onClaim: () => void;
}): ReactNode {
  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-zinc-200 border-t bg-white/95 px-4 py-3 shadow-[0_-12px_34px_rgba(24,24,27,0.14)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-zinc-950">
            Website preview draft
          </p>
          <p className="text-sm text-zinc-600">
            {message || "Review the live draft, then activate or claim it."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button disabled={busy} onClick={onActivate} size="sm" type="button">
            Activate
          </Button>
          <Button
            disabled={busy}
            onClick={onClaim}
            size="sm"
            type="button"
            variant="secondary"
          >
            Claim
          </Button>
        </div>
      </div>
    </div>
  );
}
