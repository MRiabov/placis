import type { JsonObject } from "@placis/website-components";

export function valueAtPath(target: JsonObject, dottedPath: string): unknown {
  let current: unknown = target;
  for (const part of dottedPath.split(".")) {
    if (!isJsonObject(current) || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

export function setValueAtPath(
  target: JsonObject,
  dottedPath: string,
  value: unknown,
) {
  const parts = dottedPath.split(".");
  let current = target;
  for (const part of parts.slice(0, -1)) {
    if (!isJsonObject(current[part])) {
      current[part] = {};
    }
    current = current[part] as JsonObject;
  }
  const key = parts.at(-1);
  if (key) {
    current[key] = clone(value);
  }
}

export function normalizePath(value: string | undefined): string {
  const stripped = (value || "/").replace(/^\/+|\/+$/g, "");
  return stripped ? `/${stripped}` : "/";
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function hasMeaningfulValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (isJsonObject(value)) {
    return Object.keys(value).length > 0;
  }
  return true;
}

export function jsonObject(value: unknown): JsonObject {
  return isJsonObject(value) ? value : {};
}

export function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value ? value : fallback;
}

export function textFromValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => textFromValue(item))
      .filter(Boolean)
      .join(", ");
  }
  if (isJsonObject(value)) {
    return (
      textFromValue(value.label) ||
      textFromValue(value.name) ||
      textFromValue(value.title) ||
      imageUrlFromRecord(value)
    );
  }
  return "";
}

export function textItems(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => textFromValue(item)).filter(Boolean);
  }
  const text = textFromValue(value);
  return text ? [text] : [];
}

export function profileServices(profile: JsonObject): string[] {
  return arrayValue(profile.services)
    .map((service) => textFromValue(service))
    .filter(Boolean);
}

export function imageUrlFromRecord(value: unknown): string {
  if (typeof value === "string") {
    return /^(https?:\/\/|\/|data:image\/)/.test(value) ? value : "";
  }
  if (!isJsonObject(value)) {
    return "";
  }
  return (
    textFromValue(value.url) ||
    textFromValue(value.image_url) ||
    textFromValue(value.generated_image_url) ||
    textFromValue(value.src)
  );
}

export function directImageForVariable(
  profile: JsonObject,
  imageName: string,
): string {
  const images = jsonObject(profile.images);
  const direct = imageUrlFromRecord(images[imageName]);
  if (direct) {
    return direct;
  }
  const imageSlug = slugText(imageName);
  for (const [key, value] of Object.entries(images)) {
    if (slugText(key) === imageSlug) {
      return imageUrlFromRecord(value);
    }
  }
  return "";
}

export function stringReplacement(value: unknown): string {
  if (!hasMeaningfulValue(value)) {
    return "";
  }
  const imageUrl = imageUrlFromRecord(value);
  if (imageUrl) {
    return imageUrl;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => stringReplacement(item))
      .filter(Boolean)
      .join(", ");
  }
  if (isJsonObject(value)) {
    return textFromValue(value);
  }
  return String(value);
}

export function titleCase(value: string): string {
  return value.replace(
    /\w\S*/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1),
  );
}

export function slugText(value: unknown): string {
  return (
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "static_eval"
  );
}
