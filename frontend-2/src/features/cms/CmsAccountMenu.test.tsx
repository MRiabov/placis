// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const clerkState = vi.hoisted(() => {
  const auth: {
    isLoaded: boolean;
    isSignedIn: boolean;
    orgId: string | null;
  } = { isLoaded: true, isSignedIn: true, orgId: "org_123" };
  const user = {
    fullName: "Jane Doe",
    username: null,
    firstName: "Jane",
    lastName: "Doe",
    primaryEmailAddress: { emailAddress: "jane@example.com" },
    emailAddresses: [],
    imageUrl: "https://img.example/jane.png",
  };
  return {
    configured: true,
    auth,
    user,
    signOut: vi.fn(),
    openUserProfile: vi.fn(),
    openOrganizationProfile: vi.fn(),
  };
});

vi.mock("@/shared/auth/AuthProvider", () => ({
  get isClerkConfigured() {
    return clerkState.configured;
  },
}));

vi.mock("@clerk/react", () => ({
  useAuth: () => clerkState.auth,
  useUser: () => ({ isLoaded: true, user: clerkState.user }),
  useClerk: () => ({
    signOut: clerkState.signOut,
    openUserProfile: clerkState.openUserProfile,
    openOrganizationProfile: clerkState.openOrganizationProfile,
  }),
}));

import { CmsAccountMenu } from "./CmsAccountMenu";

describe("CmsAccountMenu", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    clerkState.configured = true;
    clerkState.auth = { isLoaded: true, isSignedIn: true, orgId: "org_123" };
  });

  it("falls back to the static placeholder when Clerk is not configured", () => {
    clerkState.configured = false;
    render(<CmsAccountMenu businessName="Bellfield Construction" />);
    expect(screen.getByText("Bellfield Construction")).toBeInTheDocument();
    expect(screen.getByText("Free plan")).toBeInTheDocument();
    expect(screen.getByText("BC")).toBeInTheDocument();
  });

  it("renders the Clerk user name and email when signed in", () => {
    render(<CmsAccountMenu />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("shows the placeholder while the Clerk user is not loaded", () => {
    clerkState.auth = { isLoaded: false, isSignedIn: false, orgId: null };
    render(<CmsAccountMenu />);
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("opens the menu and signs out from Log out", () => {
    render(<CmsAccountMenu />);
    fireEvent.pointerDown(screen.getByLabelText("Open account menu"));

    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Organization")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Log out"));
    expect(clerkState.signOut).toHaveBeenCalledTimes(1);
  });

  it("disables organization items when no org is active", () => {
    clerkState.auth = { isLoaded: true, isSignedIn: true, orgId: null };
    render(<CmsAccountMenu />);
    fireEvent.pointerDown(screen.getByLabelText("Open account menu"));

    expect(
      screen.getByRole("menuitem", { name: "User Management" }),
    ).toHaveAttribute("data-disabled");
    expect(
      screen.getByRole("menuitem", { name: "Organization" }),
    ).toHaveAttribute("data-disabled");
    expect(
      screen.getByRole("menuitem", { name: "Settings" }),
    ).not.toHaveAttribute("data-disabled");
  });
});
