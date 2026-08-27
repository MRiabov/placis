import {
  Building2,
  Globe2,
  type LucideIcon,
  Menu,
  MessageSquarePlus,
  PanelLeft,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { CmsAccountMenu } from "./CmsAccountMenu";
import type { CmsView } from "./types";

type NavItem = {
  icon: LucideIcon;
  label: string;
  view: CmsView;
};

export type CmsDashboardShellProps = {
  activeView?: CmsView;
  businessName?: string;
  children: ReactNode;
  onNavigate: (view: CmsView) => void;
};

export function CmsDashboardShell({
  activeView = "dashboard",
  businessName,
  children,
  onNavigate,
}: CmsDashboardShellProps): ReactNode {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPeek, setSidebarPeek] = useState(false);
  const sidebarExpanded = !sidebarCollapsed || sidebarPeek || mobileNavOpen;

  const navItems: NavItem[] = [
    { icon: MessageSquarePlus, label: "New chat", view: "dashboard" },
    { icon: Globe2, label: "Sites", view: "website_editor" },
    { icon: Building2, label: "Details", view: "details" },
  ];

  function selectItem(navEntry: NavItem): void {
    onNavigate(navEntry.view);
    setMobileNavOpen(false);
  }

  return (
    <div
      className={`cms-dashboard-shell ${
        sidebarExpanded ? "is-expanded" : "is-collapsed"
      }`}
    >
      {mobileNavOpen ? (
        <button
          aria-label="Close navigation"
          className="cms-dashboard-nav-scrim"
          onClick={() => setMobileNavOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        aria-label="CMS navigation"
        className={`cms-dashboard-sidebar ${
          mobileNavOpen ? "is-mobile-open" : ""
        }`}
        onMouseEnter={() => {
          if (sidebarCollapsed) {
            setSidebarPeek(true);
          }
        }}
        onMouseLeave={() => setSidebarPeek(false)}
      >
        <div className="cms-dashboard-sidebar-inner">
          <div className="cms-dashboard-sidebar-header">
            {sidebarExpanded ? (
              <button
                className="cms-dashboard-brand"
                onClick={() => {
                  const firstItem = navItems[0];
                  if (firstItem) {
                    selectItem(firstItem);
                  }
                }}
                type="button"
              >
                Placis
              </button>
            ) : null}
            <button
              aria-expanded={sidebarExpanded}
              aria-label={
                sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"
              }
              className="cms-dashboard-icon-button"
              onClick={() => {
                if (window.matchMedia("(min-width: 1024px)").matches) {
                  setSidebarCollapsed((collapsed) => !collapsed);
                  setSidebarPeek(false);
                } else {
                  setMobileNavOpen(false);
                }
              }}
              type="button"
            >
              <PanelLeft aria-hidden="true" />
            </button>
          </div>

          <DashboardNav
            activeView={activeView}
            collapsed={!sidebarExpanded}
            navItems={navItems}
            onSelect={selectItem}
          />

          <div className="cms-dashboard-sidebar-spacer" />

          <div className="cms-dashboard-account">
            {sidebarExpanded ? (
              <div className="cms-dashboard-account-divider">
                <CmsAccountMenu {...(businessName ? { businessName } : {})} />
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="cms-dashboard-main-column">
        <header className="cms-dashboard-mobile-header">
          <button
            aria-label="Open navigation"
            className="cms-dashboard-icon-button"
            onClick={() => setMobileNavOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" />
          </button>
          <span>Placis</span>
        </header>
        <main className="cms-dashboard-main-content">{children}</main>
      </div>
    </div>
  );
}

function DashboardNav({
  activeView,
  collapsed,
  navItems,
  onSelect,
}: {
  activeView: CmsView;
  collapsed: boolean;
  navItems: NavItem[];
  onSelect: (navEntry: NavItem) => void;
}): ReactNode {
  return (
    <nav className="cms-dashboard-nav">
      {navItems.map((navEntry) => {
        const Icon = navEntry.icon;
        const active = navEntry.view === activeView;
        return (
          <button
            aria-label={collapsed ? navEntry.label : undefined}
            aria-current={active ? "page" : undefined}
            className={`cms-dashboard-nav-item ${active ? "is-active" : ""}`}
            key={navEntry.label}
            onClick={() => onSelect(navEntry)}
            type="button"
          >
            {collapsed ? <Icon aria-hidden="true" /> : null}
            {!collapsed ? <span>{navEntry.label}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
