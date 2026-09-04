import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Globe2, Inbox, Megaphone, PanelLeft, UserRound } from "lucide-react";
import { createContext, type ReactNode, useContext, useState } from "react";

import { cn } from "@/lib/cn";
import {
  AssistantLaunch,
  CmsAssistantLayer,
  CmsAssistantProvider,
} from "@/ui/CmsAssistant";

export type CmsLayoutApi = {
  openDestinations: () => void;
};

const CmsLayoutContext = createContext<CmsLayoutApi | null>(null);

export function useCmsLayout(): CmsLayoutApi {
  const value = useContext(CmsLayoutContext);
  if (!value) {
    throw new Error("useCmsLayout must be used inside CmsLayout");
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
  | "/cms/leads"
  | "/cms/billing";

const profilePaths = [
  "/cms/details",
  "/cms/projects",
  "/cms/certifications",
  "/cms/media",
];

function isDesktop(): boolean {
  return window.matchMedia("(min-width: 1101px)").matches;
}

const navRowClass =
  "flex w-full min-h-8 items-center overflow-hidden rounded-lg text-[13px] font-medium tracking-[-0.01em]";

export function CmsLayout(): ReactNode {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (route) => route.location.pathname,
  });
  // Start with no persistent rail. Hovering the top-left control gives the
  // same temporary "peek" as placis-web; the control inside the sidebar pins
  // it open for people who prefer it visible.
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarPeek, setSidebarPeek] = useState(false);
  const [profileOpen, setProfileOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const profileActive = profilePaths.some((path) => pathname.startsWith(path));
  const sidebarOpen = sidebarPinned || sidebarPeek;
  const labelsVisible = sidebarOpen;
  const iconOnly = !labelsVisible;

  function closeOverlay(): void {
    // On desktop the sidebar stays open while moving between pages; on small
    // screens it behaves like the familiar dismissible drawer.
    if (window.matchMedia("(max-width: 1100px)").matches) {
      setSidebarPinned(false);
      setSidebarPeek(false);
    }
  }

  return (
    <div className="flex min-h-0 min-w-80 flex-1 overflow-hidden bg-background">
      {sidebarOpen ? (
        <button
          aria-label="Close destinations"
          className="fixed inset-0 z-40 bg-black/20 min-[1101px]:hidden"
          onClick={closeOverlay}
          type="button"
        />
      ) : null}

      {!sidebarOpen ? (
        <>
          {/* Keeps the whole former rail responsive without leaving a visible
              strip in the workspace. */}
          <div
            aria-hidden="true"
            className="fixed inset-y-0 left-0 z-50 hidden w-12 min-[1101px]:block"
            onMouseEnter={() => setSidebarPeek(true)}
          />
          <div className="fixed top-3 left-3 z-[60]">
            <button
              aria-expanded={false}
              aria-label="Open sidebar"
              className="grid size-7 place-items-center rounded-md text-zinc-500 transition hover:bg-black/5 hover:text-foreground dark:text-muted-foreground dark:hover:bg-white/[.07] dark:hover:text-foreground"
              onClick={() => setSidebarPinned(true)}
              type="button"
            >
              <PanelLeft className="size-[18px]" strokeWidth={1.5} />
            </button>
          </div>
        </>
      ) : null}
      <aside
        aria-label="The CMS"
        className={cn(
          "z-50 flex shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar",
          "transition-[width,transform] duration-[180ms] ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
          sidebarOpen
            ? "min-[1101px]:relative min-[1101px]:w-[15rem] min-[1101px]:translate-x-0 min-[1101px]:[transform:none]"
            : "min-[1101px]:hidden",
          "max-[1100px]:fixed max-[1100px]:inset-0 max-[1100px]:z-[70] max-[1100px]:w-full max-[1100px]:border-r-0",
          sidebarOpen
            ? "max-[1100px]:pointer-events-auto max-[1100px]:[transform:translateX(0)]"
            : "max-[1100px]:pointer-events-none max-[1100px]:[transform:translateX(-100%)]",
        )}
        onMouseLeave={() => {
          if (isDesktop() && !sidebarPinned) {
            setSidebarPeek(false);
          }
        }}
      >
        <div
          className={cn(
            "flex h-12 items-center gap-2 px-2",
            iconOnly ? "justify-center" : "justify-between",
          )}
        >
          {labelsVisible ? (
            <Link
              className="px-1 text-[16px] font-semibold tracking-tight text-foreground sm:text-[14px]"
              to="/cms"
            >
              Placis
            </Link>
          ) : (
            <span className="sr-only">Placis</span>
          )}
          <button
            aria-expanded={labelsVisible}
            aria-label={labelsVisible ? "Collapse sidebar" : "Expand sidebar"}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-zinc-600 hover:bg-black/5"
            onClick={() => {
              if (isDesktop()) {
                setSidebarPinned((pinned) => !pinned);
                setSidebarPeek(false);
                return;
              }
              setSidebarPinned(false);
              setSidebarPeek(false);
            }}
            type="button"
          >
            <PanelLeft className="size-[18px]" strokeWidth={1.5} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-px px-2">
          <NavLink
            active={pathname.startsWith("/cms/website")}
            icon={<Globe2 className="size-4" />}
            iconOnly={iconOnly}
            label="Sites"
            to="/cms/website"
            onNavigate={closeOverlay}
          />
          <ProfileNav
            closeOverlay={closeOverlay}
            iconOnly={iconOnly}
            labelsVisible={labelsVisible}
            navigate={navigate}
            pathname={pathname}
            profileActive={profileActive}
            profileOpen={profileOpen}
            setProfileOpen={setProfileOpen}
          />
          <NavLink
            active={pathname.startsWith("/cms/ads")}
            icon={<Megaphone className="size-4" />}
            iconOnly={iconOnly}
            label="Ads"
            to="/cms/ads"
            onNavigate={closeOverlay}
          />
          <NavLink
            active={pathname.startsWith("/cms/leads")}
            icon={<Inbox className="size-4" />}
            iconOnly={iconOnly}
            label="Leads"
            to="/cms/leads"
            onNavigate={closeOverlay}
          />
        </nav>
        <AccountMenu
          accountOpen={accountOpen}
          closeOverlay={closeOverlay}
          iconOnly={iconOnly}
          labelsVisible={labelsVisible}
          setAccountOpen={setAccountOpen}
        />
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <CmsAssistantProvider>
          <CmsLayoutContext.Provider
            value={{
              openDestinations: () => {
                setSidebarPinned(true);
                setSidebarPeek(false);
              },
            }}
          >
            <Outlet />
            <AssistantLaunch
              className={cn(
                "absolute right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] z-30",
                pathname.startsWith("/cms/website") &&
                  "max-[1100px]:bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))]",
              )}
            />
            <CmsAssistantLayer />
          </CmsLayoutContext.Provider>
        </CmsAssistantProvider>
      </div>
    </div>
  );
}

