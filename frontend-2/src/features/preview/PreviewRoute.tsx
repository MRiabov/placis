import { useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";

import type { ProductModule } from "./api/preview";
import { TargetedPreviewView } from "./components/TargetedPreviewView";
import { UnsupportedPreviewModule } from "./components/UnsupportedPreviewModule";

const previewModules = new Set<ProductModule>([
  "website",
  "dashboard",
  "customer",
  "office",
  "crew",
  "voice_intake",
]);

export function PreviewRoute(): ReactNode {
  const { token, module } = useParams({ from: "/preview/$token/$module" });
  if (!token) {
    return <UnsupportedPreviewModule module="preview" />;
  }
  if (!previewModules.has(module as ProductModule)) {
    return <UnsupportedPreviewModule module={module} />;
  }
  return (
    <TargetedPreviewView
      module={module as ProductModule}
      previewToken={token}
    />
  );
}
