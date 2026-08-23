import type {
  JsonObject,
  PublicSiteManifest,
  PublicSitePage,
  PublicSiteSection,
} from "@placis/website-components";

import {
  arrayValue,
  clone,
  hasMeaningfulValue,
  imageUrlFromRecord,
  isJsonObject,
  jsonObject,
  normalizePath,
  setValueAtPath,
  stringReplacement,
  stringValue,
  valueAtPath,
} from "./json";
import type { BlueprintEntry, DevBlueprintFixture } from "./types";

export function manifestForBlueprint(
  entry: BlueprintEntry,
  componentDefaults: Map<string, JsonObject[]>,
  themeOverride?: string | null,
  fixture?: DevBlueprintFixture | null,
): PublicSiteManifest {
  const pages = blueprintPages(entry.blueprint).map((page) =>
    manifestPageForBlueprint(entry, componentDefaults, page),
  );
  const manifest: PublicSiteManifest = {
    manifest_version: "public_site_manifest.v1",
    title: stringValue(entry.blueprint.name, entry.name),
    theme: themeOverride || nativeTheme(entry.blueprint),
    seo: jsonObject(entry.blueprint.seo),
    pages,
    collections: {
      blueprint: {
        id: entry.id,
        name: entry.name,
        relative_dir: entry.relativeDir,
      },
      forms: { items: arrayValue(entry.blueprint.forms) },
      navigation: { items: arrayValue(entry.blueprint.navigation) },
    },
  };
  const fallbackFacts = defaultVariableFacts(
    entry.defaultValues,
    fixture?.facts ?? {},
  );
  if (!fixture) {
    return materializeKnownPublicationVariables(manifest, fallbackFacts);
  }
  return materializePublicationVariables(
    manifest,
    mergeJsonObjects(fallbackFacts, fixture.facts),
  );
}

export function nativeTheme(blueprint: JsonObject): string {
  if (typeof blueprint.theme === "string") {
    return blueprint.theme;
  }
  const theme = jsonObject(blueprint.theme);
  return stringValue(theme.preset, "emerald");
}

export function blueprintPages(blueprint: JsonObject): JsonObject[] {
  return arrayValue(blueprint.pages).filter(isJsonObject);
}

export function sectionList(value: unknown): PublicSiteSection[] {
  return arrayValue(value).filter(isJsonObject) as PublicSiteSection[];
}

function manifestPageForBlueprint(
  entry: BlueprintEntry,
  componentDefaults: Map<string, JsonObject[]>,
  page: JsonObject,
): PublicSitePage {
  const sections = clone(sectionList(page.sections));
  applyComponentDefaults(sections, componentDefaults);
  applyDefaultValues(sections, entry.defaultValues);
  return {
    path: normalizePath(stringValue(page.path, "/")),
    title: stringValue(page.title, entry.name),
    seo: jsonObject(page.seo),
    sections,
  };
}

function materializePublicationVariables<T>(value: T, facts: JsonObject): T {
  if (typeof value === "string") {
    const exact = value.match(/^{{\s*([^{}]+?)\s*}}$/);
    if (exact) {
      const resolved = valueAtPath(facts, exact[1] ?? "");
      return (hasMeaningfulValue(resolved) ? clone(resolved) : "") as T;
    }
    return value.replace(/{{\s*([^{}]+?)\s*}}/g, (_match, key: string) =>
      stringReplacement(valueAtPath(facts, key)),
    ) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      materializePublicationVariables(item, facts),
    ) as T;
  }
  if (isJsonObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        materializePublicationVariables(item, facts),
      ]),
    ) as T;
  }
  return value;
}

function materializeKnownPublicationVariables<T>(
  value: T,
  facts: JsonObject,
): T {
  if (typeof value === "string") {
    const exact = value.match(/^{{\s*([^{}]+?)\s*}}$/);
    if (exact) {
      const resolved = valueAtPath(facts, exact[1] ?? "");
      return (hasMeaningfulValue(resolved) ? clone(resolved) : value) as T;
    }
    return value.replace(/{{\s*([^{}]+?)\s*}}/g, (match, key: string) => {
      const resolved = valueAtPath(facts, key);
      return hasMeaningfulValue(resolved) ? stringReplacement(resolved) : match;
    }) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      materializeKnownPublicationVariables(item, facts),
    ) as T;
  }
  if (isJsonObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        materializeKnownPublicationVariables(item, facts),
      ]),
    ) as T;
  }
  return value;
}

