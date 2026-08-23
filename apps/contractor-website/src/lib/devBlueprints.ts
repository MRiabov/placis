import type { JsonObject } from "@placis/website-components";
import { parse as parseYaml } from "yaml";

import { publicationFactsFromEvalFixture } from "./devBlueprints/facts";
import {
  isJsonObject,
  normalizePath,
  stringValue,
  textFromValue,
} from "./devBlueprints/json";
import {
  blueprintPages,
  manifestForBlueprint,
  nativeTheme,
  sectionList,
} from "./devBlueprints/manifest";
import type {
  BlueprintEntry,
  DevBlueprintFixture,
  DevBlueprintFixtureSummary,
  DevBlueprintMatch,
  DevBlueprintSummary,
  DevBlueprintThemeSummary,
} from "./devBlueprints/types";

export type {
  DevBlueprintFixtureSummary,
  DevBlueprintMatch,
  DevBlueprintSummary,
  DevBlueprintThemeSummary,
} from "./devBlueprints/types";

type BlueprintModule = { default: JsonObject };
type RawModule = { default: string };

const blueprintModules = import.meta.glob<BlueprintModule>(
  "../../../../packages/website-components/src/blueprints/*/*/blueprint.json",
  { eager: true },
);
const defaultValueModules = import.meta.glob<BlueprintModule>(
  "../../../../packages/website-components/src/blueprints/*/*/default_slot_values.json",
  { eager: true },
);
const contractModules = import.meta.glob<BlueprintModule>(
  "../../../../packages/website-components/src/registry/**/contract.json",
  { eager: true },
);
const evalFixtureModules = import.meta.glob<RawModule>(
  "../../../../tests/fixtures/evals/websites/*.yaml",
  { eager: true, query: "?raw" },
);

const componentDefaults = loadComponentDefaults();
const entries = loadBlueprintEntries();
const fixtures = loadEvalFixtures();
const themes = loadThemeSummaries();

export function listDevBlueprints(): DevBlueprintSummary[] {
  return entries.map((entry) => summarizeBlueprint(entry));
}

export function listDevBlueprintFixtures(): DevBlueprintFixtureSummary[] {
  return fixtures.map((fixture) => fixture.summary);
}

export function listDevBlueprintThemes(): DevBlueprintThemeSummary[] {
  return themes;
}

export function findDevBlueprint(
  segments: string[],
  themeOverride?: string | null,
  fixtureId?: string | null,
): DevBlueprintMatch | null {
  if (segments.length === 0) {
    return null;
  }

  let entry = entries.find(
    (item) => item.id === decodeURIComponent(segments[0] ?? ""),
  );
  let consumed = 1;
  if (!entry && segments.length >= 2) {
    const relativeDir = `${decodeURIComponent(segments[0] ?? "")}/${decodeURIComponent(segments[1] ?? "")}`;
    entry = entries.find((item) => item.relativeDir === relativeDir);
    consumed = 2;
  }
  if (!entry) {
    return null;
  }

  const requestedPath = normalizePath(segments.slice(consumed).join("/"));
  const fixture = fixtureId
    ? (fixtures.find((candidate) => candidate.summary.id === fixtureId) ?? null)
    : null;
  const manifest = manifestForBlueprint(
    entry,
    componentDefaults,
    themeOverride,
    fixture,
  );
  const page =
    manifest.pages?.find(
      (candidate) => normalizePath(candidate.path) === requestedPath,
    ) ?? null;
  return {
    entry,
    fixture: fixture?.summary ?? null,
    manifest,
    page,
    requestedPath,
    summary: summarizeBlueprint(entry),
  };
}

