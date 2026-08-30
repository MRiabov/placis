import { type ReactNode, useState } from "react";

const pages = [
  { id: "home", title: "Home" },
  {
    id: "services",
    title: "Services",
    children: [
      { id: "roof-repairs", title: "Roof repairs" },
      { id: "new-roofs", title: "New roofs" },
      { id: "guttering", title: "Guttering" },
    ],
  },
  { id: "contact", title: "Contact" },
  { id: "privacy", title: "Privacy" },
  { id: "terms", title: "Terms" },
] as const;

type PreviewAndEditPanelProps = {
  onPay: () => void;
  onShare: () => void;
};

function titleFor(pageId: string): string {
  for (const node of pages) {
    if (node.id === pageId) {
      return node.title;
    }
    if ("children" in node) {
      const child = node.children.find((item) => item.id === pageId);
      if (child) {
        return child.title;
      }
    }
  }
  return "Home";
}

/** Unpaid website preview shell: live canvas lands here after the wait teaser. */
export function PreviewAndEditPanel({
  onPay,
  onShare,
}: PreviewAndEditPanelProps): ReactNode {
  const [pageId, setPageId] = useState("home");
  const [listOpen, setListOpen] = useState(false);

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
            {titleFor(pageId)}
          </button>
          {listOpen ? (
            <ul className="absolute top-full left-0 z-20 mt-1 min-w-48 rounded-md border border-border bg-background py-1 shadow-sm">
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
                  {"children" in item
                    ? item.children.map((child) => (
                        <button
                          className="block w-full px-3 py-1.5 pl-7 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          key={child.id}
                          onClick={() => {
                            setPageId(child.id);
                            setListOpen(false);
                          }}
                          type="button"
                        >
                          {child.title}
                        </button>
                      ))
                    : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button
          className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium"
          onClick={onShare}
          type="button"
        >
          Share
        </button>
      </div>
      <div className="relative min-h-0 flex-1 p-6">
        <p className="text-sm text-muted-foreground">Unpublished website</p>
        <h1 className="mt-2 text-2xl font-semibold">{titleFor(pageId)}</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Canvas follows website copy generation over onboarding SSE, then
          Assistant prompts apply with website-editor PATCH after sign-in.
        </p>
        <span className="absolute right-3 bottom-3 inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium">
          Assistant
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold">This website is ready</p>
          <p className="text-xs text-muted-foreground">
            One-time · then about €50 / month
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-semibold text-background"
          onClick={onPay}
          type="button"
        >
          Activate this website
        </button>
      </div>
    </div>
  );
}
