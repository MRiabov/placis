import { useCallback, useEffect, useRef, useState } from "react";

import {
  useCreateEditorPage,
  useEditorPage,
  useEditorPages,
  useSaveEditorPage,
} from "../queries";
import type { CmsPageProjection, CmsPageSummary } from "../api/cms";

export type WebsiteEditorResources = {
  createPage: (title: string, path: string) => Promise<void>;
  draft: CmsPageProjection | null;
  dirty: boolean;
  error: string | null;
  loading: boolean;
  pages: CmsPageSummary[];
  renamePage: (pageId: string, title: string) => Promise<void>;
  save: () => Promise<void>;
  selectPage: (pageId: string) => void;
  selectedPageId: string;
  setDirty: (dirty: boolean) => void;
  setDraft: (draft: CmsPageProjection) => void;
};

/** Editor document state: selected page + the working draft copy + dirty flag.
 *  Server state (pages, page projections) rides the TanStack Query hooks. */
export function useWebsiteEditorResources(): WebsiteEditorResources {
  const pagesQuery = useEditorPages();
  const [selectedPageId, setSelectedPageId] = useState("");
  const pages = pagesQuery.data ?? [];
  // Default to the first page until the user picks one (old app behaviour).
  const firstPage = pages[0];
  const effectivePageId = selectedPageId || firstPage?.id || "";
  const pageQuery = useEditorPage(effectivePageId || undefined);
  const createPage = useCreateEditorPage();
  const savePage = useSaveEditorPage(selectedPageId);
  const [draft, setDraft] = useState<CmsPageProjection | null>(null);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);

  // Follow the loaded projection unless the editor made local (unsaved) edits.
  const pageData = pageQuery.data ?? null;
  const loadedPageIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!pageData) {
      return;
    }
    if (loadedPageIdRef.current === pageData.page.id && dirtyRef.current) {
      return;
    }
    loadedPageIdRef.current = pageData.page.id;
    dirtyRef.current = false;
    setDirty(false);
    setDraft(pageData);
  }, [pageData]);

  const markDirty = useCallback((nextDraft: CmsPageProjection) => {
    dirtyRef.current = true;
    setDirty(true);
    setDraft(nextDraft);
  }, []);

  const error =
    pagesQuery.error instanceof Error
      ? pagesQuery.error.message
      : pageQuery.error instanceof Error
        ? pageQuery.error.message
        : null;
  const loading = pagesQuery.isPending || pageQuery.isPending;

  const selectPage = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    dirtyRef.current = false;
    setDirty(false);
    setDraft(null);
    loadedPageIdRef.current = null;
  }, []);

  const renamePage = useCallback(
    async (pageId: string, title: string) => {
      if (pageId !== selectedPageId) {
        return;
      }
      const current = draft;
      if (!current) {
        return;
      }
      const renamed = { ...current, page: { ...current.page, title } };
      await savePage.mutateAsync({ title });
      setDraft(renamed);
      dirtyRef.current = false;
      setDirty(false);
    },
    [draft, savePage, selectedPageId],
  );

  const save = useCallback(async () => {
    if (!dirtyRef.current || !draft) {
      return;
    }
    await savePage.mutateAsync({});
    dirtyRef.current = false;
    setDirty(false);
  }, [draft, savePage]);

  const createPageWithDefaults = useCallback(
    async (title: string, path: string) => {
      await createPage.mutateAsync({
        page_type: "standard",
        path,
        title,
      });
      await pagesQuery.refetch();
    },
    [createPage, pagesQuery],
  );

  return {
    createPage: createPageWithDefaults,
    draft,
    dirty,
    error,
    loading,
    pages,
    renamePage,
    save,
    selectPage,
    selectedPageId: effectivePageId,
    setDirty,
    setDraft: markDirty,
  };
}
