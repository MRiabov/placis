import {
  loadPublicSiteComponents,
  pageSections,
  PublicSiteRenderer,
  resolveManifestPage,
  type LoadedPublicSiteComponent,
  type PublicSitePage,
  type PublicSiteSection,
} from "@placis/public-site-components";
import { type DragEvent, useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import type { CmsMediaAsset, CmsPageProjection } from "../api/cms";
import type { CmsViewportMode } from "../types";
import { imageUrlFromDropTarget, mediaDropSlot, publicManifestFromDraft } from "./cmsModel";
import {
  hasImageFileDrag,
  mediaAssetFromTransfer,
  mediaDragType,
} from "./media/mediaModel";

/** Live canvas: renders the draft page through the shared public-site runtime,
 *  with section outlines for selection. */
export type EditorCanvasProps = {
  draft: CmsPageProjection | null;
  loading: boolean;
  selectedSectionId: string;
  viewport: CmsViewportMode;
  onAssetDrop: (
    sectionId: string,
    slotKey: string,
    asset: CmsMediaAsset,
    targetImageUrl?: string,
  ) => void;
  onUploadMediaAsset: (file: File, altText: string) => Promise<unknown>;
  onSectionSelect: (sectionId: string) => void;
};

const viewportWidths: Record<CmsViewportMode, number> = {
  desktop: 1080,
  tablet: 760,
  mobile: 390,
};

/** Canvas drag handling: internal media-asset drags attach to the targeted
 *  image slot; OS image file drops upload through the media chain and then
 *  attach (or land in the media library when no slot is under the cursor). */
function useCanvasDropHandlers({
  draft,
  onAssetDrop,
  onUploadMediaAsset,
}: {
  draft: CmsPageProjection | null;
  onAssetDrop: EditorCanvasProps["onAssetDrop"];
  onUploadMediaAsset: (file: File, altText: string) => Promise<unknown>;
}): {
  handleDragOver: (event: DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: DragEvent<HTMLDivElement>) => void;
} {
  function draftSections() {
    return draft?.sections ?? [];
  }

  // The canvas outlines use index-based section ids (matching the render
  // order); resolve them back to the draft's real section.
  function sectionById(sectionId: string) {
    return draftSections()[Number(sectionId)] ?? null;
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    const hasAsset = event.dataTransfer.types.includes(mediaDragType);
    const hasImageFile = hasImageFileDrag(event);
    if (!hasAsset && !hasImageFile) {
      return;
    }
    const sectionId = sectionIdFromDragEvent(event);
    const section = sectionById(sectionId);
    const targetImageUrl = imageUrlFromDropTarget(event.target);
    if (!hasAsset && !section) {
      return;
    }
    if (hasAsset && (!section || !mediaDropSlot(section, targetImageUrl))) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    const hasAsset = event.dataTransfer.types.includes(mediaDragType);
    const files = Array.from(event.dataTransfer.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!hasAsset && !files.length) {
      return;
    }
    const sectionId = sectionIdFromDragEvent(event);
    const section = sectionById(sectionId);
    const targetImageUrl = imageUrlFromDropTarget(event.target);
    const targetSlot = section ? mediaDropSlot(section, targetImageUrl) : null;
    event.preventDefault();
    if (hasAsset) {
      const asset = mediaAssetFromTransfer(event.dataTransfer);
      if (!section || !targetSlot || !asset) {
        return;
      }
      onAssetDrop(sectionId, targetSlot.key, asset, targetImageUrl);
      return;
    }
    const file = files[0];
    if (!file) {
      return;
    }
    void onUploadMediaAsset(file, "").then((uploaded) => {
      const asset = uploaded as CmsMediaAsset | null;
      if (asset?.id && section && targetSlot) {
        onAssetDrop(sectionId, targetSlot.key, asset, targetImageUrl);
      }
    });
  }

  return { handleDragOver, handleDrop };
}

export function EditorCanvas({
  draft,
  loading,
  selectedSectionId,
  viewport,
  onAssetDrop,
  onSectionSelect,
  onUploadMediaAsset,
}: EditorCanvasProps): ReactNode {
  const { handleDragOver, handleDrop } = useCanvasDropHandlers({
    draft,
    onAssetDrop,
    onUploadMediaAsset,
  });
  const manifest = useMemo(
    () => (draft ? publicManifestFromDraft(draft) : null),
    [draft],
  );
  const page = useMemo(
    () => (manifest ? resolveManifestPage(manifest, "/") : null),
    [manifest],
  );
  const sections = useMemo(() => (page ? pageSections(page) : []), [page]);
  const sectionsKey = sections.map((_, index) => String(index)).join(",");
  const [loadedBySections, setLoadedBySections] = useState<{
    components: LoadedPublicSiteComponent[];
    key: string;
  } | null>(null);

  useEffect(() => {
    if (!sections.length) {
      return;
    }
    let cancelled = false;
    void loadPublicSiteComponents(sections).then((loaded) => {
      if (!cancelled) {
        setLoadedBySections({ components: loaded, key: sectionsKey });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sections, sectionsKey]);

  const loadedComponents =
    loadedBySections?.key === sectionsKey ? loadedBySections.components : null;

  if (loading) {
    return (
      <div className="grid h-full min-h-[50vh] place-items-center text-sm text-muted-foreground">
        Loading page…
      </div>
    );
  }

  if (!draft || !manifest || !page) {
    return (
      <div className="grid h-full min-h-[50vh] place-items-center text-sm text-muted-foreground">
        Select a page to start editing.
      </div>
    );
  }

  if (!loadedComponents) {
    return (
      <div className="grid h-full min-h-[50vh] place-items-center text-sm text-muted-foreground">
        Rendering components…
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] border border-border bg-muted/40 p-4">
      <div
        className="mx-auto transition-all"
        onDragOverCapture={handleDragOver}
        onDropCapture={handleDrop}
        style={{ maxWidth: "100%", width: viewportWidths[viewport] }}
      >
        <CanvasSections
          loadedComponents={loadedComponents}
          manifest={manifest}
          onSectionSelect={onSectionSelect}
          page={page}
          sectionIds={(draft?.sections ?? []).map((section) => section.id)}
          sections={sections}
          selectedSectionId={selectedSectionId}
        />
      </div>
    </div>
  );
}

function sectionIdFromDragEvent(
  event: DragEvent<HTMLDivElement>,
): string {
  const target = event.target;
  if (!(target instanceof Element)) {
    return "";
  }
  const sectionElement = target.closest<HTMLElement>("[data-cms-section-id]");
  const sectionId = (sectionElement?.dataset as { cmsSectionId?: string })
    .cmsSectionId;
  return sectionId ?? "";
}

function CanvasSections({
  loadedComponents,
  manifest,
  onSectionSelect,
  page,
  sectionIds,
  sections,
  selectedSectionId,
}: {
  loadedComponents: LoadedPublicSiteComponent[];
  manifest: ReturnType<typeof publicManifestFromDraft>;
  onSectionSelect: (sectionId: string) => void;
  page: PublicSitePage;
  sectionIds: string[];
  sections: PublicSiteSection[];
  selectedSectionId: string;
}): ReactNode {
  return (
    <div className="relative">
      <PublicSiteRenderer
        className="min-h-0"
        context={{ mode: "preview", path: "/" }}
        loadedComponents={loadedComponents}
        manifest={manifest}
        page={page}
      />
      {sections.length ? (
        <div className="pointer-events-none absolute inset-0 grid">
          {sections.map((_, index) => (
            <button
              aria-label={`Select section ${index + 1}`}
              data-cms-section-id={sectionIds[index] ?? ""}
              className={cn(
                "pointer-events-auto cursor-pointer border-2 transition",
                sectionIds[index] === selectedSectionId
                  ? "border-foreground"
                  : "border-transparent hover:border-foreground/40",
              )}
              key={sectionIds[index]}
              onClick={() => onSectionSelect(sectionIds[index] ?? "")}
              style={{ gridRow: index + 1 }}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