function ProfileNav({
  closeOverlay,
  iconOnly,
  labelsVisible,
  navigate,
  pathname,
  profileActive,
  profileOpen,
  setProfileOpen,
}: {
  closeOverlay: () => void;
  iconOnly: boolean;
  labelsVisible: boolean;
  navigate: ReturnType<typeof useNavigate>;
  pathname: string;
  profileActive: boolean;
  profileOpen: boolean;
  setProfileOpen: (update: (value: boolean) => boolean) => void;
}): ReactNode {
  return (
    <div>
      <button
        aria-expanded={labelsVisible ? profileOpen : undefined}
        aria-label="Profile"
        className={cn(
          navRowClass,
          iconOnly ? "justify-center px-0" : "gap-2.5 px-2 py-1.5",
          profileActive
            ? "bg-black/[0.06] text-foreground"
            : "text-zinc-600 hover:bg-black/5 hover:text-foreground",
        )}
        onClick={() => {
          if (iconOnly) {
            void navigate({ to: "/cms/details" });
            return;
          }
          setProfileOpen((value) => !value);
        }}
        type="button"
      >
        {iconOnly ? <UserRound className="size-4 shrink-0" /> : null}
        {labelsVisible ? (
          <>
            <span className="flex-1 text-left">Profile</span>
            <span
              className={cn(
                "text-[10px] transition-transform duration-150",
                profileOpen ? "rotate-180" : "",
              )}
            >
              ▾
            </span>
          </>
        ) : (
          <span className="sr-only">Profile</span>
        )}
      </button>
      {profileOpen && labelsVisible ? (
        <div className="grid gap-px py-1 pl-2">
          <ChildLink
            active={pathname === "/cms/details"}
            label="Business details"
            to="/cms/details"
            onNavigate={closeOverlay}
          />
          <ChildLink
            active={pathname.startsWith("/cms/projects")}
            label="Projects"
            to="/cms/projects"
            onNavigate={closeOverlay}
          />
          <ChildLink
            active={pathname.startsWith("/cms/certifications")}
            label="Certifications and reviews"
            to="/cms/certifications"
            onNavigate={closeOverlay}
          />
          <ChildLink
            active={pathname === "/cms/media"}
            label="Media library"
            to="/cms/media"
            onNavigate={closeOverlay}
          />
        </div>
      ) : null}
    </div>
  );
}

