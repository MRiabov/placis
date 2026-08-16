import { ArrowRight, AudioLines, Paperclip } from "lucide-react";
import { useState, type ReactNode } from "react";

export type CmsDashboardPromptProps = {
  onSubmitPrompt: (prompt: string) => void;
};

/** Markup ported from the old dashboard prompt (copy-then-wire): the
 *  attachment upload + voice overlay logic arrives with the media/assistant
 *  batches; the submit navigates to the editor with the prompt for now. */
export function CmsDashboardPrompt({
  onSubmitPrompt,
}: CmsDashboardPromptProps): ReactNode {
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<{
    filename: string;
    id: string;
  } | null>(null);

  function submit(): void {
    const prompt = value.trim();
    if (!prompt) {
      return;
    }
    onSubmitPrompt(prompt);
    setValue("");
  }

  return (
    <section
      aria-labelledby="cms-dashboard-prompt-title"
      className="cms-dashboard-prompt-wrap"
    >
        <h1
          className="cms-dashboard-wordmark"
          id="cms-dashboard-prompt-title"
        >
          placis
        </h1>
        <form
          className="cms-dashboard-prompt"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="cms-dashboard-prompt-label">Upgrade to Placis Pro</div>
          <textarea
            aria-label="Describe what you want Placis to build"
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey) {
                return;
              }
              event.preventDefault();
              submit();
            }}
            placeholder="Describe what you want Placis to build..."
            rows={2}
            value={value}
          />
          {attachment ? (
            <div className="cms-dashboard-prompt-attachment">
              <Paperclip aria-hidden="true" />
              <span>{attachment.filename}</span>
              <button
                aria-label={`Remove ${attachment.filename}`}
                onClick={() => setAttachment(null)}
                type="button"
              >
                ×
              </button>
            </div>
          ) : null}
          <div className="cms-dashboard-prompt-actions">
            <div className="cms-dashboard-prompt-left-actions">
              <input
                accept="image/*"
                aria-label="Choose an image to attach"
                className="cms-dashboard-prompt-file-input"
                type="file"
              />
              <button
                aria-label="Attach a file"
                className="cms-dashboard-prompt-icon"
                title="Attach an image"
                type="button"
              >
                <Paperclip aria-hidden="true" />
              </button>
            </div>
            <div className="cms-dashboard-prompt-right-actions">
              <button
                aria-label="Start voice input"
                className="cms-dashboard-prompt-icon"
                title="Start voice input"
                type="button"
              >
                <AudioLines aria-hidden="true" />
              </button>
              <button
                aria-label="Send prompt"
                className="cms-dashboard-prompt-send"
                disabled={!value.trim()}
                type="submit"
              >
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
      </form>
    </section>
  );
}
