import { useAuth, useClerk, useUser } from "@clerk/react";
import {
  Building2,
  ChevronDown,
  LogOut,
  type LucideIcon,
  Settings,
  UsersRound,
} from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { type ReactNode, useState } from "react";

import { isClerkConfigured } from "@/shared/auth/AuthProvider";

type CmsAccountMenuItem = {
  active?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

export type CmsAccountMenuProps = {
  businessName?: string;
};

/** Account menu for the CMS dashboard sidebar. Shows the real Clerk user
 *  (name, email, avatar, settings/org menu, log out) when Clerk is configured;
 *  falls back to the static business-name placeholder when it is not (dev
 *  mode, where Clerk hooks must not be mounted). */
export function CmsAccountMenu({
  businessName,
}: CmsAccountMenuProps): ReactNode {
  return (
    <div className="cms-auth-menu">
      {!isClerkConfigured ? (
        <StaticAccountMenu businessName={businessName} />
      ) : (
        <ClerkAccountMenu />
      )}
    </div>
  );
}function ClerkAccountMenu(): ReactNode {
  const { isLoaded: isAuthLoaded, isSignedIn, orgId } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const clerk = useClerk();
  const [open, setOpen] = useState(false);

  if (!isAuthLoaded || !isUserLoaded || !isSignedIn || !user) {
    return (
      <div className="cms-user-menu-placeholder" role="status">
        Account
      </div>
    );
  }

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";
  const name = user.fullName || user.username || email || "Placis user";
  const initials = userInitials(user.firstName, user.lastName, name, email);
  const canOpenOrganization = Boolean(orgId);

  const openUserProfile = (): void => {
    setOpen(false);
    clerk.openUserProfile();
  };
  const openOrganizationProfile = (): void => {
    if (!canOpenOrganization) {
      return;
    }
    setOpen(false);
    clerk.openOrganizationProfile();
  };
  const signOut = (): void => {
    setOpen(false);
    void clerk.signOut();
  };

  const menuItems: CmsAccountMenuItem[] = [
    {
      disabled: !canOpenOrganization,
      icon: UsersRound,
      label: "User Management",
      onClick: openOrganizationProfile,
    },
    {
      active: true,
      icon: Settings,
      label: "Settings",
      onClick: openUserProfile,
    },
    {
      disabled: !canOpenOrganization,
      icon: Building2,
      label: "Organization",
      onClick: openOrganizationProfile,
    },
  ];

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <div className="cms-user-menu">
        <DropdownMenuPrimitive.Trigger
          aria-label="Open account menu"
          className="cms-user-menu-trigger"
        >
          <span className="cms-user-menu-trigger-copy">
            <span className="cms-user-menu-trigger-name">{name}</span>
            {email ? (
              <span className="cms-user-menu-trigger-email">{email}</span>
            ) : null}
          </span>
          <CmsUserAvatar imageUrl={user.imageUrl} initials={initials} />
          <ChevronDown aria-hidden="true" className="cms-user-menu-chevron" />
        </DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Content
          align="end"
          className="cms-user-menu-popover"
          collisionPadding={12}
          sideOffset={8}
        >
          <div className="cms-user-menu-profile">
            <CmsUserAvatar imageUrl={user.imageUrl} initials={initials} large />
            <div className="cms-user-menu-profile-copy">
              <div className="cms-user-menu-profile-name">{name}</div>
              {email ? (
                <div className="cms-user-menu-profile-email">{email}</div>
              ) : null}
            </div>
          </div>
          <div className="cms-user-menu-items">
            {menuItems.map((menuItem) => (
              <CmsAccountMenuButton key={menuItem.label} menuItem={menuItem} />
            ))}
          </div>
          <DropdownMenuPrimitive.Separator className="cms-user-menu-separator" />
          <DropdownMenuPrimitive.Item
            className="cms-user-menu-item"
            onSelect={signOut}
          >
            <LogOut aria-hidden="true" />
            <span>Log out</span>
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </div>
    </DropdownMenuPrimitive.Root>
  );
}

function CmsAccountMenuButton({
  menuItem,
}: {
  menuItem: CmsAccountMenuItem;
}): ReactNode {
  const Icon = menuItem.icon;
  return (
    <DropdownMenuPrimitive.Item
      className={
        menuItem.active
          ? "cms-user-menu-item cms-user-menu-item-active"
          : "cms-user-menu-item"
      }
      disabled={menuItem.disabled ?? false}
      onSelect={menuItem.onClick}
      {...(menuItem.disabled
        ? { title: "Available when an organization is active" }
        : {})}
    >
      <Icon aria-hidden="true" />
      <span>{menuItem.label}</span>
    </DropdownMenuPrimitive.Item>
  );
}

function StaticAccountMenu({
  businessName,
}: {
  businessName: string | undefined;
}): ReactNode {
  return (
    <div className="cms-user-menu">
      <button
        aria-expanded="false"
        aria-label="Open account menu"
        className="cms-user-menu-trigger"
        type="button"
      >
        <span className="cms-user-menu-trigger-copy">
          <span className="cms-user-menu-trigger-name">
            {businessName ?? "Placis"}
          </span>
          <span className="cms-user-menu-trigger-email">Free plan</span>
        </span>
        <span aria-hidden="true" className="cms-user-avatar">
          {accountInitials(businessName)}
        </span>
      </button>
    </div>
  );
}

function accountInitials(businessName: string | undefined): string {
  if (!businessName) {
    return "P";
  }
  return businessName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function CmsUserAvatar({
  imageUrl,
  initials,
  large = false,
}: {
  imageUrl: string;
  initials: string;
  large?: boolean;
}): ReactNode {
  return (
    <span
      aria-hidden="true"
      className={
        large ? "cms-user-avatar cms-user-avatar-large" : "cms-user-avatar"
      }
    >
      {imageUrl ? <img alt="" src={imageUrl} /> : <span>{initials}</span>}
    </span>
  );
}

function userInitials(
  firstName: string | null,
  lastName: string | null,
  name: string,
  email: string,
): string {
  const explicitInitials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`;
  if (explicitInitials) {
    return explicitInitials.toUpperCase();
  }

  const source = name || email || "OC";
  const initials = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (initials || "OC").toUpperCase();
}
