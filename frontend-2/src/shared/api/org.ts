import { apiClient } from "./client";

export type MyOrganization = {
  organization_id: string;
  name: string;
};

function apiError(error: unknown, fallback: string): Error {
  if (error && typeof error === "object" && "detail" in error) {
    const detail = (error as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail) {
      return new Error(detail);
    }
  }
  return new Error(fallback);
}

/** Provision the signed-in user's Clerk organization (tenant == org 1-1).
 *  The backend calls Clerk's createOrganization; the frontend must then call
 *  clerk.setActive({ organization }) so session tokens carry the org claim. */
export async function createMyOrganization(name: string): Promise<MyOrganization> {
  const response = await apiClient.POST("/api/v1/me/organization", {
    body: { name },
  });
  if (response.error) {
    throw apiError(response.error, "Failed to create your organization.");
  }
  return response.data;
}