function AccountMenu({
  accountOpen,
  closeOverlay,
  iconOnly,
  labelsVisible,
  setAccountOpen,
}: {
  accountOpen: boolean;
  closeOverlay: () => void;
  iconOnly: boolean;
  labelsVisible: boolean;
  setAccountOpen: (update: (value: boolean) => boolean) => void;
}): ReactNode {
  return (
    <div
      className={cn(
        "relative mt-auto p-2",
        iconOnly ? "" : "border-t border-border pt-2.5",
      )}
    >
      {accountOpen ? (
        <div
          className={cn(
            "absolute z-[80] rounded-xl border border-border bg-white p-1.5 shadow-sm",
            labelsVisible
              ? "right-2 bottom-14 left-2"
              : "bottom-1 left-full ml-2 w-52",
          )}
        >
          <Link
            className="flex min-h-8 items-center rounded-lg px-2.5 text-xs text-zinc-600 hover:bg-zinc-50"
            onClick={() => {
              setAccountOpen(() => false);
              closeOverlay();
            }}
            to="/cms/billing"
          >
            Usage & billing
          </Link>
        </div>
      ) : null}
      <button
        aria-expanded={accountOpen}
        aria-label="Open account menu"
        className={cn(
          "flex w-full items-center rounded-lg text-left hover:bg-black/5",
          iconOnly ? "justify-center p-1" : "gap-2 px-1 py-1",
        )}
        onClick={() => setAccountOpen((value) => !value)}
        type="button"
      >
        <img
          alt=""
          className="size-7 rounded-full object-cover"
          height={28}
          src="/owner-avatar.jpg"
          width={28}
        />
        {labelsVisible ? (
          <span className="min-w-0">
            <span className="block truncate text-[13px] text-foreground">
              Aoife Byrne
            </span>
            <span className="block text-xs text-muted-foreground">Owner</span>
          </span>
        ) : null}
      </button>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon,
  iconOnly,
  active,
  onNavigate,
}: {
  to: CmsPath;
  label: string;
  icon: ReactNode;
  iconOnly: boolean;
  active: boolean;
  onNavigate: () => void;
}): ReactNode {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      aria-label={iconOnly ? label : undefined}
      className={cn(
        navRowClass,
        iconOnly ? "justify-center px-0" : "px-2 py-1.5",
        active
          ? "bg-black/[0.06] text-foreground"
          : "text-zinc-600 hover:bg-black/5 hover:text-foreground",
      )}
      onClick={onNavigate}
      to={to}
    >
      {iconOnly ? icon : null}
      {iconOnly ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span>{label}</span>
      )}
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
        "rounded-lg px-3 py-1.5 text-[13px]",
        active
          ? "bg-black/[0.06] text-foreground"
          : "text-zinc-600 hover:bg-black/5 hover:text-foreground",
      )}
      onClick={onNavigate}
      to={to}
    >
      {label}
    </Link>
  );
}
