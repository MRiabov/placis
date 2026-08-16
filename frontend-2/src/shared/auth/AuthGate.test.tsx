// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  configured: true,
  isLoaded: true,
  isSignedIn: false,
  orgId: null as string | null,
}));

const navState = vi.hoisted(() => ({
  pathname: "/cms",
  search: "",
}));

vi.mock("@clerk/react", () => ({
  useAuth: () => ({
    isLoaded: authState.isLoaded,
    isSignedIn: authState.isSignedIn,
    orgId: authState.orgId,
  }),
  useUser: () => ({ user: null }),
  useClerk: () => ({ setActive: vi.fn() }),
  SignIn: () => <div data-testid="sign-in" />,
}));

vi.mock("@/shared/auth/AuthProvider", () => ({
  get isClerkConfigured() {
    return authState.configured;
  },
}));

vi.mock("@/shared/lib/navigation", () => ({
  redirectTo: vi.fn(),
  readPathname: () => navState.pathname,
  readUrlSearchParams: () => new URLSearchParams(navState.search),
  currentPathWithQuery: () => `${navState.pathname}${navState.search}`,
}));

import { redirectTo } from "@/shared/lib/navigation";
import { AuthGate } from "./AuthGate";
import { LoginPage } from "./LoginPage";

const mockedRedirect = vi.mocked(redirectTo);

function renderGated(): void {
  render(
    <AuthGate>
      <div data-testid="gated-child">child</div>
    </AuthGate>,
  );
}

describe("AuthGate", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    authState.configured = true;
    authState.isLoaded = true;
    authState.isSignedIn = false;
    authState.orgId = null;
    navState.pathname = "/cms";
    navState.search = "";
  });

  it("renders children when Clerk is not configured", () => {
    authState.configured = false;
    renderGated();
    expect(screen.getByTestId("gated-child")).toBeInTheDocument();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("shows loading while Clerk auth is not loaded", () => {
    authState.isLoaded = false;
    renderGated();
    expect(screen.queryByTestId("gated-child")).not.toBeInTheDocument();
    expect(screen.getByRole("main", { busy: true })).toBeInTheDocument();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("redirects signed out users away from private paths", () => {
    renderGated();
    expect(mockedRedirect).toHaveBeenCalledWith("/login?redirect_url=%2Fcms");
  });

  it("preserves the full current path in the login redirect", () => {
    navState.pathname = "/cms/details";
    renderGated();
    expect(mockedRedirect).toHaveBeenCalledWith(
      "/login?redirect_url=%2Fcms%2Fdetails",
    );
  });

  it("renders the login page for signed out users on /login", () => {
    navState.pathname = "/login";
    navState.search = "?redirect_url=/cms";
    renderGated();
    expect(screen.getByTestId("gated-child")).toBeInTheDocument();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("bounces signed in users off /login to the return path", () => {
    authState.isSignedIn = true;
    navState.pathname = "/login";
    navState.search = "?redirect_url=/cms/details";
    renderGated();
    expect(mockedRedirect).toHaveBeenCalledWith("/cms/details");
  });

  it("falls back to /cms for signed in users on /login without a return path", () => {
    authState.isSignedIn = true;
    navState.pathname = "/login";
    renderGated();
    expect(mockedRedirect).toHaveBeenCalledWith("/cms");
  });

  it("rejects protocol-relative return paths", () => {
    authState.isSignedIn = true;
    navState.pathname = "/login";
    navState.search = "?redirect_url=//evil.example";
    renderGated();
    expect(mockedRedirect).toHaveBeenCalledWith("/cms");
  });

  it("rejects backslash return paths that browsers would normalize", () => {
    authState.isSignedIn = true;
    navState.pathname = "/login";
    navState.search = "?redirect_url=%2F%5Cevil.example";
    renderGated();
    expect(mockedRedirect).toHaveBeenCalledWith("/cms");
  });

  it("rejects return paths pointing back at the login page", () => {
    authState.isSignedIn = true;
    navState.pathname = "/login";
    navState.search = "?redirect_url=%2Flogin%2Fother";
    renderGated();
    expect(mockedRedirect).toHaveBeenCalledWith("/cms");
  });

  it("renders children for signed in users on private paths", () => {
    authState.isSignedIn = true;
    authState.orgId = "org_existing";
    renderGated();
    expect(screen.getByTestId("gated-child")).toBeInTheDocument();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("renders the org provision step for signed in users without an org", () => {
    authState.isSignedIn = true;
    authState.orgId = null;
    renderGated();
    expect(
      screen.getByText("What should we call your workspace?"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("gated-child")).not.toBeInTheDocument();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("renders the sign-in page on /login when Clerk is configured", () => {
    navState.pathname = "/login";
    render(<LoginPage />);
    expect(screen.getByTestId("sign-in")).toBeInTheDocument();
  });

  it("explains the missing config on /login when Clerk is not configured", () => {
    authState.configured = false;
    render(<LoginPage />);
    expect(
      screen.getByText("Authentication is not configured"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("sign-in")).not.toBeInTheDocument();
  });
});
