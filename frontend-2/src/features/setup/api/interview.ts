import { apiClient } from "@/shared/api/client";
import type { components, operations } from "@/generated/api-types";

type SuccessStatus = 200 | 201 | 202 | 203 | 204 | 206;

type SuccessContent<Op extends keyof operations> = {
  [Status in keyof operations[Op]["responses"]]: Status extends SuccessStatus
    ? operations[Op]["responses"][Status] extends {
        content: { "application/json": infer Json };
      }
      ? Json
      : never
    : never;
}[keyof operations[Op]["responses"]];

export async function completeSetupInterview(
  setupSessionId: string,
): Promise<SuccessContent<"setup_complete_interview">> {
  const response = await apiClient.POST(
    "/api/v1/setup-sessions/{setup_session_id}/interview/complete",
    {
      params: { path: { setup_session_id: setupSessionId } },
    },
  );
  if (response.error) {
    throw new Error("Failed to complete setup interview");
  }
  return response.data;
}

export async function createSetupGenerationRun(
  setupSessionId: string,
  input: components["schemas"]["GenerationRunCreate"],
): Promise<components["schemas"]["GenerationRunRead"]> {
  const response = await apiClient.POST(
    "/api/v1/setup-sessions/{setup_session_id}/generation-runs",
    {
      params: { path: { setup_session_id: setupSessionId } },
      body: input,
    },
  );
  if (response.error) {
    throw new Error("Failed to start website generation");
  }
  // The generated contract models the response as a list; the API returns the
  // created run. Normalize to the single read used by callers.
  const created = Array.isArray(response.data)
    ? response.data[0]
    : response.data;
  if (!created) {
    throw new Error("Website generation did not return a run");
  }
  return created;
}
