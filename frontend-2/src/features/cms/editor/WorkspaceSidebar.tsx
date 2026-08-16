import { ArrowLeft, LayoutList, Layers, Palette } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import type {
  CmsImageEditRequest,
  CmsMediaAsset,
  CmsMediaAssetCreate,
  CmsMediaAssetPatch,
  CmsPageProjection,
  CmsPageSummary,
} from "../api/cms";
import { MediaWorkspacePanel } from "./media/MediaWorkspacePanel";
import { MenuWorkspacePanel } from "./workspace/MenuWorkspacePanel";
import { PagesWorkspacePanel } from "./PagesWorkspacePanel";
import { StylesWorkspacePanel } from "./workspace/StylesWorkspacePanel";
import type { cmsThemePresets } from "./workspace/themes/presets";

type WorkspacePanel = "pages" | "media" | "styles" | "menu";

const railItems: Array<{ icon: typeof LayoutList; label: string; panel: WorkspacePanel }> = [
  { icon: LayoutList, label: "Pages", panel: "pages" },
  { icon: Layers, label: "Media", panel: "media" },
  { icon: Palette, label: "Styles", panel: "styles" },
  { icon: Layers, label: "Menu", panel: "menu" },
];

export type WorkspaceSidebarProps = {
  pages: CmsPageSummary[];
  selectedPageId: string;
  onCreatePage: (title: string, path: string) => Promise<void>;
  onPageChange: (pageId: string) => void;
  onRenamePage: (pageId: string, title: string) => Promise<void>;
  assets: CmsMediaAsset[];
  selectedAssetId: string;
  onSelectAsset: (assetId: string) => void;
  onCreateMediaAsset: (asset: CmsMediaAssetCreate) => Promise<void> | void;
  onCreateImageEdit: (assetId: string, request: CmsImageEditRequest) => void;
  onUploadMediaAsset: (file: File, altText: string) => Promise<unknown>;
  onUpdateMediaAsset: (assetId: string, patch: CmsMediaAssetPatch) => void;
  draft: CmsPageProjection | null;
  onApplyTheme: (preset: (typeof cmsThemePresets)[number]) => void;
  onDraftChange: (draft: CmsPageProjection) => void;
};

export function WorkspaceSidebar({
  pages,
  selectedPageId,
  onCreatePage,
  onPageChange,
  onRenamePage,
  assets,
  selectedAssetId,
  onSelectAsset,
  onCreateMediaAsset,
  onCreateImageEdit,
  onUploadMediaAsset,
  onUpdateMediaAsset,
  draft,
  onApplyTheme,
  onDraftChange,
}: WorkspaceSidebarProps): ReactNode {
  const [activePanel, setActivePanel] = useState<WorkspacePanel>("pages");

  return (
    <aside className="cms-workspace cms-workspace-sidebar min-h-0 border-cms-border-subtle border-r bg-cms-raised text-cms-text">
      <div className="cms-workspace-rail">
        {railItems.map((railItem) => (
          <button
            aria-label={railItem.label}
            aria-pressed={activePanel === railItem.panel}
            className={cn(
              "cms-workspace-rail-button",
              activePanel === railItem.panel && "is-active",
            )}
            key={railItem.panel}
            onClick={() => setActivePanel(railItem.panel)}
            title={railItem.label}
            type="button"
          >
            <railItem.icon aria-hidden="true" />
            <span>{railItem.label}</span>
          </button>
        ))}
      </div>
      <div className="cms-workspace-panel min-h-0 flex-1">
        {activePanel === "pages" ? (
          <PagesWorkspacePanel
            onCreatePage={onCreatePage}
            onPageChange={onPageChange}
            onRenamePage={onRenamePage}
            pages={pages}
            selectedPageId={selectedPageId}
          />
        ) : activePanel === "media" ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <MediaWorkspacePanel
              assets={assets}
              onCreateImageEdit={onCreateImageEdit}
              onCreateMediaAsset={onCreateMediaAsset}
              onSelectAsset={onSelectAsset}
              onUpdateMediaAsset={onUpdateMediaAsset}
              onUploadMediaAsset={onUploadMediaAsset}
              selectedAssetId={selectedAssetId}
            />
          </div>
        ) : activePanel === "styles" ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <StylesWorkspacePanel
              draft={draft}
              onApplyTheme={onApplyTheme}
            />
          </div>
        ) : activePanel === "menu" ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <MenuWorkspacePanel
              draft={draft}
              onDraftChange={onDraftChange}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export type EditorBackLinkProps = {
  onBack: () => void;
};

export function EditorBackLink({ onBack }: EditorBackLinkProps): ReactNode {
  return (
    <button
      className="cms-back-to-dashboard-link"
      onClick={onBack}
      type="button"
    >
      <ArrowLeft aria-hidden="true" />
      Dashboard
    </button>
  );
}
