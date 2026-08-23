import type {
  JsonObject,
  PublicSiteManifest,
  PublicSitePage,
} from "@placis/website-components";

export type BlueprintEntry = {
  blueprint: JsonObject;
  defaultValues: JsonObject | null;
  id: string;
  name: string;
  pageType: string;
  relativeDir: string;
  slug: string;
};

export type DevBlueprintPage = {
  path: string;
  title: string;
};

export type DevBlueprintFixtureSummary = {
  id: string;
  businessName: string;
  geography: string;
  trade: string;
};

export type DevBlueprintThemeSummary = {
  id: string;
  label: string;
};

export type DevBlueprintSummary = {
  id: string;
  name: string;
  pageType: string;
  pages: DevBlueprintPage[];
  relativeDir: string;
  sectionIds: string[];
  theme: string;
};

export type DevBlueprintFixture = {
  facts: JsonObject;
  summary: DevBlueprintFixtureSummary;
};

export type DevBlueprintMatch = {
  entry: BlueprintEntry;
  fixture: DevBlueprintFixtureSummary | null;
  manifest: PublicSiteManifest;
  page: PublicSitePage | null;
  requestedPath: string;
  summary: DevBlueprintSummary;
};
