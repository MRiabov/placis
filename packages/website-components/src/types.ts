import type { ComponentType, CSSProperties, ReactNode } from "react";

export type JsonObject = Record<string, unknown>;

export type PublicSiteTheme = {
  preset?: string;
  primary?: string;
  neutral?: string;
  accent?: string;
  background?: string;
  text?: string;
  muted?: string;
  border?: string;
  radius?: string;
  density?: "compact" | "comfortable" | "spacious";
};

export type PublicSiteSection = {
  component?: string;
  component_id?: string;
  schema_version?: number;
  contract_version?: string;
  props?: JsonObject;
};

export type PublicSitePage = {
  path?: string;
  title?: string;
  seo?: JsonObject;
  components?: PublicSiteSection[];
  sections?: PublicSiteSection[];
};

export type PublicSiteManifest = {
  manifest_version?: string;
  title?: string;
  theme?: PublicSiteTheme | string;
  seo?: JsonObject;
  collections?: Record<string, JsonObject>;
  components?: PublicSiteSection[];
  sections?: PublicSiteSection[];
  pages?: PublicSitePage[];
};

export type PublicSiteRenderContext = {
  mode?: "published" | "preview";
  path?: string;
  tenantSlug?: string;
  formSubmitBasePath?: string;
};

export type PublicSiteComponentProps<Props extends JsonObject = JsonObject> = {
  props: Props;
  section: PublicSiteSection;
  theme: PublicSiteTheme;
  context: PublicSiteRenderContext;
};

export type PublicSiteComponent = ComponentType<PublicSiteComponentProps>;

export type PublicSiteComponentDefinition = {
  id: string;
  aliases?: string[];
  family: string;
  variant: string;
  load: () => Promise<{ default: PublicSiteComponent }>;
};

export type LoadedPublicSiteComponent = Omit<
  PublicSiteComponentDefinition,
  "load"
> & {
  Component: PublicSiteComponent;
};

export type PublicSiteRendererProps = {
  children?: ReactNode;
  className?: string;
  context?: PublicSiteRenderContext;
  loadedComponents?: LoadedPublicSiteComponent[];
  manifest: PublicSiteManifest;
  page?: PublicSitePage | null;
  registry?: PublicSiteComponentDefinition[];
};

export type ThemeStyle = CSSProperties & Record<`--${string}`, string>;
