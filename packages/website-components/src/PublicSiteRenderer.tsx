import { pageSections, resolveManifestPage } from "./manifest";
import { normalizeTheme, themeClassName, themeStyle } from "./theme";
import type {
  LoadedPublicSiteComponent,
  PublicSiteRendererProps,
} from "./types";
import { componentId } from "./utils";

function findLoadedComponent(
  id: string,
  loadedComponents: LoadedPublicSiteComponent[],
) {
  return loadedComponents.find(
    (definition) => definition.id === id || definition.aliases?.includes(id),
  );
}

export function PublicSiteRenderer({
  children,
  className = "",
  context = {},
  loadedComponents = [],
  manifest,
  page = resolveManifestPage(manifest, context.path ?? "/"),
}: PublicSiteRendererProps) {
  const theme = normalizeTheme(manifest.theme);
  const sections = pageSections(page);
  return (
    <main
      className={`public-site-root min-h-screen ${themeClassName(theme)} ${className}`}
      style={themeStyle(theme)}
    >
      {sections.map((section, index) => {
        const id = componentId(section);
        const loaded = findLoadedComponent(id, loadedComponents);
        if (!loaded) {
          return (
            <section
              className="border-b border-(--public-border) bg-white px-4 py-10 sm:px-6 lg:px-8"
              key={`${id || "unknown"}-${index}`}
            >
              <div className="public-site-shell">
                <p className="text-sm font-semibold text-(--public-muted)">
                  Unsupported public component
                </p>
                <h2 className="mt-2 text-xl font-bold">
                  {id || "Missing component ID"}
                </h2>
              </div>
            </section>
          );
        }
        const Component = loaded.Component;
        return (
          <div
            data-public-component-id={id}
            data-public-component-index={String(index)}
            key={`${id}-${index}`}
            style={{ display: "contents" }}
          >
            <Component
              context={context}
              props={section.props ?? {}}
              section={section}
              theme={theme}
            />
          </div>
        );
      })}
      {children}
    </main>
  );
}