function applyComponentDefaults(
  sections: PublicSiteSection[],
  componentDefaults: Map<string, JsonObject[]>,
) {
  for (const section of sections) {
    const sectionId = stringValue(
      section.component_id ?? section.component,
      "",
    );
    if (!sectionId) {
      continue;
    }
    section.props = jsonObject(section.props);
    for (const defaultValue of componentDefaults.get(sectionId) ?? []) {
      const path = stringValue(defaultValue.path, "");
      if (!path || hasMeaningfulValue(valueAtPath(section.props, path))) {
        continue;
      }
      setValueAtPath(section.props, path, defaultValue.value);
    }
  }
}

function applyDefaultValues(
  sections: PublicSiteSection[],
  defaultValues: JsonObject | null,
) {
  const values = arrayValue(defaultValues?.values).filter(isJsonObject);
  if (values.length === 0) {
    return;
  }
  for (const section of sections) {
    const sectionId = stringValue(
      section.component_id ?? section.component,
      "",
    );
    if (!sectionId) {
      continue;
    }
    section.props = jsonObject(section.props);
    for (const defaultValue of values) {
      if (defaultValue.component_id !== sectionId) {
        continue;
      }
      const path = stringValue(defaultValue.path, "");
      if (!path || hasMeaningfulValue(valueAtPath(section.props, path))) {
        continue;
      }
      setValueAtPath(
        section.props,
        path,
        defaultValueForTemplate(defaultValue),
      );
    }
  }
}

function defaultValueForTemplate(defaultValue: JsonObject): unknown {
  const metadata = jsonObject(defaultValue.metadata);
  const fallback = metadata.fallback_value;
  if (
    metadata.selection_strategy === "research_rerank" &&
    hasMeaningfulValue(fallback)
  ) {
    return fallback;
  }
  return defaultValue.value;
}

function defaultVariableFacts(
  defaultValues: JsonObject | null,
  fixtureFacts: JsonObject,
): JsonObject {
  const variables = jsonObject(defaultValues?.variables);
  const imagePool = fixtureImagePool(fixtureFacts);
  let imageIndex = 0;
  const facts: JsonObject = {};
  for (const [path, rawVariable] of Object.entries(variables)) {
    const variable = jsonObject(rawVariable);
    if (variable.type !== "image") {
      continue;
    }
    const source = stringValue(variable.source, "");
    if (!source) {
      continue;
    }
    const value =
      shouldUseFixtureImage(path) && imagePool.length > 0
        ? imagePool[imageIndex++ % imagePool.length]
        : source;
    setValueAtPath(facts, path, value);
  }
  return facts;
}

function shouldUseFixtureImage(path: string): boolean {
  if (!path.startsWith("images.")) {
    return false;
  }
  return !/(^|[_.-])(badge|logo|motif|pattern|shape|icon)([_.-]|$)/i.test(path);
}

function fixtureImagePool(fixtureFacts: JsonObject): string[] {
  const urls = new Set<string>();
  const add = (value: unknown, key = "") => {
    if (isLogoLikeImage(value, key)) {
      return;
    }
    const url = imageUrlFromRecord(value) || directImageValue(value);
    if (url && !url.startsWith("data:image/svg")) {
      urls.add(url);
    }
  };

  for (const [key, value] of Object.entries(jsonObject(fixtureFacts.images))) {
    add(value, key);
  }

  const projects = jsonObject(fixtureFacts.projects);
  for (const key of ["featured", "recent", "home_gallery", "projects_page"]) {
    for (const project of arrayValue(projects[key])) {
      add(project);
    }
  }

  return Array.from(urls);
}

function isLogoLikeImage(value: unknown, key: string): boolean {
  if (/logo/i.test(key)) {
    return true;
  }
  const record = jsonObject(value);
  return /logo/i.test(
    `${stringValue(record.canonical_name, "")} ${stringValue(record.asset_type, "")}`,
  );
}

function directImageValue(value: unknown): string {
  if (!isJsonObject(value)) {
    return "";
  }
  return stringValue(value.image, "");
}

function mergeJsonObjects(base: JsonObject, override: JsonObject): JsonObject {
  const merged = clone(base);
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) {
      continue;
    }
    const existing = merged[key];
    merged[key] =
      isJsonObject(existing) && isJsonObject(value)
        ? mergeJsonObjects(existing, value)
        : clone(value);
  }
  return merged;
}
