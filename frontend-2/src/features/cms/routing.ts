import type { CmsView } from "./types";

const cmsViewPaths = {
  dashboard: "/cms",
  website_editor: "/cms/website",
  details: "/cms/details",
  proof: "/cms/proof",
  projects: "/cms/projects",
} as const satisfies Record<CmsView, string>;

type CmsViewPath = (typeof cmsViewPaths)[CmsView];

function cmsPathForView(view: CmsView): CmsViewPath {
  return cmsViewPaths[view];
}

function cmsViewForPath(pathname: string): CmsView {
  const normalized = pathname.replace(/\/+$/, "") || "/cms";
  const match = (Object.keys(cmsViewPaths) as CmsView[])
    .map((view) => ({ view, path: cmsViewPaths[view] }))
    .filter(({ path }) => path === "/cms" || normalized.startsWith(`${path}/`) || normalized === path)
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.view ?? "dashboard";
}

export { cmsPathForView, cmsViewForPath };
