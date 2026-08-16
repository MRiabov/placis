// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const clerkState = vi.hoisted(() => ({
  setActive: vi.fn(),
}));

vi.mock("@clerk/react", () => ({
  useUser: () => ({
    user: { firstName: "Jane", lastName: "Doe", fullName: "Jane Doe" },
  }),
  useClerk: () => ({ setActive: clerkState.setActive }),
}));

vi.mock("@/shared/api/org", () => ({
  createMyOrganization: vi.fn(async (name: string) => ({
    organization_id: "org_provisioned_123",
    name,
  })),
}));

import { createMyOrganization } from "@/shared/api/org";
import { OrgProvisionStep } from "./OrgProvisionStep";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OrgProvisionStep", () => {
  it("prefills the workspace name from the Clerk profile name", () => {
    render(<OrgProvisionStep />);

    expect(screen.getByLabelText("Your name")).toHaveValue("Jane Doe");
  });

  it("provisions the org and activates it so tokens carry the org claim", async () => {
    render(<OrgProvisionStep />);
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Maksym's Organization" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(createMyOrganization).toHaveBeenCalledWith("Maksym's Organization");
    });
    await waitFor(() => {
      expect(clerkState.setActive).toHaveBeenCalledWith({
        organization: "org_provisioned_123",
      });
    });
  });
});
