// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";

import { PayToClaimStripFixture } from "./PayToClaimStrip";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function renderStrip(authState: {
  configured: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <PayToClaimStripFixture authState={authState} />
    </QueryClientProvider>,
  );
}

afterEach(() => cleanup());

describe("PayToClaimStrip", () => {
  it("gates checkout behind sign-in", () => {
    renderStrip({ configured: true, isLoaded: true, isSignedIn: false });
    expect(
      screen.getByText("Pay to claim this workspace"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create checkout/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the checkout actions when signed in", () => {
    renderStrip({ configured: true, isLoaded: true, isSignedIn: true });
    expect(
      screen.getByRole("button", { name: /create checkout/i }),
    ).toBeInTheDocument();
  });
});
