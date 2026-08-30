import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  useNavigate,
} from "@tanstack/react-router";
import { type ComponentType, lazy, type ReactNode, useEffect } from "react";
import { AppShell } from "@/app/shell";
import { AuthGate } from "@/shared/auth/AuthGate";

const rootRoute = createRootRoute({ component: AppShell });

const marketingBaseUrl =
  (import.meta.env as { VITE_MARKETING_BASE_URL?: string })
    .VITE_MARKETING_BASE_URL ?? "https://placis.com";

function isAppHostname(hostname: string): boolean {
  return hostname === "app.placis.com" || hostname.startsWith("app.");
}

function AppIndexRedirect(): ReactNode {
  const navigate = useNavigate();
  useEffect(() => {
    const hostname = window.location.hostname;
    const isAppHost = isAppHostname(hostname);
    const isLocalDev = hostname === "localhost" || hostname === "127.0.0.1";
    if (isAppHost || isLocalDev) {
      void navigate({ to: "/cms" });
      return;
    }
    window.location.replace(marketingBaseUrl);
  }, [navigate]);
  return null;
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: AppIndexRedirect,
});

const cmsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cms",
  component: lazy(() =>
    import("@/features/cms").then((m) => ({ default: gated(m.CmsRoute) })),
  ),
});

const cmsWebsiteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cms/website",
  component: lazy(() =>
    import("@/features/cms").then((m) => ({ default: gated(m.CmsRoute) })),
  ),
});

const cmsDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cms/details",
  component: lazy(() =>
    import("@/features/cms").then((m) => ({ default: gated(m.CmsRoute) })),
  ),
});

const cmsProofRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cms/proof",
  component: lazy(() =>
    import("@/features/cms").then((m) => ({ default: gated(m.CmsRoute) })),
  ),
});

const cmsProjectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cms/projects",
  component: lazy(() =>
    import("@/features/cms").then((m) => ({ default: gated(m.CmsRoute) })),
  ),
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: lazy(() =>
    import("@/features/setup").then((m) => ({ default: m.SetupRoute })),
  ),
});

// The setup step lives in the URL
// (/onboarding/find|review|interview|preview|preview-and-edit)
// and is synced by the controller; this route keeps /onboarding/{step} matching.
const onboardingStepRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding/$step",
  component: lazy(() =>
    import("@/features/setup").then((m) => ({ default: m.SetupRoute })),
  ),
});

const previewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/preview/$token/$module",
  component: lazy(() =>
    import("@/features/preview").then((m) => ({ default: m.PreviewRoute })),
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  // Clerk's path-routing navigates under /login for its internal steps
  // (/login/create/tasks/choose-organization, /login/sso-callback, ...);
  // LoginPage's <SignIn routing="path"> renders them all, so the lone `$`
  // segment matches any /login/* sub-path (including exact /login).
  path: "/login/$",
  component: lazy(() =>
    import("@/shared/auth/LoginPage").then((m) => ({
      default: gated(m.LoginPage),
    })),
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  cmsRoute,
  cmsWebsiteRoute,
  cmsDetailsRoute,
  cmsProofRoute,
  cmsProjectsRoute,
  onboardingRoute,
  onboardingStepRoute,
  previewRoute,
  loginRoute,
]);

const router = createRouter({ routeTree });

/** Wraps a private-app route component in the Clerk sign-in gate. */
function gated(Component: ComponentType): () => ReactNode {
  return function AuthGatedRoute(): ReactNode {
    return (
      <AuthGate>
        <Component />
      </AuthGate>
    );
  };
}

export function AppRouter(): ReactNode {
  return <RouterProvider router={router} />;
}
