import { useCallback, useState } from "react";

import { useRunEditorAssistant } from "../queries";
import type { CmsAssistantResponse, CmsPageProjection } from "../api/cms";

export type EditorAssistantState = {
  assistantOpen: boolean;
  onAssistantToggle: () => void;
  onRun: (
    prompt: string,
    planMarkdown?: string,
  ) => Promise<CmsAssistantResponse | null>;
};

export function useEditorAssistant(
  pageId: string,
  selectedSectionId: string,
  setDraft: (draft: CmsPageProjection) => void,
): EditorAssistantState {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const runAssistant = useRunEditorAssistant(pageId);

  const onRun = useCallback(
    async (prompt: string, planMarkdown?: string) => {
      try {
        const response = await runAssistant.mutateAsync({
          request: {
            apply: Boolean(planMarkdown),
            approved_plan_markdown: planMarkdown ?? null,
            mode: "plan",
            prompt,
            selected_section_id: selectedSectionId || null,
          },
        });
        if (response.page) {
          setDraft(response.page);
        }
        return response;
      } catch {
        return null;
      }
    },
    [runAssistant, selectedSectionId, setDraft],
  );

  return {
    assistantOpen,
    onAssistantToggle: () => setAssistantOpen((current) => !current),
    onRun,
  };
}
