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
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3">
          <div className="relative">
            <button
              aria-expanded={listOpen}
              className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-sm font-medium shadow-sm"
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
            className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium shadow-sm"
            onClick={onShare}
            type="button"
          >
            Share
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-end p-3 pt-16">
          <p className="text-sm text-muted-foreground">Unpublished website</p>
          <h1 className="mt-2 text-2xl font-semibold">{titleFor(pageId)}</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Canvas follows website copy generation over onboarding SSE. Send and
            Voice need Sign up with Google, then website-editor PATCH.
          </p>
          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-background p-2">
            <p className="text-xs font-medium">Assistant</p>
            <input
              className="h-11 w-full rounded-md border border-border bg-muted px-3 text-sm"
              placeholder="Change this website page…"
              readOnly
            />
            <button
              className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-3 text-sm font-medium text-background"
              type="button"
            >
              Sign up with Google
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 min-[640px]:flex-row min-[640px]:items-center min-[640px]:justify-between">
        <div className="flex min-w-0 items-start justify-between gap-3 min-[640px]:contents">
          <div className="min-w-0">
            <p className="text-sm font-semibold">This website is ready</p>
            <p className="text-xs text-muted-foreground">
              One-time · then about €50 / month
            </p>
          </div>
          <p className="shrink-0 text-right text-sm font-semibold">EUR 4,900</p>
        </div>
        <button
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-foreground px-4 text-sm font-semibold text-background min-[640px]:w-auto"
          onClick={onPay}
          type="button"
        >
          Activate this website
        </button>
      </div>
    </div>
  );
}
