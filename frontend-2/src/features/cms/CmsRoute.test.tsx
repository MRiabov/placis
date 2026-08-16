// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const sessionState = vi.hoisted(() => ({
  session: null as {
    user: { id: string; name: string };
    platform_role: string | null;
    tenant: { slug: string; status: "active" | "draft" } | null;
  } | null,
  isPending: false,
}));

vi.mock("@/shared/lib/navigation", () => ({
  redirectTo: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/cms" }),
  useNavigate: () => vi.fn(),
}));

vi.mock("./routing", () => ({
  cmsViewForPath: () => "dashboard",
  cmsPathForView: (view: string) => (view === "dashboard" ? "/cms" : `/cms/${view}`),
}));

vi.mock("./queries", () => ({
  useCmsSession: () => ({
    data: sessionState.session,
    isPending: sessionState.isPending,
  }),
  useCmsBusinessProfile: () => ({ data: undefined, isPending: true }),
}));

import { redirectTo } from "@/shared/lib/navigation";
import { CmsRoute } from "./CmsRoute";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CmsRoute tenant gate", () => {
  it("redirects to /onboarding when the session has no tenant", () => {
    sessionState.session = {
      user: { id: "local_user", name: "Local User" },
      platform_role: "platform_admin",
      tenant: null,
    };
    sessionState.isPending = false;

    render(<CmsRoute />);

    expect(redirectTo).toHaveBeenCalledTimes(1);
    expect(redirectTo).toHaveBeenCalledWith("/onboarding");
  });

  it("redirects to /onboarding when the tenant is not active yet (not paid)", () => {
    sessionState.session = {
      user: { id: "local_user", name: "Local User" },
      platform_role: "platform_admin",
      tenant: { slug: "bellfield", status: "draft" },
    };
    sessionState.isPending = false;

    render(<CmsRoute />);

    expect(redirectTo).toHaveBeenCalledTimes(1);
    expect(redirectTo).toHaveBeenCalledWith("/onboarding");
  });

  it("renders without redirecting when the session has an active tenant", () => {
    sessionState.session = {
      user: { id: "local_user", name: "Local User" },
      platform_role: "platform_admin",
      tenant: { slug: "bellfield", status: "active" },
    };
    sessionState.isPending = false;

    const { container } = render(<CmsRoute />);

    expect(redirectTo).not.toHaveBeenCalled();
    expect(container.querySelector(".cms-app")).not.toBeNull();
  });

  it("stays on the busy placeholder while the session is pending", () => {
    sessionState.session = null;
    sessionState.isPending = true;

    const { container } = render(<CmsRoute />);

    expect(redirectTo).not.toHaveBeenCalled();
    expect(
      container.querySelector(".cms-app[aria-busy='true']"),
    ).not.toBeNull();
  });
});
