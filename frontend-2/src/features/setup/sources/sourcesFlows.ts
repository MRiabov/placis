import {
  type CompanyRegistryCandidate,
  createGooglePlaceSetupWorkflow,
  createGuidedSetupSession,
  createSetupSourceImport,
  recordSetupConsents,
  searchCompanyRegistry,
  selectCompanyRegistryRecord,
} from "../api/setup";
import type { SetupOnboardingAction } from "../model/onboarding";
import { OnboardingStatus, OnboardingStep } from "../model/onboarding";
import { storeOnboardingResume } from "../model/resume";
import type { SourcesAction, SourcesState } from "./sourcesModel";
import {
  onboardingConsentPayloads,
  onboardingResearchConsentPayload,
} from "./sourcesModel";

export type SourcesFlowDeps = {
  businessName: string;
  dispatchOnboarding: (action: SetupOnboardingAction) => void;
  googleMapsUrl: string;
  googlePlaceId: string;
  googlePlacesSessionToken: string | null;
  moveToStep: (step: OnboardingStep) => void;
  refreshProfile: (setupSessionId: string) => Promise<void>;
  researchConsent: boolean;
  resetSessionState: () => void;
  serviceArea: string;
};

export async function selectCompanyCore(
  deps: SourcesFlowDeps & {
    dispatch: (action: SourcesAction) => void;
    selectedCandidate: CompanyRegistryCandidate;
  },
): Promise<string | null> {
  const {
    businessName,
    dispatch,
    dispatchOnboarding,
    googleMapsUrl,
    googlePlaceId,
    googlePlacesSessionToken,
    moveToStep,
    refreshProfile,
    researchConsent,
    resetSessionState,
    selectedCandidate,
    serviceArea,
  } = deps;
  dispatchOnboarding({
    type: "status_changed",
    status: OnboardingStatus.Creating,
  });
  dispatchOnboarding({ type: "error_shown", message: null });
  dispatchOnboarding({ type: "notice_shown", message: null });
  resetSessionState();
  dispatch({ type: "sources_reset" });
  try {
    const setupSessionId = await createSessionWithConsents(
      dispatchOnboarding,
      researchConsent,
    );
    const selectedGooglePlaceId = googlePlaceId.trim();
    await selectCompanyRegistryRecord(setupSessionId, {
      candidate: selectedCandidate,
      create_preview: false,
      run_generation: false,
      service_area: serviceArea.trim() || null,
      trade: null,
      trading_name: businessName.trim() || null,
    });
    dispatch({ type: "company_selection_ready_changed", ready: true });
    if (selectedGooglePlaceId) {
      await createGooglePlaceSetupWorkflow({
        consents: researchConsent ? [onboardingResearchConsentPayload()] : [],
        create_preview: false,
        google_maps_url: googleMapsUrl.trim() || null,
        google_place_id: selectedGooglePlaceId,
        google_places_session_token: googlePlacesSessionToken,
        location: serviceArea.trim() || null,
        run_generation: false,
        selected_business_name: businessName.trim() || null,
        setup_session_id: setupSessionId,
        trade: null,
      });
    } else if (googleMapsUrl.trim()) {
      await createSetupSourceImport(setupSessionId, {
        notes: "Google Maps listing selected during onboarding.",
        source_type: "google_profile",
        source_url: googleMapsUrl.trim(),
      });
    }
    await refreshProfile(setupSessionId);
    moveToStep(OnboardingStep.Review);
    return setupSessionId;
  } catch (caught) {
    dispatchOnboarding({
      type: "error_shown",
      message:
        caught instanceof Error
          ? caught.message
          : "Failed to start guided setup.",
    });
    dispatchOnboarding({
      type: "status_changed",
      status: OnboardingStatus.Error,
    });
    return null;
  }
}

