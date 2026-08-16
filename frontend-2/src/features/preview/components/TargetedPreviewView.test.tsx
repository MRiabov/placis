// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { redirectTo } from "@/shared/lib/navigation";
import { previewToken, setClaimStatus } from "@/test/msw/server";
import { TargetedPreviewView } from "./TargetedPreviewView";

vi.mock("@/shared/lib/navigation", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/shared/lib/navigation")>();
  return { ...actual, redirectTo: vi.fn() };
});

vi.mock("./PublicSiteModulePreview", () => ({
  PublicSiteModulePreview: () => (
    <div data-testid="public-site-preview">Website preview</div>
  ),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderPreview(module: "website" | "dashboard" = "website") {
  return render(
    <QueryClientProvider client={queryClient}>
      <TargetedPreviewView module={module} previewToken={previewToken} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  setClaimStatus("checkout_pending");
  vi.clearAllMocks();
  cleanup();
});

describe("TargetedPreviewView", () => {
  it("renders the website preview once the module loads", async () => {
    renderPreview("website");
    expect(
      await screen.findByTestId("public-site-preview"),
    ).toBeInTheDocument();
  });

  it("renders the unsupported state for non-website modules", async () => {
    renderPreview("dashboard");
    expect(
      await screen.findByText(/dashboard.*not available/i),
    ).toBeInTheDocument();
  });

  it("shows the error state when the preview link fails", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TargetedPreviewView module="website" previewToken="bad-token" />
      </QueryClientProvider>,
    );
    expect(
      await screen.findByText(/could not be loaded/i),
    ).toBeInTheDocument();
  });

  it("redirects to the cms website when the claim becomes activated", async () => {
    setClaimStatus("activated");
    window.history.replaceState(
      {},
      "",
      `/preview/${previewToken}/website?claim=success`,
    );
    renderPreview("website");
    await waitFor(() =>
      expect(redirectTo).toHaveBeenCalledWith("/cms/website"),
    );
  });
});
