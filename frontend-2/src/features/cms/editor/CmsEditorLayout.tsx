import type { ReactNode } from "react";

import type {
  CmsAssistantResponse,
  CmsImageEditRequest,
  CmsMediaAsset,
  CmsMediaAssetCreate,
  CmsMediaAssetPatch,
  CmsPageProjection,
  CmsPageSummary,
  CmsSection,
  CmsSectionDesign,
  CmsSlot,
} from "../api/cms";
import type { CmsViewportMode } from "../types";
import { AssistantModal } from "./assistant/AssistantModal";
import { EditorCanvas, type EditorCanvasProps } from "./EditorCanvas";
import { EditorHeader } from "./EditorHeader";
import { Inspector } from "./inspector/Inspector";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import type { cmsThemePresets } from "./workspace/themes/presets";

export type CmsEditorLayoutProps = {
  assistantOpen: boolean;
  dirty: boolean;
  draft: CmsPageProjection | null;
  error: string | null;
  loading: boolean;
  mediaAssets: CmsMediaAsset[];
  onAddSection: (componentId: string) => void;
  onAssetDrop: EditorCanvasProps["onAssetDrop"];
  onAssistantRun: (
    prompt: string,
    planMarkdown?: string,
  ) => Promise<CmsAssistantResponse | null>;
  onAssistantToggle: () => void;
  onBack: () => void;
  onCreateImageEdit: (assetId: string, request: CmsImageEditRequest) => void;
  onCreateMediaAsset: (asset: CmsMediaAssetCreate) => void;
  onCreatePage: (title: string, path: string) => Promise<void>;
  onApplyTheme: (preset: (typeof cmsThemePresets)[number]) => void;
  onDesignChange: (sectionId: string, design: CmsSectionDesign) => void;
  onDraftChange: (draft: CmsPageProjection) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onPageChange: (pageId: string) => void;
  onPageUpdate: (patch: { title?: string; path?: string }) => void;
  onPublish: () => void;
  onRemoveSection: (sectionId: string) => void;
  onRenamePage: (pageId: string, title: string) => Promise<void>;
  onSave: () => void;
  onSelectAsset: (assetId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  onSeoChange: (patch: Record<string, unknown>) => void;
  onUpdate: (
    sectionId: string,
    slotKey: string,
    patch: Partial<CmsSlot>,
  ) => void;
  onUpdateMediaAsset: (assetId: string, patch: CmsMediaAssetPatch) => void;
  onUpdateSection: (sectionId: string, patch: Partial<CmsSection>) => void;
  onUploadMediaAsset: (file: File, altText: string) => Promise<unknown>;
  onViewportChange: (viewport: CmsViewportMode) => void;
  pages: CmsPageSummary[];
  publishing: boolean;
  saving: boolean;
  selectedAssetId: string;
  selectedPageId: string;
  selectedSectionId: string;
  viewport: CmsViewportMode;
};

export function CmsEditorLayout(props: CmsEditorLayoutProps): ReactNode {
  const {
    assistantOpen,
    dirty,
    draft,
    error,
    loading,
    mediaAssets,
    onAddSection,
    onAssetDrop,
    onAssistantRun,
    onAssistantToggle,
    onBack,
    onCreateImageEdit,
    onCreateMediaAsset,
    onCreatePage,
    onApplyTheme,
    onDesignChange,
    onDraftChange,
    onMoveSection,
    onPageChange,
    onPageUpdate,
    onPublish,
    onRemoveSection,
    onRenamePage,
    onSave,
    onSelectAsset,
    onSectionSelect,
    onSeoChange,
    onUpdate,
    onUpdateMediaAsset,
    onUpdateSection,
    onUploadMediaAsset,
    onViewportChange,
    pages,
    publishing,
    saving,
    selectedAssetId,
    selectedPageId,
    selectedSectionId,
    viewport,
  } = props;

  return (
    <main className="cms-editor-page min-h-screen bg-cms-canvas text-cms-text lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen grid-rows-[auto_1fr] lg:h-screen">
        <EditorHeader
          assistantOpen={assistantOpen}
          dirty={dirty}
          error={error}
          onAssistantToggle={onAssistantToggle}
          onBack={onBack}
          onPublish={onPublish}
          onSave={onSave}
          onViewportChange={onViewportChange}
          publishing={publishing}
          saving={saving}
          viewport={viewport}
        />
        <div className="cms-editor-layout relative grid min-h-0 w-full grid-cols-1 gap-0 pb-14 lg:grid-cols-[332px_minmax(0,1fr)_370px]">
          <WorkspaceSidebar
            assets={mediaAssets}
            draft={draft}
            onApplyTheme={(preset) => onApplyTheme(preset)}
            onCreateImageEdit={onCreateImageEdit}
            onCreateMediaAsset={onCreateMediaAsset}
            onCreatePage={onCreatePage}
            onDraftChange={onDraftChange}
            onPageChange={onPageChange}
            onRenamePage={onRenamePage}
            onSelectAsset={onSelectAsset}
            onUpdateMediaAsset={onUpdateMediaAsset}
            onUploadMediaAsset={onUploadMediaAsset}
            pages={pages}
            selectedAssetId={selectedAssetId}
            selectedPageId={selectedPageId}
          />
          <div className="cms-editor-canvas min-h-0 min-w-0 overflow-auto">
            <EditorCanvas
              draft={draft}
              loading={loading}
              onAssetDrop={onAssetDrop}
              onSectionSelect={onSectionSelect}
              onUploadMediaAsset={onUploadMediaAsset}
              selectedSectionId={selectedSectionId}
              viewport={viewport}
            />
          </div>
          <Inspector
            draft={draft}
            error={error}
            mediaAssets={mediaAssets}
            onAddSection={onAddSection}
            onDesignChange={onDesignChange}
            onDraftChange={onDraftChange}
            onMoveSection={onMoveSection}
            onPageUpdate={onPageUpdate}
            onRemoveSection={onRemoveSection}
            onSelectSection={onSectionSelect}
            onSeoChange={onSeoChange}
            onUpdate={onUpdate}
            onUpdateSection={onUpdateSection}
            selectedSectionId={selectedSectionId}
          />
        </div>
      </div>
      {assistantOpen ? (
        <AssistantModal
          onClose={onAssistantToggle}
          onRun={onAssistantRun}
          running={false}
        />
      ) : null}
    </main>
  );
}
