import {
  type LoadedPublicSiteComponent,
  loadPublicSiteComponents,
  type PublicSiteManifest,
  type PublicSitePage,
  PublicSiteRenderer,
  type PublicSiteSection,
  pageSections,
  resolveManifestPage,
} from "@placis/website-components";
import { PanelsTopLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { ProgressEventRead } from "../voice/types";
import { asNumber, asString, pick } from "../voice/valueParsers";

type EditedComponent = {
  componentId: string;
  label: string;
  sectionId: string;
};

type ComponentEditBatch = {
  batchId: string;
  components: EditedComponent[];
  manifest: PublicSiteManifest;
  refreshIntervalMs: number;
};

type WebsiteComponentEditPreviewProps = {
  progressEvents: ProgressEventRead[];
};

/** Live preview of the components being edited, fed by generation events. */
export function WebsiteComponentEditPreview({
  progressEvents,
}: WebsiteComponentEditPreviewProps): ReactNode {
  const batches = useMemo(
    () => progressEvents.map(componentBatchFromEvent).filter(isBatch),
    [progressEvents],
  );
  const latestBatch = batches.at(-1) ?? null;
  const [visibleBatch, setVisibleBatch] = useState<ComponentEditBatch | null>(
    null,
  );
  const [selectedComponentIndex, setSelectedComponentIndex] = useState(0);
  const lastVisibleAtRef = useRef(0);
  const pendingBatchRef = useRef<ComponentEditBatch | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const rotationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!latestBatch) {
      return;
    }
    if (visibleBatch?.batchId === latestBatch.batchId) {
      return;
    }
    const showBatch = (batch: ComponentEditBatch) => {
      lastVisibleAtRef.current = Date.now();
      pendingBatchRef.current = null;
      setVisibleBatch(batch);
      setSelectedComponentIndex(0);
    };

    const minimumIntervalMs = Math.max(latestBatch.refreshIntervalMs, 2000);
    const elapsed = Date.now() - lastVisibleAtRef.current;
    if (!visibleBatch || elapsed >= minimumIntervalMs) {
      showBatch(latestBatch);
      return;
    }

    pendingBatchRef.current = latestBatch;
    if (refreshTimerRef.current !== null) {
      return;
    }
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      const pending = pendingBatchRef.current;
      if (pending) {
        showBatch(pending);
      }
    }, minimumIntervalMs - elapsed);
  }, [latestBatch, visibleBatch]);

  useEffect(() => {
    if (!visibleBatch || visibleBatch.components.length < 2) {
      return;
    }
    const minimumIntervalMs = Math.max(visibleBatch.refreshIntervalMs, 2000);
    rotationTimerRef.current = window.setTimeout(() => {
      rotationTimerRef.current = null;
      setSelectedComponentIndex(
        (current) => (current + 1) % visibleBatch.components.length,
      );
    }, minimumIntervalMs);
    return () => {
      if (rotationTimerRef.current !== null) {
        window.clearTimeout(rotationTimerRef.current);
        rotationTimerRef.current = null;
      }
    };
  }, [visibleBatch]);

  useEffect(
    () => () => {
      for (const timer of [refreshTimerRef.current, rotationTimerRef.current]) {
        if (timer !== null) {
          window.clearTimeout(timer);
        }
      }
    },
    [],
  );

  if (!visibleBatch) {
    return null;
  }
  const selectedComponent =
    visibleBatch.components[
      selectedComponentIndex % visibleBatch.components.length
    ] ?? visibleBatch.components[0];
  if (!selectedComponent) {
    return null;
  }

  return (
    <section
      aria-live="polite"
      className="mt-6 overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50/70 p-3"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
            <PanelsTopLeft className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-emerald-950">
              Component edited now
            </p>
            <p className="truncate text-xs text-emerald-800">
              {selectedComponent.label}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-md bg-white/80 px-2 py-1 font-medium text-emerald-800 text-xs">
          Edited
        </span>
      </div>
      <ComponentBatchRenderer
        batch={visibleBatch}
        selectedComponent={selectedComponent}
      />
    </section>
  );
}

type ComponentBatchRendererProps = {
  batch: ComponentEditBatch;
  selectedComponent: EditedComponent;
};

function ComponentBatchRenderer({
  batch,
  selectedComponent,
}: ComponentBatchRendererProps): ReactNode {
  const page = useMemo(
    () => resolveManifestPage(batch.manifest, "/"),
    [batch.manifest],
  );
  const selectedPage = useMemo(
    () => pageWithSelectedComponent(page, selectedComponent),
    [page, selectedComponent],
  );
  const sections = useMemo(() => pageSections(selectedPage), [selectedPage]);
  const sectionsKey = sections.map((_, index) => String(index)).join(",");
  const [loadedBySections, setLoadedBySections] = useState<{
    components: LoadedPublicSiteComponent[];
    key: string;
  } | null>(null);

  useEffect(() => {
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

  if (!selectedPage) {
    return null;
  }

  if (!loadedComponents) {
    return (
      <div className="grid h-32 place-items-center rounded-md bg-white text-sm text-zinc-500">
        Rendering edited components...
      </div>
    );
  }

  return (
    <div className="max-h-[360px] overflow-hidden rounded-md border border-white bg-white shadow-sm">
      <PublicSiteRenderer
        className="min-h-0"
        context={{ mode: "preview", path: "/" }}
        loadedComponents={loadedComponents}
        manifest={batch.manifest}
        page={selectedPage}
      />
    </div>
  );
}

function pageWithSelectedComponent(
  page: PublicSitePage | null,
  selectedComponent: EditedComponent,
): PublicSitePage | null {
  if (!page) {
    return null;
  }
  const sections = pageSections(page);
  const matchingSections = sections.filter((section) =>
    sectionMatchesEditedComponent(section, selectedComponent),
  );
  if (matchingSections.length === 0) {
    return page;
  }
  return {
    ...(page.path ? { path: page.path } : {}),
    ...(page.title ? { title: page.title } : {}),
    ...(page.seo ? { seo: page.seo } : {}),
    sections: matchingSections,
  };
}

function sectionMatchesEditedComponent(
  section: PublicSiteSection,
  editedComponent: EditedComponent,
): boolean {
  return (
    asString(section.component_id ?? section.component) ===
    editedComponent.componentId
  );
}

function componentBatchFromEvent(
  event: ProgressEventRead,
): ComponentEditBatch | null {
  if (event.event_type !== "generation.website_components_edited") {
    return null;
  }
  const batchPayload = asRecord(event.payload);
  const manifest = asRecord(pick(batchPayload, "manifest"));
  const components = asArray(pick(batchPayload, "components"))
    .map(asRecord)
    .map((componentEntry, index) => ({
      componentId:
        asString(pick(componentEntry, "component_id")) ??
        `component_${index + 1}`,
      label:
        asString(pick(componentEntry, "label")) ?? `Component ${index + 1}`,
      sectionId:
        asString(pick(componentEntry, "section_id")) ?? `section_${index + 1}`,
    }));
  if (!Object.keys(manifest).length || components.length === 0) {
    return null;
  }
  return {
    batchId:
      asString(pick(batchPayload, "batch_id")) ?? event.id ?? event.created_at ?? "",
    components,
    manifest: manifest as PublicSiteManifest,
    refreshIntervalMs:
      asNumber(pick(batchPayload, "refresh_interval_ms")) ?? 2000,
  };
}

function isBatch(
  value: ComponentEditBatch | null,
): value is ComponentEditBatch {
  return value !== null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
