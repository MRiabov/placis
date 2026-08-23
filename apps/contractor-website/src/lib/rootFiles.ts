import type { PublicSiteManifest } from "@placis/website-components";

type JsonRecord = Record<string, unknown>;

export function robotsTxt(host: string): string {
  const normalizedHost = host.trim().toLowerCase().replace(/\.$/, "");
  return `User-agent: *\nAllow: /\nSitemap: https://${normalizedHost}/sitemap.xml\n`;
}

export function faviconSvg(manifest: PublicSiteManifest): string {
  const logoUrl = manifestLogoUrl(manifest);
  const title = siteTitle(manifest);
  if (logoUrl) {
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
      `<title>${escapeXml(title)}</title>`,
      '<rect width="64" height="64" rx="14" fill="#ffffff"/>',
      `<image href="${escapeXmlAttribute(logoUrl)}" x="6" y="6" `,
      'width="52" height="52" preserveAspectRatio="xMidYMid meet"/>',
      "</svg>",
    ].join("");
  }
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    `<title>${escapeXml(title)}</title>`,
    '<rect width="64" height="64" rx="14" fill="#111827"/>',
    '<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" ',
    'font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#ffffff">',
    escapeXml(siteInitials(title)),
    "</text>",
    "</svg>",
  ].join("");
}

function manifestLogoUrl(manifest: PublicSiteManifest): string | null {
  for (const section of manifestSections(manifest)) {
    const props = asRecord(section.props);
    if (!props) {
      continue;
    }
    for (const key of ["logo", "logo_url", "logoUrl"]) {
      const logoUrl = imageUrlFromValue(props[key]);
      if (logoUrl) {
        return logoUrl;
      }
    }
  }
  const branding = asRecord((manifest as JsonRecord).branding);
  if (branding) {
    for (const key of ["logo", "logo_url", "logoUrl"]) {
      const logoUrl = imageUrlFromValue(branding[key]);
      if (logoUrl) {
        return logoUrl;
      }
    }
  }
  return null;
}

function manifestSections(manifest: PublicSiteManifest): JsonRecord[] {
  const sections: JsonRecord[] = [];
  for (const page of Array.isArray(manifest.pages) ? manifest.pages : []) {
    sections.push(
      ...recordsFrom(page.sections),
      ...recordsFrom(page.components),
    );
  }
  sections.push(
    ...recordsFrom(manifest.sections),
    ...recordsFrom(manifest.components),
  );
  return sections;
}

function recordsFrom(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function imageUrlFromValue(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return isSafeFaviconImageUrl(trimmed) ? trimmed : null;
  }
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  for (const key of ["url", "image_url", "logo_url", "src"]) {
    const rawUrl = record[key];
    if (typeof rawUrl === "string") {
      const trimmed = rawUrl.trim();
      if (isSafeFaviconImageUrl(trimmed)) {
        return trimmed;
      }
    }
  }
  return null;
}

function isSafeFaviconImageUrl(value: string): boolean {
  return (
    value.startsWith("/") ||
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("data:image/")
  );
}

function siteTitle(manifest: PublicSiteManifest): string {
  if (typeof manifest.title === "string" && manifest.title.trim()) {
    return manifest.title.trim();
  }
  const pages = Array.isArray(manifest.pages) ? manifest.pages : [];
  for (const page of pages) {
    if (typeof page.title === "string" && page.title.trim()) {
      return page.title.trim();
    }
  }
  return "Contractor website";
}

function siteInitials(title: string): string {
  const words = title.replaceAll("&", " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "P";
  }
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function asRecord(value: unknown): JsonRecord | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXmlAttribute(value: string): string {
  return escapeXml(value).replaceAll('"', "&quot;");
}
