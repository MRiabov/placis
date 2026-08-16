import { ClerkProvider, useAuth } from "@clerk/react";
import { type ReactNode, useEffect } from "react";

import { setApiTokenProvider } from "@/shared/api/client";

const clerkPublishableKey = (
  import.meta.env as {
    VITE_CLERK_PUBLISHABLE_KEY?: string;
  }
).VITE_CLERK_PUBLISHABLE_KEY;

/** Whether a Clerk publishable key is configured; when false the app renders
 *  without Clerk (dev mode) and the auth gate and account menu fall back to
 *  static placeholders instead of mounting Clerk hooks. */
export const isClerkConfigured = Boolean(clerkPublishableKey);

const PRIVATE_APP_LOGIN_PATH = "/login";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactNode {
  if (!clerkPublishableKey) {
    return children;
  }

  return (
    <ClerkProvider
      afterSignOutUrl={PRIVATE_APP_LOGIN_PATH}
      publishableKey={clerkPublishableKey}
      signInUrl={PRIVATE_APP_LOGIN_PATH}
    >
      {/* Note: the old app themed Clerk with @clerk/ui's shadcn appearance;
          the prebuilt_appearance type does not satisfy ClerkProvider's
          Appearance in Clerk v6 — deferred until the type contract is fixed. */}
      <ApiTokenBridge />
      {children}
    </ClerkProvider>
  );
}

function ApiTokenBridge(): ReactNode {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    setApiTokenProvider(isLoaded && isSignedIn ? () => getToken() : null);
  }, [getToken, isLoaded, isSignedIn]);

  return null;
}
