// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("../api/cms", () => ({
  getEditorBusinessProfile: vi.fn(),
  listEditorAssets: vi.fn(),
  updateEditorBusinessProfile: vi.fn(),
}));

import {
  getEditorBusinessProfile,
  listEditorAssets,
  updateEditorBusinessProfile,
} from "../api/cms";
import type { CmsBusinessProfile, CmsMediaAsset } from "../api/cms";
import { DetailsView } from "../views/DetailsView";

const profileFixture = {
  business_location: "Unit 4, Waterford Business Park",
  business_name: "Bellfield Construction",
  company_number: "123456",
  description: "Extensions and refurbishment across Waterford.",
  email: "hello@bellfield.example",
  established_year: 2016,
  featured_services: ["Extensions", "Renovations"],
  id: "profile-bellfield",
  legal_name: "Bellfield Construction Ltd",
  logo_asset_id: "asset-logo",
  logo_url: "https://cdn.example/logo.png",
  opening_hours: [
    {
      closes_at: "17:30",
      day: "monday" as const,
      is_closed: false,
      note: null,
      opens_at: "08:00",
    },
  ],
  phone: "+353 87 998 2864",
  registered_office: "Unit 4, Waterford Business Park",
  service_area: ["Waterford"],
  tenant_id: "tenant-bellfield",
  trade: "Construction",
  updated_at: "2026-07-05T12:00:00Z",
  vat_number: null,
  website_url: "https://bellfield.example",
} satisfies CmsBusinessProfile;

const assetsFixture = [
  {
    alt_text: "Bellfield Construction logo",
    asset_type: "logo",
    can_remove: true,
    can_replace: true,
    id: "asset-logo",
    preview_url: "https://cdn.example/logo.png",
    review_status: "approved",
    source: "upload",
    source_url: "https://cdn.example/logo.png",
    status: "ready",
    tenant_slug: "bellfield",
  },
] satisfies CmsMediaAsset[];

const updatedProfileFixture = {
  ...profileFixture,
  phone: "+353 1 234 5678",
};

const mockedGetProfile = vi.mocked(getEditorBusinessProfile);
const mockedListAssets = vi.mocked(listEditorAssets);
const mockedUpdateProfile = vi.mocked(updateEditorBusinessProfile);

function renderDetailsView(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  render(<DetailsView />, { wrapper: Wrapper });
}

describe("DetailsView", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("loads the profile and assets into the form", async () => {
    mockedGetProfile.mockResolvedValue(profileFixture);
    mockedListAssets.mockResolvedValue(assetsFixture);
    mockedUpdateProfile.mockResolvedValue(updatedProfileFixture);

    renderDetailsView();

    const nameInput = await screen.findByDisplayValue(
      "Bellfield Construction",
      {},
      { timeout: 5000 },
    );
    expect(nameInput).toHaveValue("Bellfield Construction");
    expect(screen.getByDisplayValue("+353 87 998 2864")).toBeInTheDocument();
    expect(screen.getByDisplayValue("hello@bellfield.example")).toBeInTheDocument();
    expect(screen.getByLabelText("Featured services")).toHaveValue(
      "Extensions\nRenovations",
    );
    expect(screen.getByDisplayValue("08:00")).toBeInTheDocument();
    expect(
      screen.getByText("Bellfield Construction logo"),
    ).toBeInTheDocument();
    expect(screen.getByText("Profile active")).toBeInTheDocument();
  });

  it("sends a typed patch when the user edits and saves", async () => {
    mockedGetProfile.mockResolvedValue(profileFixture);
    mockedListAssets.mockResolvedValue(assetsFixture);
    mockedUpdateProfile.mockResolvedValue(updatedProfileFixture);

    renderDetailsView();

    const phoneInput = await screen.findByDisplayValue(
      "+353 87 998 2864",
      {},
      { timeout: 5000 },
    );
    fireEvent.change(phoneInput, {
      target: { value: "+353 1 234 5678" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save details" }));

    await waitFor(() => expect(mockedUpdateProfile).toHaveBeenCalledTimes(1));
    const patch = mockedUpdateProfile.mock.calls[0]?.[0];
    expect(patch).toMatchObject({
      business_name: "Bellfield Construction",
      phone: "+353 1 234 5678",
      email: "hello@bellfield.example",
      established_year: 2016,
      featured_services: ["Extensions", "Renovations"],
    });
  });

  it("surfaces load failures in the error banner", async () => {
    mockedGetProfile.mockRejectedValue(new Error("Profile load failed"));
    mockedListAssets.mockResolvedValue([]);
    mockedUpdateProfile.mockResolvedValue(profileFixture);

    renderDetailsView();

    expect(
      await screen.findByText("Profile load failed", {}, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});
