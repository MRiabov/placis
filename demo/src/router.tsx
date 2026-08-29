import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";

import { AdsPage } from "@/pages/cms/AdsPage";
import { BillingPage } from "@/pages/cms/BillingPage";
import { CertificationsPage } from "@/pages/cms/CertificationsPage";
import { DetailsPage } from "@/pages/cms/DetailsPage";
import { HomePage } from "@/pages/cms/HomePage";
import { MediaPage } from "@/pages/cms/MediaPage";
import { ProjectsPage } from "@/pages/cms/ProjectsPage";
import { WebsitePage } from "@/pages/cms/WebsitePage";
import { FindPage } from "@/pages/onboarding/FindPage";
import { GeneratedPage } from "@/pages/onboarding/GeneratedPage";
import { InterviewPage } from "@/pages/onboarding/InterviewPage";
import { OnboardingShell } from "@/pages/onboarding/OnboardingShell";
import { PreviewPage } from "@/pages/onboarding/PreviewPage";
import { ReviewPage } from "@/pages/onboarding/ReviewPage";
import { CmsShell } from "@/shell/CmsShell";

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
  component: CmsShell,
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
  component: ProjectsPage,
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
});

const billingRoute = createRoute({
  getParentRoute: () => cmsRoute,
  path: "billing",
  component: BillingPage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: OnboardingShell,
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
    projectsRoute,
    certificationsRoute,
    mediaRoute,
    adsRoute,
    billingRoute,
  ]),
  onboardingRoute.addChildren([
    onboardingIndexRoute,
    findRoute,
    reviewRoute,
    interviewRoute,
    previewRoute,
    generatedRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
