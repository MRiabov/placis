import { type ReactNode, useState } from "react";

const pages = [
  { id: "home", title: "Home" },
  { id: "services", title: "Services" },
  { id: "contact", title: "Contact" },
  { id: "privacy", title: "Privacy" },
  { id: "terms", title: "Terms" },
] as const;

type PreviewAndEditPanelProps = {
  onPay: () => void;
  onShare: () => void;
};

/** Unpaid website preview shell: live canvas lands here after the wait teaser. */
export function PreviewAndEditPanel({
  onPay,
  onShare,
}: PreviewAndEditPanelProps): ReactNode {
  const [pageId, setPageId] = useState<(typeof pages)[number]["id"]>("home");
  const [listOpen, setListOpen] = useState(false);
  const current = pages.find((item) => item.id === pageId) ?? pages[0];

  return (
    <div className="relative flex min-h-[70vh] flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="relative">
          <button
            aria-expanded={listOpen}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-sm font-medium"
            onClick={() => setListOpen((open) => !open)}
            type="button"
          >
            {current.title}
          </button>
          {listOpen ? (
            <ul className="absolute top-full left-0 z-20 mt-1 min-w-40 rounded-md border border-border bg-background py-1 shadow-sm">
              {pages.map((item) => (
                <li key={item.id}>
                  <button
                    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setPageId(item.id);
                      setListOpen(false);
                    }}
                    type="button"
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center rounded-md bg-foreground px-3 text-sm font-semibold text-background"
            onClick={onPay}
            type="button"
          >
            Pay to activate
          </button>
          <button
            className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium"
            onClick={onShare}
            type="button"
          >
            Share
          </button>
          <span className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium">
            Assistant
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 p-6">
        <p className="text-sm text-muted-foreground">Unpublished website</p>
        <h1 className="mt-2 text-2xl font-semibold">{current.title}</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Canvas follows website copy generation over onboarding SSE, then
          Assistant prompts apply with website-editor PATCH after sign-in.
        </p>
      </div>
    </div>
  );
}
