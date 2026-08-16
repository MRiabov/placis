import { useCallback, useState, type ReactNode } from "react";

import {
  useAttachEditorAssetToSlot,
  useCreateEditorSection,
  useEditorAssets,
  usePublishEditorPage,
} from "../queries";
import type { CmsMediaAsset } from "../api/cms";
import type { CmsViewportMode } from "../types";
import { useEditorMediaHandlers } from "../editor/useEditorMediaHandlers";
import { assetLabel } from "../editor/media/mediaModel";
import { CmsEditorLayout } from "../editor/CmsEditorLayout";
import { useEditorAssistant } from "../editor/useEditorAssistant";
import { useEditorInspectorHandlers } from "../editor/useEditorInspectorHandlers";
import type { cmsThemePresets } from "../editor/workspace/themes/presets";
import { useWebsiteEditorResources } from "../editor/useWebsiteEditorResources";

export type WebsiteEditorViewProps = {
  onBack: () => void;
};

export function WebsiteEditorView({
  onBack,
}: WebsiteEditorViewProps): ReactNode {
  const {
    createPage,
    draft,
    dirty,
    error,
    loading,
    pages,
    renamePage,
    save,
    selectPage,
    selectedPageId,
    setDraft,
  } = useWebsiteEditorResources();
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [viewport, setViewport] = useState<CmsViewportMode>("desktop");
  const publish = usePublishEditorPage(selectedPageId);
  const createSection = useCreateEditorSection(selectedPageId);
  const attachAsset = useAttachEditorAssetToSlot(selectedPageId);
  const { data: mediaAssets } = useEditorAssets();
  const assistant = useEditorAssistant(selectedPageId, selectedSectionId, setDraft);
  const media = useEditorMediaHandlers(mediaAssets ?? [], "");

  const handleAssetDrop = useCallback(
    (
      sectionId: string,
      slotKey: string,
      asset: CmsMediaAsset,
      targetImageUrl?: string,
    ) => {
      void attachAsset
        .mutateAsync({
          assetId: asset.id,
          label: assetLabel(asset),
          sectionId,
          slotKey,
          ...(targetImageUrl ? { targetImageUrl } : {}),
        })
        .then((projection) => {
          setDraft(projection);
          setSelectedSectionId(sectionId);
        })
        .catch(() => {
          // attach errors surface through the editor header error state
        });
    },
    [attachAsset, setDraft],
  );

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      await publish.mutateAsync();
    } finally {
      setPublishing(false);
    }
  }, [publish]);

  const handleSelectPage = useCallback(
    (pageId: string) => {
      selectPage(pageId);
      setSelectedSectionId("");
    },
    [selectPage],
  );

  const inspectorHandlers = useEditorInspectorHandlers(
    draft,
    createSection,
    setDraft,
  );

  const handleApplyTheme = useCallback(
    (preset: (typeof cmsThemePresets)[number]) => {
      if (!draft) {
        return;
      }
      setDraft({ ...draft, theme: preset.runtimeTheme });
    },
    [draft, setDraft],
  );

  return (
    <CmsEditorLayout
      {...inspectorHandlers}
      dirty={dirty}
      draft={draft}
      error={error}
      loading={loading}
      mediaAssets={mediaAssets ?? []}
      onAssetDrop={handleAssetDrop}
      onApplyTheme={handleApplyTheme}
      assistantOpen={assistant.assistantOpen}
      onAssistantRun={assistant.onRun}
      onAssistantToggle={assistant.onAssistantToggle}
      onBack={onBack}
      onCreateImageEdit={media.onCreateImageEdit}
      onCreateMediaAsset={media.onCreateMediaAsset}
      onCreatePage={createPage}
      onPageChange={handleSelectPage}
      onPublish={() => void handlePublish()}
      onRenamePage={renamePage}
      onSave={() => void save()}
      onSelectAsset={media.onSelectAsset}
      onSectionSelect={setSelectedSectionId}
      onUpdateMediaAsset={media.onUpdateMediaAsset}
      onUploadMediaAsset={media.onUploadMediaAsset}
      onViewportChange={setViewport}
      pages={pages}
      publishing={publishing}
      saving={publish.isPending}
      selectedAssetId={media.selectedAssetId}
      selectedPageId={selectedPageId}
      selectedSectionId={selectedSectionId}
      viewport={viewport}
    />
  );
}