export async function startMapsSetupCore(
  deps: SourcesFlowDeps,
): Promise<string | null> {
  const {
    businessName,
    dispatchOnboarding,
    googleMapsUrl,
    googlePlaceId,
    googlePlacesSessionToken,
    moveToStep,
    refreshProfile,
    researchConsent,
    resetSessionState,
    serviceArea,
  } = deps;
  resetSessionState();
  dispatchOnboarding({
    type: "status_changed",
    status: OnboardingStatus.Creating,
  });
  try {
    const workflow = await createGooglePlaceSetupWorkflow({
      google_maps_url: googleMapsUrl.trim() || null,
      google_place_id: googlePlaceId.trim(),
      google_places_session_token: googlePlacesSessionToken,
      location: serviceArea.trim() || null,
      create_preview: false,
      run_generation: false,
      selected_business_name: businessName.trim() || null,
      trade: null,
      consents: researchConsent ? [onboardingResearchConsentPayload()] : [],
    });
    const workflowSessionId = workflow.setup_session?.id;
    if (!workflowSessionId) {
      throw new Error("Setup session did not include an id.");
    }
    dispatchOnboarding({
      type: "session_created",
      setupSessionId: workflowSessionId,
    });
    storeOnboardingResume(workflowSessionId, OnboardingStep.Identify);
    await refreshProfile(workflowSessionId);
    moveToStep(OnboardingStep.Review);
    return workflowSessionId;
  } catch (caught) {
    dispatchOnboarding({
      type: "error_shown",
      message:
        caught instanceof Error ? caught.message : "Google Maps setup failed.",
    });
    dispatchOnboarding({
      type: "status_changed",
      status: OnboardingStatus.Error,
    });
    return null;
  }
}

async function createSessionWithConsents(
  dispatchOnboarding: (action: SetupOnboardingAction) => void,
  researchConsent: boolean,
): Promise<string> {
  const session = await createGuidedSetupSession();
  const setupSessionId = String(session.id);
  dispatchOnboarding({ type: "session_created", setupSessionId });
  storeOnboardingResume(setupSessionId, OnboardingStep.Identify);
  await recordSetupConsents(
    setupSessionId,
    onboardingConsentPayloads(researchConsent),
  );
  return setupSessionId;
}

function errorMessage(caught: unknown, fallback: string): string {
  return caught instanceof Error ? caught.message : fallback;
}

export async function runCompanySearchCore(
  state: SourcesState,
  dispatch: (action: SourcesAction) => void,
  dispatchOnboarding: (action: SetupOnboardingAction) => void,
): Promise<void> {
  const query = state.businessName.trim();
  if (!query) {
    dispatchOnboarding({
      type: "error_shown",
      message: "Enter a business or corporate name first.",
    });
    return;
  }
  dispatchOnboarding({
    type: "status_changed",
    status: OnboardingStatus.Searching,
  });
  try {
    const lookupResult = await searchCompanyRegistry({
      country: state.country,
      limit: 8,
      query,
      service_area: state.serviceArea.trim() || null,
      trade: null,
    });
    dispatch({ type: "registry_search_result_received", result: lookupResult });
    dispatch({
      type: "registry_lookup_status_changed",
      status: lookupResult.lookup_status,
    });
    dispatchOnboarding({
      type: "status_changed",
      status: OnboardingStatus.Idle,
    });
    if (lookupResult.lookup_status === "disabled") {
      dispatchOnboarding({
        type: "notice_shown",
        message: "Company lookup is not configured in this environment.",
      });
    } else if (lookupResult.lookup_status === "error") {
      dispatchOnboarding({
        type: "error_shown",
        message: lookupResult.errors?.[0] ?? "Company lookup failed.",
      });
      dispatchOnboarding({
        type: "status_changed",
        status: OnboardingStatus.Error,
      });
    } else if (!lookupResult.candidates?.length) {
      dispatchOnboarding({
        type: "notice_shown",
        message: "No registry matches returned. Try the legal company name.",
      });
    }
  } catch (caught) {
    dispatchOnboarding({
      type: "error_shown",
      message: errorMessage(caught, "Lookup failed."),
    });
    dispatchOnboarding({
      type: "status_changed",
      status: OnboardingStatus.Error,
    });
    dispatch({ type: "registry_lookup_status_changed", status: "error" });
  }
}

