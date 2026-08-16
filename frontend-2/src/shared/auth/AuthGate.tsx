import { useAuth } from "@clerk/react";
import { type ReactNode, useEffect } from "react";

import {
  currentPathWithQuery,
  readPathname,
  readUrlSearchParams,
  redirectTo,
} from "@/shared/lib/navigation";
import { isClerkConfigured } from "./AuthProvider";
import { OrgProvisionStep } from "./OrgProvisionStep";
import {
  isPrivateAppLoginPath,
  privateAppLoginUrl,
  privateAppRedirectUrlFromSearch,
} from "./authRoutes";

interface AuthGateProps {
  children: ReactNode;
}

/** Clerk sign-in gate for private app routes. When Clerk is not configured
 *  (dev mode) it renders children as-is. When configured it redirects signed
 *  out users to /login (preserving the current path) and bounces signed in
 *  users away from /login back to their intended destination. */
export function AuthGate({ children }: AuthGateProps): ReactNode {
  if (!isClerkConfigured) {
    return children;
  }
  return <ClerkAuthGate>{children}</ClerkAuthGate>;
}

function ClerkAuthGate({ children }: AuthGateProps): ReactNode {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const pathname = readPathname();
  const isLoginPath = isPrivateAppLoginPath(pathname);
  const redirectUrl = privateAppRedirectUrlFromSearch(readUrlSearchParams());

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    if (isSignedIn && isLoginPath) {
      redirectTo(redirectUrl);
      return;
    }
    if (!isSignedIn && !isLoginPath) {
      redirectTo(privateAppLoginUrl(currentPathWithQuery()));
    }
  }, [isLoaded, isLoginPath, isSignedIn, redirectUrl]);

  if (!isLoaded) {
    return <CmsAuthLoading />;
  }
  if (isSignedIn && isLoginPath) {
    return children;
  }
  // Signed in without a Clerk organization: provision it (named after the
  // user) before any app access — no org means no tenant, which means no CMS.
  if (isSignedIn && !orgId) {
    return <OrgProvisionStep />;
  }
  if (isSignedIn) {
    return children;
  }
  if (isLoginPath) {
    // Signed out on /login: render the sign-in page (no redirect needed).
    return children;
  }
  // Signed out on a private path: the redirect above is in flight.
  return <CmsAuthLoading />;
}

function CmsAuthLoading(): ReactNode {
  return <main aria-busy="true" className="cms-auth-page" />;
}
