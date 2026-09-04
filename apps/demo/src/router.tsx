import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  parseSearchWith,
  redirect,
  stringifySearchWith,
} from "@tanstack/react-router";
import { CmsLayout } from "@/layout/CmsLayout";
import { AdsListPage, AdsPage } from "@/pages/cms/AdsPage";
import { AdsDetail } from "@/pages/cms/ads/AdsDetail";
import { AdsWorkspacePage } from "@/pages/cms/ads/AdsWorkspace";
import { BillingPage } from "@/pages/cms/BillingPage";
import { CertificationsPage } from "@/pages/cms/CertificationsPage";
import { DetailsPage } from "@/pages/cms/DetailsPage";
import { HomePage } from "@/pages/cms/HomePage";
import { LeadsPage } from "@/pages/cms/LeadsPage";
import { MediaPage } from "@/pages/cms/MediaPage";
import { ProjectPage } from "@/pages/cms/ProjectPage";
import { ProjectsPage } from "@/pages/cms/ProjectsPage";
import { WebsitePage } from "@/pages/cms/WebsitePage";
import { FindPage } from "@/pages/onboarding/FindPage";
import { GeneratedPage } from "@/pages/onboarding/GeneratedPage";
import { InterviewPage } from "@/pages/onboarding/InterviewPage";
import { OnboardingLayout } from "@/pages/onboarding/OnboardingLayout";
import { PreviewAndEditPage } from "@/pages/onboarding/PreviewAndEditPage";
import { PreviewPage } from "@/pages/onboarding/PreviewPage";
import { ReviewPage } from "@/pages/onboarding/ReviewPage";

function searchFlag(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

type RawSearch = {
  ad_id?: unknown;
  archived?: unknown;
  archive?: unknown;
  compact?: unknown;
  connected?: unknown;
  dev?: unknown;
  diff?: unknown;
  empty?: unknown;
  picker?: unknown;
  review?: unknown;
  scene?: unknown;
  shot?: unknown;
  source?: unknown;
  status?: unknown;
  view?: unknown;
  website_prefix?: unknown;
};

function demoSearch(search: Record<string, unknown>): {
  dev?: string;
  shot?: string;
} {
  const raw = search as RawSearch;
  const next: { dev?: string; shot?: string } = {};
  const dev = searchFlag(raw.dev);
  const shot = searchFlag(raw.shot);
  if (dev !== undefined) {
    next.dev = dev;
  }
  if (shot !== undefined) {
    next.shot = shot;
  }
  return next;
}

const rootRoute = createRootRoute({
  component: function RootLayout() {
    return (
      <div className="flex h-full flex-col">
        <Outlet />
      </div>
    );
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/cms" });
  },
});

const cmsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cms",
  component: CmsLayout,
  validateSearch: (search: Record<string, unknown>) => demoSearch(search),
});

const cmsIndexRoute = createRoute({
  getParentRoute: () => cmsRoute,
  path: "/",
  component: HomePage,
});

const websiteRoute = createRoute({
  getParentRoute: () => cmsRoute,
  path: "website",
  component: WebsitePage,
});

const detailsRoute = createRoute({
  getParentRoute: () => cmsRoute,
  path: "details",
  component: DetailsPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => cmsRoute,
  path: "projects",
  component: function ProjectsLayout() {
    return <Outlet />;
  },
});

const projectsIndexRoute = createRoute({
  getParentRoute: () => projectsRoute,
  path: "/",
  component: ProjectsPage,
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search as RawSearch;
    return {
      ...demoSearch(search),
      empty: searchFlag(raw.empty),
      archive: searchFlag(raw.archive),
      archived: searchFlag(raw.archived),
    };
  },
});

const projectNewRoute = createRoute({
  getParentRoute: () => projectsRoute,
  path: "new",
  component: function ProjectNewPage() {
    return <ProjectPage projectId={null} />;
  },
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search as RawSearch;
    return {
      ...demoSearch(search),
      picker: searchFlag(raw.picker),
      diff: searchFlag(raw.diff),
    };
  },
});

