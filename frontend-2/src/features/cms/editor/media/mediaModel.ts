import type { DragEvent } from "react";

import type { CmsMediaAsset } from "../../api/cms";

/** Custom MIME type used for dragging CMS assets onto the canvas preview. */
export const mediaDragType = "application/placis-cms-media-asset";

export function mediaAssetFromTransfer(
  dataTransfer: DataTransfer,
): CmsMediaAsset | null {
  try {
    const raw = dataTransfer.getData(mediaDragType);
    const parsed = JSON.parse(raw) as Partial<CmsMediaAsset>;
    if (typeof parsed.id !== "string" || !parsed.id) {
      return null;
    }
    return parsed as CmsMediaAsset;
  } catch {
    return null;
  }
}

export function hasImageFileDrag(event: DragEvent<HTMLElement>): boolean {
  const entries = Array.from(event.dataTransfer.items ?? []);
  if (
    entries.some(
      (entry) => entry.kind === "file" && entry.type.startsWith("image/"),
    )
  ) {
    return true;
  }
  return Array.from(event.dataTransfer.files ?? []).some((file) =>
    file.type.startsWith("image/"),
  );
}

export function hasMediaAssetDrag(event: DragEvent<HTMLElement>): boolean {
  return (
    event.dataTransfer.types.includes(mediaDragType) ||
    Boolean(mediaAssetFromTransfer(event.dataTransfer))
  );
}

function assetLabelFromUrl(url: string): string {
  const cleanUrl = url.split("?")[0] ?? "";
  const filename = cleanUrl.split("/").filter(Boolean).at(-1) || "Image";
  return (
    filename
      .replace(/\.[a-z0-9]+$/i, "")
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map(titleCaseWord)
      .join(" ") || "Image"
  );
}

function titleCaseWord(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function assetLabel(asset: CmsMediaAsset): string {
  return (
    asset.alt_text ||
    assetLabelFromUrl(assetPreviewUrl(asset)) ||
    asset.id
  );
}

export function assetPreviewUrl(asset: CmsMediaAsset): string {
  const metadataPreviewUrl = asset.metadata?.preview_url;
  return (
    asset.preview_url ||
    asset.source_url ||
    (typeof metadataPreviewUrl === "string" ? metadataPreviewUrl : "") ||
    ""
  );
}

export function previewFixtureUrl(value: string): string {
  if (!value.startsWith("/fixtures/")) {
    return value;
  }
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${basePath}${value}`;
}

export function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function clampPercent(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 50;
  }
  return Math.max(0, Math.min(100, parsed));
}
