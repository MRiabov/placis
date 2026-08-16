import { useCallback, useMemo } from "react";
import type { UseMutationResult } from "@tanstack/react-query";

import type {
  CmsPageProjection,
  CmsSection,
  CmsSectionCreate,
  CmsSectionDesign,
  CmsSlot,
} from "../api/cms";
import {
  moveSection as moveSectionInDraft,
  removeSection as removeSectionFromDraft,
  updatePage as updatePageInDraft,
  updateSection as updateSectionInDraft,
  updateSeo as updateSeoInDraft,
  updateSlot as updateSlotInDraft,
} from "./inspector/inspectorModel";

export type EditorInspectorHandlers = {
  onAddSection: (componentId: string) => void;
  onDesignChange: (sectionId: string, design: CmsSectionDesign) => void;
  onDraftChange: (draft: CmsPageProjection) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onPageUpdate: (patch: { title?: string; path?: string }) => void;
  onRemoveSection: (sectionId: string) => void;
  onSeoChange: (patch: Record<string, unknown>) => void;
  onUpdate: (
    sectionId: string,
    slotKey: string,
    patch: Partial<CmsSlot>,
  ) => void;
  onUpdateSection: (sectionId: string, patch: Partial<CmsSection>) => void;
};

/** Inspector draft mutations wired to the editor's draft state. */
export function useEditorInspectorHandlers(
  draft: CmsPageProjection | null,
  createSection: UseMutationResult<CmsPageProjection, Error, CmsSectionCreate>,
  setDraft: (draft: CmsPageProjection) => void,
): EditorInspectorHandlers {
  const onAddSection = useCallback(
    (componentId: string) => {
      if (!draft) {
        return;
      }
      void createSection.mutateAsync({
        component_id: componentId,
        position: draft.sections?.length ?? 0,
      });
    },
    [createSection, draft],
  );

  const onMoveSection = useCallback(
    (sectionId: string, direction: -1 | 1) => {
      if (!draft) {
        return;
      }
      setDraft(moveSectionInDraft(draft, sectionId, direction));
    },
    [draft, setDraft],
  );

  const onRemoveSection = useCallback(
    (sectionId: string) => {
      if (!draft) {
        return;
      }
      setDraft(removeSectionFromDraft(draft, sectionId));
    },
    [draft, setDraft],
  );

  const onUpdate = useCallback(
    (sectionId: string, slotKey: string, patch: Partial<CmsSlot>) => {
      if (!draft) {
        return;
      }
      setDraft(updateSlotInDraft(draft, sectionId, slotKey, patch));
    },
    [draft, setDraft],
  );

  const onUpdateSection = useCallback(
    (sectionId: string, patch: Partial<CmsSection>) => {
      if (!draft) {
        return;
      }
      setDraft(updateSectionInDraft(draft, sectionId, patch));
    },
    [draft, setDraft],
  );

  const onDesignChange = useCallback(
    (sectionId: string, design: CmsSectionDesign) => {
      if (!draft) {
        return;
      }
      setDraft(updateSectionInDraft(draft, sectionId, { design }));
    },
    [draft, setDraft],
  );

  const onDraftChange = useCallback(
    (nextDraft: CmsPageProjection) => setDraft(nextDraft),
    [setDraft],
  );

  const onPageUpdate = useCallback(
    (patch: { title?: string; path?: string }) => {
      if (!draft) {
        return;
      }
      setDraft(updatePageInDraft(draft, patch));
    },
    [draft, setDraft],
  );

  const onSeoChange = useCallback(
    (patch: Record<string, unknown>) => {
      if (!draft) {
        return;
      }
      setDraft(updateSeoInDraft(draft, patch));
    },
    [draft, setDraft],
  );

  return useMemo(
    () => ({
      onAddSection,
      onDesignChange,
      onDraftChange,
      onMoveSection,
      onPageUpdate,
      onRemoveSection,
      onSeoChange,
      onUpdate,
      onUpdateSection,
    }),
    [
      onAddSection,
      onDesignChange,
      onDraftChange,
      onMoveSection,
      onPageUpdate,
      onRemoveSection,
      onSeoChange,
      onUpdate,
      onUpdateSection,
    ],
  );
}
