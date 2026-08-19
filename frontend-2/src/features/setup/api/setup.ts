import { apiClient, apiBaseUrl } from "@/shared/api/client";
import { pick } from "../voice/valueParsers";
import type { components, operations } from "@/generated/api-types";

export type SetupRequestedModule = components["schemas"]["ProductModule"];
export type GooglePlaceAutocompleteSuggestion =
  components["schemas"]["GooglePlaceAutocompleteSuggestion"];
export type CompanyRegistrySearchResult =
  components["schemas"]["CompanyRegistrySearchResult"];
export type SetupImportCreate = components["schemas"]["SetupImportCreate"];
export type SetupConsentCreate = components["schemas"]["ConsentCreate"];
export type SetupChecklistRow = components["schemas"]["SetupProfileChecklistRow"];
export type PreviewPackageRead = components["schemas"]["PreviewPackageRead"];
export type SetupTextInterviewSubmissionCreate =
  components["schemas"]["SetupTextInterviewSubmissionCreate-Input"];
export type SetupTextInterviewAccreditationCreate =
  components["schemas"]["SetupTextInterviewAccreditationCreate"];
export type CompanyRegistryCandidate =
  components["schemas"]["CompanyRegistryCandidate-Output"];

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

type CompanyRegistrySearchInput = Partial<
  components["schemas"]["CompanyRegistrySearchRequest"]
> &
  Pick<components["schemas"]["CompanyRegistrySearchRequest"], "query">;

type CompanySelectionInput = {
  create_preview?: boolean;
  candidate: components["schemas"]["CompanyRegistryCandidate-Output"];
  requested_modules?: SetupRequestedModule[];
  run_generation?: boolean;
  service_area?: string | null;
  trade?: string | null;
  trading_name?: string | null;
};

export type SetupGooglePlaceWorkflowCreateInput = Partial<
  components["schemas"]["SetupGooglePlaceWorkflowCreate"]
> &
  Pick<components["schemas"]["SetupGooglePlaceWorkflowCreate"], "google_place_id">;

export async function createGooglePlaceSetupWorkflow(
  input: SetupGooglePlaceWorkflowCreateInput,
): Promise<SuccessContent<"setup_create_google_place_workflow">> {
  const response = await apiClient.POST(
    "/api/v1/setup-sessions/from-google-place",
    {
      body: {
        create_preview: true,
        locale: "en-IE",
        refinement_mode: "llm_refine_later",
        requested_modules: ["website"],
        run_generation: true,
        source: "website_google_place",
        ...input,
        consents: input.consents ?? [
          {
            purpose: "business_research",
            granted: true,
            channel: "website_setup",
            consent_text:
              "I consent to business research for this generated preview.",
            consent_text_version: "website-demo-v1",
          },
        ],
      },
    },
  );
  if (response.error) {
    throw new Error("Failed to start setup workflow");
  }
  return response.data;
}

export type SetupGooglePlacesAutocompleteInput = {
  country_code?: string | null;
  included_primary_types?: string[];
  input: string;
  language_code?: string;
  limit?: number;
  session_token?: string | null;
};

export async function autocompleteGooglePlaces(
  input: SetupGooglePlacesAutocompleteInput,
): Promise<SuccessContent<"setup_autocomplete_google_places">> {
  const response = await apiClient.GET(
    "/api/v1/setup-sessions/google-places/autocomplete",
    {
      params: {
        query: {
          input: input.input,
          language_code: input.language_code ?? "en",
          limit: input.limit ?? 5,
          ...(input.country_code !== undefined
            ? { country_code: input.country_code }
            : {}),
          ...(input.included_primary_types !== undefined
            ? { included_primary_types: input.included_primary_types }
            : {}),
          ...(input.session_token !== undefined
            ? { session_token: input.session_token }
            : {}),
        },
      },
    },
  );
  if (response.error) {
    throw new Error("Failed to search Google Maps listings");
  }
  return response.data;
}

export function setupEventsStreamUrl(setupSessionId: string): string {
  const url = new URL(
    `/api/v1/setup-sessions/${encodeURIComponent(setupSessionId)}/events/stream`,
    apiBaseUrl,
  );
  url.searchParams.set("heartbeat_seconds", "1");
  url.searchParams.set("poll_seconds", "0.25");
  return url.toString();
}

export type SetupRequestOptions = {
  signal?: AbortSignal;
};

export async function searchCompanyRegistry(
  input: CompanyRegistrySearchInput,
  options: SetupRequestOptions = {},
): Promise<SuccessContent<"setup_search_company_registry">> {
  const response = await apiClient.POST(
    "/api/v1/setup-sessions/company-registry/search",
    {
      body: {
        country: "IE",
        limit: 8,
        ...input,
      },
      ...(options.signal ? { signal: options.signal } : {}),
    },
  );
  if (response.error) {
    throw new Error("Failed to search company registry");
  }
  return response.data;
}

export async function createGuidedSetupSession(): Promise<
  SuccessContent<"setup_create_session">
