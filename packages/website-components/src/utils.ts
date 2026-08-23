import type { JsonObject, PublicSiteSection } from "./types";

export function componentId(section: PublicSiteSection): string {
  return section.component_id ?? section.component ?? "";
}

export function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

export function asRecords(value: unknown): JsonObject[] {
  return Array.isArray(value) &&
    value.every((item) => item && typeof item === "object")
    ? (value as JsonObject[])
    : [];
}

export function asStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function imageUrl(value: unknown): string | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as JsonObject;
    return imageUrl(
      record.url ??
        record.image_url ??
        record.generated_image_url ??
        record.src,
    );
  }
  return typeof value === "string" &&
    (value.startsWith("https://") ||
      value.startsWith("http://") ||
      value.startsWith("/") ||
      value.startsWith("data:image/"))
    ? normalizeImageUrl(value)
    : null;
}

function normalizeImageUrl(value: string): string {
  if (
    !value.includes("images.squarespace-cdn.com/content/") ||
    value.includes("?format=") ||
    value.includes("&format=")
  ) {
    return value;
  }

  const separator = value.includes("?") ? "&" : "?";
  return `${value}${separator}format=1500w`;
}
