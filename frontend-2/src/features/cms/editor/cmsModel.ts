import type { PublicSiteManifest, PublicSiteSection } from "@placis/public-site-components";

import { currentOrigin } from "@/shared/lib/navigation";
import type { CmsPageProjection, CmsPageSummary, CmsSection, CmsSlot } from "../api/cms";
import { sectionSlots } from "./inspector/inspectorModel";

/** Renders the manifest page set (ported from the old previewUtils/preview helpers). */
export function publicManifestFromDraft(
  draft: CmsPageProjection,
): PublicSiteManifest {
  return {
    manifest_version: "site_page.v1",
    title: draft.page.title || draft.tenant.name,
    pages: [
      {
        path: draft.page.path,
        title: draft.page.title || draft.tenant.name,
        sections: draftSections(draft)
          .filter((section) => section.visible)
          .map(publicSectionFromCmsSection),
      },
    ],
  };
}

function draftSections(draft: CmsPageProjection): CmsSection[] {
  return draft.sections ?? [];
}

function publicSectionFromCmsSection(section: CmsSection): PublicSiteSection {
  const props = mergeSectionProps(section);
  return {
    component: section.component_id,
    component_id: section.component_id,
    props,
    ...(section.component_version
      ? { contract_version: section.component_version }
      : {}),
    ...(section.component_schema_version != null
      ? { schema_version: section.component_schema_version }
      : {}),
  };
}

function mergeSectionProps(section: CmsSection): Record<string, unknown> {
  const props: Record<string, unknown> = { ...section.props };
  for (const slot of section.slots ?? []) {
    if (slot.value !== undefined && slot.key) {
      props[slot.key] = slot.value;
    }
  }
  return props;
}

export function isUtilityPage(page: CmsPageSummary): boolean {
  const path = page.path.toLowerCase();
  const pageType = page.page_type.toLowerCase();
  return (
    pageType.includes("utility") ||
    path.includes("404") ||
    path.includes("password")
  );
}

export function pageDisplayName(page: CmsPageSummary): string {
  const displayTitle = page.display_title?.trim();
  if (displayTitle) {
    return displayTitle;
  }
  if (page.title.trim()) {
    return page.title;
  }
  if (page.path === "/") {
    return "Home";
  }
  return page.path;
}

/** Media drop target resolution (ported from the old draftMutations helpers). */
export function imageUrlFromDropTarget(
  target: EventTarget | null,
): string | undefined {
  if (!(target instanceof Element)) {
    return undefined;
  }
  const image = target.closest("img");
  if (!(image instanceof HTMLImageElement)) {
    return undefined;
  }
  return (
    image.currentSrc ||
    image.src ||
    image.getAttribute("src") ||
    undefined
  );
}

export function mediaDropSlot(
  section: CmsSection,
  targetImageUrl?: string,
): CmsSlot | null {
  if (targetImageUrl) {
    const matchedSlot = sectionSlots(section).find((slot) =>
      containsMatchingImageUrl(slot.value, targetImageUrl),
    );
    if (matchedSlot) {
      return matchedSlot;
    }
  }
  return sectionSlots(section).find((slot) => slot.type === "image") ?? null;
}

function containsMatchingImageUrl(
  value: unknown,
  targetUrl: string,
): boolean {
  if (typeof value === "string") {
    return imageUrlsMatch(value, targetUrl);
  }
  if (Array.isArray(value)) {
    return value.some((entry) =>
      containsMatchingImageUrl(entry, targetUrl),
    );
  }
  if (!value || typeof value !== "object") {
    return false;
  }
  return Object.values(value as Record<string, unknown>).some((entry) =>
    containsMatchingImageUrl(entry, targetUrl),
  );
}

function imageUrlsMatch(left: string, right: string): boolean {
  const normalizedLeft = normalizeImageUrl(left);
  const normalizedRight = normalizeImageUrl(right);
  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.endsWith(normalizedRight) ||
    normalizedRight.endsWith(normalizedLeft)
  );
}

function normalizeImageUrl(value: string): string {
  try {
    const parsed = new URL(value, currentOrigin());
    return `${parsed.pathname}${parsed.search}`.replace(/^\/cms(?=\/)/, "");
  } catch {
    return value;
  }
}

