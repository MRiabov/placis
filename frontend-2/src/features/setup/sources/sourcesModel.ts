import type {
  CompanyRegistryCandidate,
  CompanyRegistrySearchResult,
  GooglePlaceAutocompleteSuggestion,
  SetupConsentCreate,
} from "../api/setup";

export type MapsLookupStatus =
  | "idle"
  | "searching"
  | "ready"
  | "unavailable"
  | "error";

export type RegistryLookupStatus =
  | CompanyRegistrySearchResult["lookup_status"]
  | "idle"
  | "searching";

export type SourcesState = {
  businessName: string;
  companySelectionReady: boolean;
  country: string;
  googleMapsCandidates: GooglePlaceAutocompleteSuggestion[];
  googleMapsLookupStatus: MapsLookupStatus;
  googleMapsQuery: string;
  googleMapsUrl: string;
  googlePlaceId: string;
  registryLookupStatus: RegistryLookupStatus;
  searchResult: CompanyRegistrySearchResult | null;
  selectedRegistryCandidate: CompanyRegistryCandidate | null;
  serviceArea: string;
  termsAccepted: boolean;
  websiteUrl: string;
};

export function initialSourcesState(): SourcesState {
  return {
    businessName: "",
    companySelectionReady: false,
    country: "IE",
    googleMapsCandidates: [],
    googleMapsLookupStatus: "idle",
    googleMapsQuery: "",
    googleMapsUrl: "",
    googlePlaceId: "",
    registryLookupStatus: "idle",
    searchResult: null,
    selectedRegistryCandidate: null,
    serviceArea: "",
    termsAccepted: false,
    websiteUrl: "",
  };
}

export type SourcesAction =
  | { type: "business_name_changed"; value: string }
  | { type: "country_changed"; value: string }
  | { type: "company_selection_ready_changed"; ready: boolean }
  | {
      type: "google_maps_candidates_received";
      candidates: GooglePlaceAutocompleteSuggestion[];
    }
  | {
      type: "google_maps_candidate_selected";
      candidate: GooglePlaceAutocompleteSuggestion | null;
    }
  | { type: "google_maps_lookup_status_changed"; status: MapsLookupStatus }
  | { type: "google_maps_query_changed"; value: string }
  | { type: "google_maps_url_changed"; value: string }
  | { type: "google_place_id_changed"; value: string }
  | {
      type: "registry_candidate_selected";
      candidate: CompanyRegistryCandidate | null;
    }
  | { type: "registry_lookup_status_changed"; status: RegistryLookupStatus }
  | {
      type: "registry_search_result_received";
      result: CompanyRegistrySearchResult | null;
    }
  | { type: "sources_reset" }
  | { type: "service_area_changed"; value: string }
  | { type: "terms_accepted_changed"; accepted: boolean }
  | { type: "website_url_changed"; value: string };

export function sourcesReducer(
  state: SourcesState,
  action: SourcesAction,
): SourcesState {
  switch (action.type) {
    case "business_name_changed":
      return { ...state, businessName: action.value };
    case "country_changed":
      return {
        ...state,
        companySelectionReady: false,
        country: action.value,
        googleMapsCandidates: [],
        googleMapsLookupStatus: "idle",
        googleMapsQuery: "",
        googleMapsUrl: "",
        googlePlaceId: "",
        registryLookupStatus: "idle",
        searchResult: null,
        selectedRegistryCandidate: null,
      };
    case "company_selection_ready_changed":
      return { ...state, companySelectionReady: action.ready };
    case "google_maps_candidates_received":
      return { ...state, googleMapsCandidates: action.candidates };
    case "google_maps_candidate_selected":
      return action.candidate
        ? {
            ...state,
            googleMapsCandidates: [],
            googleMapsQuery: action.candidate.display_name,
            googleMapsUrl: action.candidate.google_maps_url ?? "",
            googlePlaceId: action.candidate.google_place_id,
          }
        : { ...state, googleMapsUrl: "", googlePlaceId: "" };
    case "google_maps_lookup_status_changed":
      return { ...state, googleMapsLookupStatus: action.status };
    case "google_maps_query_changed":
      return action.value !== state.googleMapsQuery
        ? {
            ...state,
            googleMapsQuery: action.value,
            googleMapsUrl: state.googlePlaceId ? "" : state.googleMapsUrl,
            googlePlaceId: "",
          }
        : state;
    case "google_maps_url_changed":
      return { ...state, googleMapsUrl: action.value };
    case "google_place_id_changed":
      return { ...state, googlePlaceId: action.value };
    case "registry_candidate_selected":
      return { ...state, selectedRegistryCandidate: action.candidate };
    case "registry_lookup_status_changed":
      return { ...state, registryLookupStatus: action.status };
    case "registry_search_result_received":
      return { ...state, searchResult: action.result };
    case "sources_reset":
      return initialSourcesState();
    case "service_area_changed":
      return { ...state, serviceArea: action.value };
    case "terms_accepted_changed":
      return { ...state, termsAccepted: action.accepted };
    case "website_url_changed":
      return { ...state, websiteUrl: action.value };
  }
}

export function createGoogleMapsSessionToken(): string {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `maps-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function onboardingResearchConsentPayload(): SetupConsentCreate {
  return {
    purpose: "business_research",
    granted: true,
    channel: "contractor_onboarding",
    consent_text:
      "I agree that Placis can collect public information about this business to prepare the website preview.",
    consent_text_version: "contractor-onboarding-v1",
  };
}

export function onboardingConsentPayloads(
  researchConsent: boolean,
): SetupConsentCreate[] {
  const consents: SetupConsentCreate[] = [
    {
      purpose: "transcription",
      granted: true,
      channel: "contractor_onboarding",
      consent_text:
        "I agree that Placis can transcribe this setup conversation for the website setup.",
      consent_text_version: "contractor-onboarding-v1",
    },
  ];
  if (researchConsent) {
    consents.push(onboardingResearchConsentPayload());
  }
  return consents;
}
