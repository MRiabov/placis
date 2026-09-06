import type {
  WebsiteManifest,
  WebsitePage,
  WebsiteSection,
} from "./types";

function sectionsFrom(value: unknown): WebsiteSection[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is WebsiteSection =>
          item !== null && typeof item === "object",
      )
    : [];
}

export function pageSections(
  page: WebsitePage | WebsiteManifest | null | undefined,
): WebsiteSection[] {
  if (!page) {
    return [];
  }
  return [...sectionsFrom(page.sections), ...sectionsFrom(page.components)];
}

export function resolveManifestPage(
  manifest: WebsiteManifest,
  requestedPath = "/",
): WebsitePage | null {
  const normalizePath = (path: string | undefined): string => {
    const stripped = (path || "/").replace(/^\/+|\/+$/g, "");
    return stripped ? `/${stripped}` : "/";
  };
  const normalizedPath = normalizePath(requestedPath);
  const pages = Array.isArray(manifest.pages) ? manifest.pages : [];
  const page = pages.find(
    (candidate) => normalizePath(candidate.path) === normalizedPath,
  );
  if (page) {
    return page;
  }
  if (pageSections(manifest).length > 0) {
    return {
      path: normalizedPath,
      title: manifest.title,
      seo: manifest.seo,
      sections: manifest.sections,
      components: manifest.components,
    };
  }
  return pages[0] ?? null;
}

export function pageTitle(
  manifest: WebsiteManifest,
  page: WebsitePage | null,
): string {
  return page?.title ?? manifest.title ?? "Contractor website";
}

export function pageDescription(
  manifest: WebsiteManifest,
  page: WebsitePage | null,
): string {
  const pageDescription = page?.seo?.description;
  const manifestDescription = manifest.seo?.description;
  return typeof pageDescription === "string"
    ? pageDescription
    : typeof manifestDescription === "string"
      ? manifestDescription
      : "";
}