const projectIdRoute = createRoute({
  getParentRoute: () => projectsRoute,
  path: "$projectId",
  component: function ProjectIdPage() {
    const { projectId } = projectIdRoute.useParams();
    return <ProjectPage projectId={projectId} />;
  },
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search as RawSearch;
    return {
      ...demoSearch(search),
      picker: searchFlag(raw.picker),
      diff: searchFlag(raw.diff),
    };
  },
});

const certificationsRoute = createRoute({
  getParentRoute: () => cmsRoute,
  path: "certifications",
  component: CertificationsPage,
});

const mediaRoute = createRoute({
  getParentRoute: () => cmsRoute,
  path: "media",
  component: MediaPage,
});

const adsRoute = createRoute({
  getParentRoute: () => cmsRoute,
  path: "ads",
  component: AdsPage,
  validateSearch: (search: Record<string, unknown>) => {
    const str = (key: string): string | undefined =>
      typeof search[key] === "string" ? search[key] : undefined;
    return {
      archive: str("archive"),
      archived: str("archived"),
      compact: str("compact"),
      connected: str("connected"),
      dev: str("dev"),
      review: str("review"),
      scene: str("scene"),
      shot: str("shot"),
      view: str("view"),
    };
  },
});

const adsIndexRoute = createRoute({
  getParentRoute: () => adsRoute,
  path: "/",
  component: AdsListPage,
});

const adsNewRoute = createRoute({
  getParentRoute: () => adsRoute,
  path: "new",
  component: AdsWorkspacePage,
});

const adsEditRoute = createRoute({
  getParentRoute: () => adsRoute,
  path: "$adId/edit",
  component: AdsWorkspacePage,
});

const adsDetailRoute = createRoute({
  getParentRoute: () => adsRoute,
  path: "$adId",
  component: AdsDetail,
});

const leadsRoute = createRoute({
  getParentRoute: () => cmsRoute,
  path: "leads",
  component: LeadsPage,
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search as RawSearch;
    return {
      ad_id: searchFlag(raw.ad_id),
      dev: searchFlag(raw.dev),
      empty: searchFlag(raw.empty),
      shot: searchFlag(raw.shot),
      source: searchFlag(raw.source),
      status: searchFlag(raw.status),
      website_prefix: searchFlag(raw.website_prefix),
    };
  },
});

const billingRoute = createRoute({
  getParentRoute: () => cmsRoute,
  path: "billing",
  component: BillingPage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: OnboardingLayout,
});

const onboardingIndexRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/onboarding/find" });
  },
});

const findRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: "find",
  component: FindPage,
});

const reviewRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: "review",
  component: ReviewPage,
});

const interviewRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: "interview",
  component: InterviewPage,
});

const previewRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: "preview",
  component: PreviewPage,
});

const previewAndEditRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: "preview-and-edit",
  component: PreviewAndEditPage,
});

const generatedRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: "generated",
  component: GeneratedPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  cmsRoute.addChildren([
    cmsIndexRoute,
    websiteRoute,
    detailsRoute,
    projectsRoute.addChildren([
      projectsIndexRoute,
      projectNewRoute,
      projectIdRoute,
    ]),
    certificationsRoute,
    mediaRoute,
    leadsRoute,
    adsRoute.addChildren([
      adsIndexRoute,
      adsNewRoute,
      adsEditRoute,
      adsDetailRoute,
    ]),
    billingRoute,
  ]),
  onboardingRoute.addChildren([
    onboardingIndexRoute,
    findRoute,
    reviewRoute,
    interviewRoute,
    previewRoute,
    previewAndEditRoute,
    generatedRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  parseSearch: parseSearchWith((value) => value),
  stringifySearch: stringifySearchWith((value) => String(value)),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