> {
  const response = await apiClient.POST("/api/v1/setup-sessions", {
    body: {
      locale: "en-IE",
      requested_modules: ["website"],
      source: "guided_onboarding",
    },
  });
  if (response.error) {
    throw new Error("Failed to create guided setup session");
  }
  return response.data;
}

export async function selectCompanyRegistryRecord(
  setupSessionId: string,
  input: CompanySelectionInput,
): Promise<SuccessContent<"setup_select_company_registry_record">> {
  const response = await apiClient.POST(
    "/api/v1/setup-sessions/{setup_session_id}/company-selection",
    {
      params: { path: { setup_session_id: setupSessionId } },
      body: {
        create_preview: true,
        run_generation: true,
        ...input,
      },
    },
  );
  if (response.error) {
    throw new Error("Failed to select company registry record");
  }
  return response.data;
}

export async function getSetupProfile(
  setupSessionId: string,
): Promise<SuccessContent<"setup_get_profile">> {
  const response = await apiClient.GET(
    "/api/v1/setup-sessions/{setup_session_id}/profile",
    {
      params: { path: { setup_session_id: setupSessionId } },
    },
  );
  if (response.error) {
    throw new Error("Failed to load setup profile");
  }
  return response.data;
}

export async function recordSetupProfileFacts(
  setupSessionId: string,
  input: components["schemas"]["SetupProfileFactsCreate"],
): Promise<SuccessContent<"setup_record_profile_facts">> {
  const response = await apiClient.POST(
    "/api/v1/setup-sessions/{setup_session_id}/profile/facts",
    {
      params: { path: { setup_session_id: setupSessionId } },
      body: input,
    },
  );
  if (response.error) {
    throw new Error("Failed to save setup profile facts");
  }
  return response.data;
}

export async function createSetupTextInterviewSubmission(
  setupSessionId: string,
  input: SetupTextInterviewSubmissionCreate,
): Promise<SuccessContent<"setup_create_text_interview_submission">> {
  const response = await apiClient.POST(
    "/api/v1/setup-sessions/{setup_session_id}/text-interview/submissions",
    {
      params: { path: { setup_session_id: setupSessionId } },
      body: input,
    },
  );
  if (response.error) {
    throw new Error("Failed to save text interview form");
  }
  return response.data;
}

export async function saveSetupTextInterviewDraft(
  setupSessionId: string,
  input: SetupTextInterviewSubmissionCreate,
): Promise<SuccessContent<"setup_save_text_interview_draft">> {
  const response = await apiClient.PUT(
    "/api/v1/setup-sessions/{setup_session_id}/text-interview/draft",
    {
      params: { path: { setup_session_id: setupSessionId } },
      body: input,
    },
  );
  if (response.error) {
    throw new Error("Failed to autosave text interview form");
  }
  return response.data;
}

export async function getSetupProfileChecklist(
  setupSessionId: string,
): Promise<SuccessContent<"setup_get_profile_checklist">> {
  const response = await apiClient.GET(
    "/api/v1/setup-sessions/{setup_session_id}/profile/checklist",
    {
      params: { path: { setup_session_id: setupSessionId } },
    },
  );
  if (response.error) {
    throw new Error("Failed to load setup checklist");
  }
  return response.data;
}

export function setupApiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  const detail = "detail" in error ? pick(error, "detail") : undefined;
  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }
  if (detail && typeof detail === "object" && "message" in detail) {
    const message = pick(detail, "message");
    return typeof message === "string" && message.trim()
      ? message.trim()
      : null;
  }
  return null;
}

export function setupApiErrorToolResultMarkdown(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("detail" in error)) {
    return null;
  }
  const detail = pick(error, "detail");
  if (
    detail &&
    typeof detail === "object" &&
    "tool_result_markdown" in detail
  ) {
    const markdown = pick(detail, "tool_result_markdown");
    return typeof markdown === "string" && markdown.trim()
      ? markdown.trim()
      : null;
  }
  return null;
}

export async function createSetupSourceImport(
  setupSessionId: string,
  input: SetupImportCreate,
): Promise<SuccessContent<"setup_create_import">> {
  const response = await apiClient.POST(
    "/api/v1/setup-sessions/{setup_session_id}/imports",
    {
      params: { path: { setup_session_id: setupSessionId } },
      body: input,
    },
  );
  if (response.error) {
    throw new Error("Failed to import the business source");
  }
  return response.data;
}

export async function recordSetupConsents(
  setupSessionId: string,
  consents: SetupConsentCreate[],
): Promise<SuccessContent<"setup_create_consent">[]> {
  const responses: SuccessContent<"setup_create_consent">[] = [];
  for (const consent of consents) {
    const response = await apiClient.POST(
      "/api/v1/setup-sessions/{setup_session_id}/consents",
      {
        params: { path: { setup_session_id: setupSessionId } },
        body: consent,
      },
    );
    if (response.error) {
      throw new Error("Failed to record setup consent");
    }
    responses.push(response.data);
  }
  return responses;
}
