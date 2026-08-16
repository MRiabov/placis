import { FilePlus2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import type { CmsPageSummary } from "../api/cms";
import { isUtilityPage, pageDisplayName } from "./cmsModel";

export type PagesWorkspacePanelProps = {
  pages: CmsPageSummary[];
  selectedPageId: string;
  onCreatePage: (title: string, path: string) => Promise<void>;
  onPageChange: (pageId: string) => void;
  onRenamePage: (pageId: string, title: string) => Promise<void>;
};

export function PagesWorkspacePanel({
  pages,
  selectedPageId,
  onCreatePage,
  onPageChange,
  onRenamePage,
}: PagesWorkspacePanelProps): ReactNode {
  const [adding, setAdding] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const primaryPages = pages.filter((page) => !isUtilityPage(page));
  const utilityPages = pages.filter((page) => isUtilityPage(page));

  async function handleCreate(): Promise<void> {
    const title = addTitle.trim();
    if (!title) {
      return;
    }
    setAdding(true);
    try {
      await onCreatePage(title, `/${title.toLowerCase().replace(/\s+/g, "-")}`);
      setAddTitle("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <p className="font-semibold text-sm text-foreground">Pages</p>
        <button
          aria-label="New page"
          className="inline-flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:text-foreground"
          onClick={() => setAdding((current) => !current)}
          type="button"
        >
          <FilePlus2 className="size-4" />
        </button>
      </div>

      {adding ? (
        <div className="px-3 pt-2">
          <input
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground/50"
            onChange={(event) => setAddTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleCreate();
              }
            }}
            placeholder="New page title"
            value={addTitle}
          />
        </div>
      ) : null}

      <PageList
        onPageChange={onPageChange}
        onRename={onRenamePage}
        onRenamingChange={(pageId, value) => {
          setRenamingId(pageId);
          setRenameValue(value);
        }}
        pages={primaryPages}
        renamingId={renamingId}
        renameValue={renameValue}
        selectedPageId={selectedPageId}
      />

      {utilityPages.length ? (
        <>
          <p className="px-3 pt-4 pb-1 text-[11px] font-medium text-muted-foreground uppercase">
            Utility
          </p>
          <PageList
            onPageChange={onPageChange}
            onRename={onRenamePage}
            onRenamingChange={(pageId, value) => {
              setRenamingId(pageId);
              setRenameValue(value);
            }}
            pages={utilityPages}
            renamingId={renamingId}
            renameValue={renameValue}
            selectedPageId={selectedPageId}
          />
        </>
      ) : null}

      <div className="flex-1" />
      <p className="px-3 pb-3 text-[11px] leading-4 text-muted-foreground">
        Select a page to edit it on the canvas.
      </p>
    </div>
  );
}

function PageList({
  onPageChange,
  onRename,
  onRenamingChange,
  pages,
  renamingId,
  renameValue,
  selectedPageId,
}: {
  onPageChange: (pageId: string) => void;
  onRename: (pageId: string, title: string) => Promise<void>;
  onRenamingChange: (pageId: string | null, value: string) => void;
  pages: CmsPageSummary[];
  renamingId: string | null;
  renameValue: string;
  selectedPageId: string;
}): ReactNode {
  return (
    <div className="mt-1 grid gap-0.5 px-2">
      {pages.map((page) => {
        const renaming = renamingId === page.id;
        if (renaming) {
          return (
            <input
              className="min-w-0 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none"
              key={page.id}
              onChange={(event) => onRenamingChange(page.id, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onRenamingChange(null, renameValue);
                  void onRename(page.id, renameValue.trim() || page.title);
                }
                if (event.key === "Escape") {
                  onRenamingChange(null, renameValue);
                }
              }}
              value={renameValue}
            />
          );
        }
        return (
          <button
            className={cn(
              "flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition",
              page.id === selectedPageId
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            key={page.id}
            onClick={() => onPageChange(page.id)}
            onDoubleClick={() => onRenamingChange(page.id, page.title)}
            type="button"
          >
            <span className="min-w-0 truncate">{pageDisplayName(page)}</span>
          </button>
        );
      })}
    </div>
  );
}
