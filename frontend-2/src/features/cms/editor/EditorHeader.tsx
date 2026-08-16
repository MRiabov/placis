import { Monitor, Smartphone, Sparkles, Tablet } from "lucide-react";
import type { ReactNode } from "react";

import type { CmsViewportMode } from "../types";
import { EditorBackLink } from "./WorkspaceSidebar";

export type EditorHeaderProps = {
  assistantOpen: boolean;
  dirty: boolean;
  error: string | null;
  onAssistantToggle: () => void;
  onBack: () => void;
  onPublish: () => void;
  onSave: () => void;
  onViewportChange: (viewport: CmsViewportMode) => void;
  publishing: boolean;
  saving: boolean;
  viewport: CmsViewportMode;
};

const viewportOptions: Array<{
  icon: typeof Monitor;
  label: string;
  value: CmsViewportMode;
}> = [
  { icon: Monitor, label: "Desktop", value: "desktop" },
  { icon: Tablet, label: "Tablet", value: "tablet" },
  { icon: Smartphone, label: "Mobile", value: "mobile" },
];

export function EditorHeader({
  assistantOpen,
  dirty,
  error,
  onAssistantToggle,
  onBack,
  onPublish,
  onSave,
  onViewportChange,
  publishing,
  saving,
  viewport,
}: EditorHeaderProps): ReactNode {
  return (
    <header className="cms-editor-header border-cms-border-subtle border-b bg-cms-surface px-4 py-3 shadow-sm">
      <div className="cms-editor-header-inner mx-auto grid max-w-[1580px] grid-cols-1 items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="min-w-0">
          <EditorBackLink onBack={onBack} />
          <h1 className="mt-1 truncate font-semibold text-lg tracking-normal">
            Website editor
          </h1>
        </div>
        <div className="cms-editor-header-controls">
          <button
            aria-label="Open AI assistant"
            aria-pressed={assistantOpen}
            className={assistantOpen ? "cms-viewport-control is-active" : "cms-viewport-control"}
            onClick={onAssistantToggle}
            type="button"
          >
            <Sparkles aria-hidden="true" size={15} />
            <span>AI</span>
          </button>
          <ViewportControl onChange={onViewportChange} value={viewport} />
          <div className="cms-editor-header-actions">
            {error ? (
              <p className="text-xs text-cms-danger">{error}</p>
            ) : null}
            <button
              className="button-secondary"
              disabled={!dirty || saving}
              onClick={onSave}
              type="button"
            >
              {saving ? "Saving" : "Save"}
            </button>
            <button
              className="button-primary"
              disabled={publishing}
              onClick={onPublish}
              type="button"
            >
              {publishing ? "Publishing" : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function ViewportControl({
  onChange,
  value,
}: {
  onChange: (viewport: CmsViewportMode) => void;
  value: CmsViewportMode;
}): ReactNode {
  return (
    <fieldset aria-label="Preview viewport" className="cms-viewport-control">
      {viewportOptions.map((option) => {
        const Icon = option.icon;
        return (
          <button
            aria-pressed={option.value === value}
            className={option.value === value ? "is-active" : ""}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <Icon aria-hidden="true" size={15} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </fieldset>
  );
}
