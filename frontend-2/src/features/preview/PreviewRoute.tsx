import { useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { TargetedPreviewView } from "./components/TargetedPreviewView";
import { UnsupportedPreviewModule } from "./components/UnsupportedPreviewModule";

const websitePreviewModule = "website";

export function PreviewRoute(): ReactNode {
  const { token, module } = useParams({ from: "/preview/$token/$module" });
  if (!token) {
    return <UnsupportedPreviewModule module="preview" />;
  }
  if (module !== websitePreviewModule) {
    return <UnsupportedPreviewModule module={module} />;
  }
  return (
    <TargetedPreviewView
      module={websitePreviewModule}
      previewToken={token}
    />
  );
}
