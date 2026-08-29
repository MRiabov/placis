import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Globe2, Megaphone, PanelLeft, UserRound, Wallet } from "lucide-react";
import { createContext, type ReactNode, useContext, useState } from "react";

import { cn } from "@/lib/cn";

export type CmsLayout = {
  openDestinations: () => void;
};

const CmsLayoutContext = createContext<CmsLayout | null>(null);

export function useCmsLayout(): CmsLayout {
  const value = useContext(CmsLayoutContext);
  if (!value) {
    throw new Error("useCmsLayout must be used inside CmsShell");
  }
  return value;
}

type CmsPath =
  | "/cms"
  | "/cms/website"
  | "/cms/details"
  | "/cms/projects"
  | "/cms/certifications"
  | "/cms/media"
  | "/cms/ads"
  | "/cms/billing";

const profilePaths = [
  "/cms/details",
  "/cms/projects",
  "/cms/certifications",
  "/cms/media",
];

export function CmsShell(): ReactNode {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [expanded, setExpanded] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(
    profilePaths.some((path) => pathname.startsWith(path)),
  );
  const profileActive = profilePaths.some((path) => pathname.startsWith(path));

  return (
    <div className="flex min-h-0 min-w-80 flex-1 overflow-hidden bg-background">
      {overlayOpen ? (
        <button
          aria-label="Close destinations"
          className="fixed inset-0 z-40 bg-black/20 min-[1101px]:hidden"
          onClick={() => setOverlayOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        aria-label="The CMS"
        className={cn(
          "relative z-50 flex shrink-0 flex-col border-r border-border bg-sidebar transition-[width,transform]",
          expanded ? "w-56" : "w-14",
          overlayOpen
            ? "max-[1100px]:fixed max-[1100px]:inset-y-0 max-[1100px]:left-0 max-[1100px]:w-full"
            : "max-[1100px]:hidden",
        )}
      >
        <div className="flex h-12 items-center justify-between gap-2 px-2">
          {expanded || overlayOpen ? (
            <Link className="px-2 text-sm font-medium" to="/cms">
              Placis
            </Link>
          ) : (
            <span className="sr-only">Placis</span>
          )}
          <button
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className="grid size-8 place-items-center rounded-lg text-zinc-600 hover:bg-black/5"
            onClick={() => {
              if (window.matchMedia("(max-width: 1100px)").matches) {
                setOverlayOpen(false);
                return;
              }
              setExpanded((value) => !value);
            }}
            type="button"
          >
            <PanelLeft className="size-4" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          <NavLink
            active={pathname.startsWith("/cms/website")}
            expanded={expanded || overlayOpen}
            icon={<Globe2 className="size-4" />}
            label="Sites"
            to="/cms/website"
            onNavigate={() => setOverlayOpen(false)}
          />
          <div>
            <button
              aria-expanded={profileOpen}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm",
                profileActive ? "bg-black/5 text-foreground" : "text-zinc-600",
              )}
              onClick={() => {
                if (!(expanded || overlayOpen)) {
                  void navigate({ to: "/cms/details" });
                  return;
                }
                setProfileOpen((value) => !value);
              }}
              type="button"
            >
              <UserRound className="size-4 shrink-0" />
              {expanded || overlayOpen ? (
                <>
                  <span className="flex-1 text-left">Profile</span>
                  <span
                    className={cn(
                      "transition",
                      profileOpen ? "rotate-180" : "",
                    )}
                  >
                    ▾
                  </span>
                </>
              ) : null}
            </button>
            {profileOpen && (expanded || overlayOpen) ? (
              <div className="ml-4 grid gap-0.5 py-1">
                <ChildLink
                  active={pathname === "/cms/details"}
                  label="Business details"
                  to="/cms/details"
                  onNavigate={() => setOverlayOpen(false)}
                />
                <ChildLink
                  active={pathname === "/cms/projects"}
                  label="Projects"
                  to="/cms/projects"
                  onNavigate={() => setOverlayOpen(false)}
                />
                <ChildLink
                  active={pathname.startsWith("/cms/certifications")}
                  label="Certifications and reviews"
                  to="/cms/certifications"
                  onNavigate={() => setOverlayOpen(false)}
                />
                <ChildLink
                  active={pathname === "/cms/media"}
                  label="Media library"
                  to="/cms/media"
                  onNavigate={() => setOverlayOpen(false)}
                />
              </div>
            ) : null}
          </div>
          <NavLink
            active={pathname.startsWith("/cms/ads")}
            expanded={expanded || overlayOpen}
            icon={<Megaphone className="size-4" />}
            label="Ads"
            to="/cms/ads"
            onNavigate={() => setOverlayOpen(false)}
          />
          <NavLink
            active={pathname.startsWith("/cms/billing")}
            expanded={expanded || overlayOpen}
            icon={<Wallet className="size-4" />}
            label="Usage"
            to="/cms/billing"
            onNavigate={() => setOverlayOpen(false)}
          />
        </nav>
        <div className="mt-auto border-t border-border p-2">
          <button
            aria-label="Open account menu"
            className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-black/5"
            type="button"
          >
            <img
              alt=""
              className="size-8 rounded-full object-cover"
              height={32}
              src="/owner-avatar.jpg"
              width={32}
            />
            {expanded || overlayOpen ? (
              <span className="min-w-0">
                <span className="block truncate text-sm text-foreground">
                  Aoife Byrne
                </span>
                <span className="block text-xs text-muted-foreground">
                  Owner
                </span>
              </span>
            ) : null}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <CmsLayoutContext.Provider
          value={{
            openDestinations: () => setOverlayOpen(true),
          }}
        >
          <Outlet />
        </CmsLayoutContext.Provider>
      </div>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon,
  expanded,
  active,
  onNavigate,
}: {
  to: CmsPath;
  label: string;
  icon: ReactNode;
  expanded: boolean;
  active: boolean;
  onNavigate: () => void;
}): ReactNode {
  return (
    <Link
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
        active
          ? "bg-black/5 text-foreground"
          : "text-zinc-600 hover:bg-black/5",
      )}
      onClick={onNavigate}
      to={to}
    >
      {icon}
      {expanded ? label : <span className="sr-only">{label}</span>}
    </Link>
  );
}

function ChildLink({
  to,
  label,
  active,
  onNavigate,
}: {
  to: CmsPath;
  label: string;
  active: boolean;
  onNavigate: () => void;
}): ReactNode {
  return (
    <Link
      className={cn(
        "rounded-lg px-2 py-1.5 text-sm",
        active
          ? "bg-black/5 text-foreground"
          : "text-zinc-600 hover:bg-black/5",
      )}
      onClick={onNavigate}
      to={to}
    >
      {label}
    </Link>
  );
}