export async function websiteImportCore(
  websiteUrl: string,
  dispatchOnboarding: (action: SetupOnboardingAction) => void,
  refreshProfile: (setupSessionId: string) => Promise<void>,
  researchConsent: boolean,
  resetRunState: () => void,
): Promise<void> {
  const trimmedUrl = websiteUrl.trim();
  if (!trimmedUrl) {
    dispatchOnboarding({
      type: "error_shown",
      message: "Enter a website URL first.",
    });
    return;
  }
  resetRunState();
  dispatchOnboarding({
    type: "status_changed",
    status: OnboardingStatus.Creating,
  });
  try {
    const setupSessionId = await createSessionWithConsents(
      dispatchOnboarding,
      researchConsent,
    );
    await createSetupSourceImport(setupSessionId, {
      notes: "Contractor onboarding website URL import.",
      source_type: "website",
      source_url: trimmedUrl,
    });
    dispatchOnboarding({
      type: "notice_shown",
      message:
        "Website URL captured. Extraction and checklist editing remain backend follow-up work.",
    });
    await refreshProfile(setupSessionId);
  } catch (caught) {
    dispatchOnboarding({
      type: "error_shown",
      message: errorMessage(caught, "Website import failed."),
    });
    dispatchOnboarding({
      type: "status_changed",
      status: OnboardingStatus.Error,
    });
  }
}

export async function manualChecklistCore(
  dispatchOnboarding: (action: SetupOnboardingAction) => void,
  refreshProfile: (setupSessionId: string) => Promise<void>,
  researchConsent: boolean,
  resetRunState: () => void,
): Promise<void> {
  resetRunState();
  dispatchOnboarding({
    type: "status_changed",
    status: OnboardingStatus.Creating,
  });
  try {
    const setupSessionId = await createSessionWithConsents(
      dispatchOnboarding,
      researchConsent,
    );
    dispatchOnboarding({
      type: "notice_shown",
      message:
        "Blank checklist created. Field editing endpoints are a follow-up, so rows are review-only for now.",
    });
    await refreshProfile(setupSessionId);
  } catch (caught) {
    dispatchOnboarding({
      type: "error_shown",
      message: errorMessage(caught, "Failed to create manual checklist."),
    });
    dispatchOnboarding({
      type: "status_changed",
      status: OnboardingStatus.Error,
    });
  }
}

export type ConfirmSourceCoreProps = {
  businessName: string;
  dispatch: (action: SourcesAction) => void;
  dispatchOnboarding: (action: SetupOnboardingAction) => void;
  googleMapsSessionToken: string;
  googleMapsUrl: string;
  googlePlaceId: string;
  moveToStep: (step: OnboardingStep) => void;
  refreshProfile: (setupSessionId: string) => Promise<void>;
  researchConsent: boolean;
  resetSessionState: () => void;
  selectedCandidate: CompanyRegistryCandidate | null;
  serviceArea: string;
  startVoiceInterview: (setupSessionIdOverride?: string) => Promise<void>;
  termsAccepted: boolean;
};

export async function confirmSourceCore(
  props: ConfirmSourceCoreProps,
): Promise<void> {
  if (!props.termsAccepted) {
    props.dispatchOnboarding({
      type: "error_shown",
      message: "Confirm that Placis can collect public business information.",
    });
    return;
  }
  let confirmedSetupSessionId: string | null = null;
  if (props.selectedCandidate) {
    confirmedSetupSessionId = await selectCompanyCore({
      businessName: props.businessName,
      dispatch: props.dispatch,
      dispatchOnboarding: props.dispatchOnboarding,
      googleMapsUrl: props.googleMapsUrl,
      googlePlaceId: props.googlePlaceId,
      googlePlacesSessionToken: null,
      moveToStep: props.moveToStep,
      refreshProfile: props.refreshProfile,
      researchConsent: props.researchConsent,
      resetSessionState: props.resetSessionState,
      selectedCandidate: props.selectedCandidate,
      serviceArea: props.serviceArea,
    });
  } else if (props.googlePlaceId.trim()) {
    confirmedSetupSessionId = await startMapsSetupCore({
      businessName: props.businessName,
      dispatchOnboarding: props.dispatchOnboarding,
      googleMapsUrl: props.googleMapsUrl,
      googlePlaceId: props.googlePlaceId,
      googlePlacesSessionToken: null,
      moveToStep: props.moveToStep,
      refreshProfile: props.refreshProfile,
      researchConsent: props.researchConsent,
      resetSessionState: props.resetSessionState,
      serviceArea: props.serviceArea,
    });
  } else {
    props.dispatchOnboarding({
      type: "error_shown",
      message:
        "Select a company registry match, a Google Maps listing, or both.",
    });
    return;
  }
  if (props.startVoiceInterview && confirmedSetupSessionId) {
    await props.startVoiceInterview(confirmedSetupSessionId);
  }
}
