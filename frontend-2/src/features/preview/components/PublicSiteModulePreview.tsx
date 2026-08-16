import {
  loadPublicSiteComponents,
  pageSections,
  PublicSiteRenderer,
  resolveManifestPage,
  type LoadedPublicSiteComponent,
  type PublicSiteManifest,
  type PublicSiteSection,
} from "@placis/public-site-components";
import { useEffect, useMemo, useState, type ReactNode } from "react";

interface PublicSiteModulePreviewProps {
  manifest: PublicSiteManifest;
  route: string;
}

interface LoadedPreview {
  sections: PublicSiteSection[];
  components: LoadedPublicSiteComponent[];
}

export function PublicSiteModulePreview({
  manifest,
  route,
}: PublicSiteModulePreviewProps): ReactNode {
  const page = useMemo(
    () => resolveManifestPage(manifest, route),
    [manifest, route],
  );
  const sections = useMemo(() => pageSections(page), [page]);
  const [loaded, setLoaded] = useState<LoadedPreview | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadPublicSiteComponents(sections).then((components) => {
      if (!cancelled) {
        setLoaded({ sections, components });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sections]);

  if (!page) {
    return (
      <div className="grid min-h-[320px] place-items-center bg-white text-sm text-zinc-500">
        No public website page found in this preview.
      </div>
    );
  }

  if (loaded === null || loaded.sections !== sections) {
    return (
      <div className="grid min-h-[320px] place-items-center bg-white text-sm text-zinc-500">
        Loading website preview...
      </div>
    );
  }

  return (
    <PublicSiteRenderer
      context={{ mode: "preview", path: route }}
      loadedComponents={loaded.components}
      manifest={manifest}
      page={page}
    />
  );
}
