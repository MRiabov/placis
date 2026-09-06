import type { ComponentType, CSSProperties, ReactNode } from "react";

export type JsonObject = Record<string, unknown>;

export type WebsiteTheme = {
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

export type WebsiteSection = {
  component?: string;
  component_id?: string;
  schema_version?: number;
  contract_version?: string;
  props?: JsonObject;
};

export type WebsitePage = {
  path?: string;
  title?: string;
  seo?: JsonObject;
  components?: WebsiteSection[];
  sections?: WebsiteSection[];
};

export type WebsiteManifest = {
  manifest_version?: string;
  title?: string;
  theme?: WebsiteTheme | string;
  seo?: JsonObject;
  collections?: Record<string, JsonObject>;
  components?: WebsiteSection[];
  sections?: WebsiteSection[];
  pages?: WebsitePage[];
};

export type WebsiteRenderContext = {
  mode?: "published" | "preview";
  path?: string;
  websitePrefix?: string;
  formSubmitBasePath?: string;
};

export type WebsiteComponentProps<Props extends JsonObject = JsonObject> = {
  props: Props;
  section: WebsiteSection;
  theme: WebsiteTheme;
  context: WebsiteRenderContext;
};

export type WebsiteComponent = ComponentType<WebsiteComponentProps>;

export type WebsiteComponentDefinition = {
  id: string;
  family: string;
  variant: string;
  load: () => Promise<{ default: WebsiteComponent }>;
};

export type LoadedWebsiteComponent = Omit<
  WebsiteComponentDefinition,
  "load"
> & {
  Component: WebsiteComponent;
};

export type WebsiteRendererProps = {
  children?: ReactNode;
  className?: string;
  context?: WebsiteRenderContext;
  loadedComponents?: LoadedWebsiteComponent[];
  manifest: WebsiteManifest;
  page?: WebsitePage | null;
  registry?: WebsiteComponentDefinition[];
};

export type ThemeStyle = CSSProperties & Record<`--${string}`, string>;
