import { Sparkles, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { CmsAssistantResponse } from "../../api/cms";

export type AssistantModalProps = {
  onClose: () => void;
  onRun: (prompt: string, planMarkdown?: string) => Promise<CmsAssistantResponse | null>;
  running: boolean;
};

/** Compact assistant: prompt -> plan -> apply, matching the old two-step. */
export function AssistantModal({
  onClose,
  onRun,
  running,
}: AssistantModalProps): ReactNode {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<CmsAssistantResponse | null>(null);

  async function runPlan() {
    const trimmed = prompt.trim();
    if (!trimmed || running) {
      return;
    }
    setResponse(null);
    const runResult = await onRun(trimmed);
    setResponse(runResult ?? null);
  }

  async function runApply() {
    if (!response?.plan_markdown || running) {
      return;
    }
    await onRun(prompt.trim() || "", response.plan_markdown);
    onClose();
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      role="dialog"
    >
      <div className="grid w-full max-w-lg gap-3 rounded-lg border border-cms-border bg-cms-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles aria-hidden="true" size={16} />
            AI assistant
          </div>
          <button
            aria-label="Close assistant"
            className="text-cms-text-muted"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
        <textarea
          aria-label="Assistant prompt"
          className="cms-field-control"
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="e.g. Make the homepage focus on emergency callouts"
          rows={3}
          value={prompt}
        />
        <div className="flex gap-2">
          <button
            className="button-primary"
            disabled={!prompt.trim() || running}
            onClick={() => void runPlan()}
            type="button"
          >
            {running ? "Thinking…" : "Plan"}
          </button>
          {response?.plan_markdown ? (
            <button
              className="button-secondary"
              disabled={running}
              onClick={() => void runApply()}
              type="button"
            >
              Apply plan
            </button>
          ) : null}
        </div>
        {response ? (
          <div className="grid gap-2 rounded-lg border border-cms-border bg-cms-raised p-3">
            {response.reply ? (
              <p className="text-sm">{response.reply}</p>
            ) : null}
            {response.plan_markdown ? (
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-cms-text-muted">
                {response.plan_markdown}
              </pre>
            ) : null}
            {response.applied ? (
              <p className="text-xs text-cms-text-muted">
                Plan applied to the page draft.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