export function devBlueprintPath(
  summary: DevBlueprintSummary,
  pagePath = "/",
  fixtureId?: string | null,
  themeId?: string | null,
): string {
  const suffix = normalizePath(pagePath);
  const base = `/dev-blueprints/${encodeURIComponent(summary.id)}`;
  const path = suffix === "/" ? `${base}/` : `${base}${suffix}`;
  const search = new URLSearchParams();
  if (fixtureId) {
    search.set("fixture", fixtureId);
  }
  if (themeId) {
    search.set("theme", themeId);
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

function loadBlueprintEntries(): BlueprintEntry[] {
  return Object.entries(blueprintModules)
    .map<BlueprintEntry | null>(([path, module]) => {
      const match = path.match(
        /blueprints\/([^/]+)\/([^/]+)\/blueprint\.json$/,
      );
      if (!match) {
        return null;
      }
      const [, pageType = "", slug = ""] = match;
      const relativeDir = `${pageType}/${slug}`;
      const blueprint = module.default;
      const id = stringValue(blueprint.id, relativeDir);
      return {
        blueprint,
        defaultValues:
          defaultValueModules[
            path.replace(/blueprint\.json$/, "default_slot_values.json")
          ]?.default ?? null,
        id,
        name: stringValue(blueprint.name, id),
        pageType,
        relativeDir,
        slug,
      };
    })
    .filter((entry): entry is BlueprintEntry => entry !== null)
    .sort((a, b) => a.relativeDir.localeCompare(b.relativeDir));
}

function loadComponentDefaults(): Map<string, JsonObject[]> {
  const defaultsByComponent = new Map<string, JsonObject[]>();
  for (const module of Object.values(contractModules)) {
    const contract = module.default;
    const id = typeof contract.id === "string" ? contract.id : null;
    const defaults = Array.isArray(contract.default_values)
      ? contract.default_values.filter(isJsonObject)
      : [];
    if (!id || defaults.length === 0) {
      continue;
    }
    defaultsByComponent.set(id, defaults);
    if (Array.isArray(contract.aliases)) {
      for (const alias of contract.aliases) {
        if (typeof alias === "string") {
          defaultsByComponent.set(alias, defaults);
        }
      }
    }
  }
  return defaultsByComponent;
}

function summarizeBlueprint(entry: BlueprintEntry): DevBlueprintSummary {
  const pages = blueprintPages(entry.blueprint).map((page) => ({
    path: normalizePath(stringValue(page.path, "/")),
    title: stringValue(page.title, entry.name),
  }));
  const sectionIds = [
    ...new Set(
      blueprintPages(entry.blueprint).flatMap((page) =>
        sectionList(page.sections).map((section) =>
          stringValue(section.component_id ?? section.component, "unknown"),
        ),
      ),
    ),
  ].sort();
  return {
    id: entry.id,
    name: entry.name,
    pageType: entry.pageType,
    pages,
    relativeDir: entry.relativeDir,
    sectionIds,
    theme: nativeTheme(entry.blueprint),
  };
}

function loadThemeSummaries(): DevBlueprintThemeSummary[] {
  const labels: Record<string, string> = {
    dark_serif: "Dark Serif",
    green_gold: "Green Gold",
    institutional_mono: "Institutional Mono",
    navy_cream: "Navy Cream",
    navy_grid: "Navy Grid",
    red_charcoal: "Red Charcoal",
    timbermill_classic: "Timbermill",
  };
  return [
    ...new Set([
      ...Object.keys(labels),
      ...entries.map((entry) => nativeTheme(entry.blueprint)),
    ]),
  ]
    .sort((a, b) => (labels[a] ?? a).localeCompare(labels[b] ?? b))
    .map((id) => ({
      id,
      label: labels[id] ?? id.replace(/_/g, " "),
    }));
}

function loadEvalFixtures(): DevBlueprintFixture[] {
  return Object.entries(evalFixtureModules)
    .map<DevBlueprintFixture | null>(([, module]) => {
      const parsed = parseYaml(module.default);
      if (!isJsonObject(parsed)) {
        return null;
      }
      const fixture = parsed;
      const facts = publicationFactsFromEvalFixture(fixture);
      return {
        facts,
        summary: {
          id: stringValue(fixture.id, "unknown_fixture"),
          businessName: stringValue(
            facts.business_name,
            stringValue(fixture.id, "Fixture"),
          ),
          geography:
            textFromValue(fixture.geography) ||
            textFromValue(facts.service_area),
          trade: stringValue(
            facts.trade,
            stringValue(fixture.trade, "contractor"),
          ),
        },
      };
    })
    .filter((fixture): fixture is DevBlueprintFixture => fixture !== null)
    .sort((a, b) => a.summary.id.localeCompare(b.summary.id));
}
