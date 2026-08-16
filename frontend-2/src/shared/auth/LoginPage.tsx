import { SignIn } from "@clerk/react";
import type { ReactNode } from "react";

import { readUrlSearchParams } from "@/shared/lib/navigation";
import { isClerkConfigured } from "./AuthProvider";
import {
  PRIVATE_APP_LOGIN_PATH,
  privateAppRedirectUrlFromSearch,
} from "./authRoutes";

/** The Clerk-hosted sign-in page rendered on /login. After a successful
 *  sign-in Clerk redirects back to the redirect_url search param (or /cms).
 *  Without a Clerk key the page explains the missing config instead of
 *  mounting `<SignIn>` outside a ClerkProvider. */
export function LoginPage(): ReactNode {
  if (!isClerkConfigured) {
    return (
      <main className="cms-auth-page">
        <section
          aria-labelledby="cms-auth-config-title"
          className="cms-auth-config-error"
        >
          <p className="cms-auth-eyebrow">Placis CMS</p>
          <h1 id="cms-auth-config-title">Authentication is not configured</h1>
          <p>
            Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> before starting the app.
          </p>
        </section>
      </main>
    );
  }
  return (
    <main className="cms-auth-page">
      <SignIn
        fallbackRedirectUrl={privateAppRedirectUrlFromSearch(
          readUrlSearchParams(),
        )}
        path={PRIVATE_APP_LOGIN_PATH}
        routing="path"
        signUpUrl={PRIVATE_APP_LOGIN_PATH}
        withSignUp
      />
    </main>
  );
}
