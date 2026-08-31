import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { redirectTo } from "@/shared/lib/navigation";
import { CmsDashboardPrompt } from "./CmsDashboardPrompt";
import { CmsDashboardShell } from "./CmsDashboardShell";
import { cmsPathForView, cmsViewForPath } from "./routing";
import type { CmsView } from "./types";
import { useCmsBusinessProfile, useCmsSession } from "./queries";
import { DetailsView } from "./views/DetailsView";
import { PlaceholderView } from "./views/PlaceholderView";
import { WebsiteEditorView } from "./views/WebsiteEditorView";

export function CmsRoute(): ReactNode {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeView = cmsViewForPath(pathname);
  const { data: profile } = useCmsBusinessProfile();
  const { data: session, isPending: sessionPending } = useCmsSession();

  function navigateToView(view: CmsView): void {
    void navigate({ to: cmsPathForView(view) });
  }

  const hasActiveTenant = session?.tenant?.status === "active";
  useEffect(() => {
    // Tenant <-> Clerk org is 1-1 and there is no chooser anymore. CMS access
    // requires an active (paid/activated) tenant: no tenant, or a tenant that
    // is still unactivated, is the "not onboarded yet" state -> continue
    // onboarding (which is also reachable without signing in).
    if (!sessionPending && session && !hasActiveTenant) {
      redirectTo("/onboarding");
    }
  }, [hasActiveTenant, session, sessionPending]);

  if (sessionPending || !session || !hasActiveTenant) {
    return <div className="cms-app" aria-busy="true" />;
  }

  return (
    <div className="cms-app">
      <CmsDashboardShell
        {...(profile?.business_name
          ? { businessName: profile.business_name }
          : {})}
        activeView={activeView}
        onNavigate={navigateToView}
      >
        {activeView === "dashboard" ? (
          <CmsDashboardPrompt
            onSubmitPrompt={(prompt) => {
              window.sessionStorage.setItem("placis:cms-assistant-prompt", prompt);
              navigateToView("website_editor");
            }}
          />
        ) : activeView === "website_editor" ? (
          <WebsiteEditorView onBack={() => navigateToView("dashboard")} />
        ) : activeView === "details" ? (
          <DetailsView />
        ) : activeView === "proof" ? (
          <PlaceholderView
            description="Certifications, accreditations and trust evidence."
            title="Proof"
          />
        ) : (
          <PlaceholderView
            description="The completed project showcase."
            title="Projects"
          />
        )}
      </CmsDashboardShell>
    </div>
  );
}
