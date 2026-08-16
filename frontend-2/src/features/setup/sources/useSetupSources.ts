import { useReducer, useState } from "react";

import type {
  CompanyRegistryCandidate,
  GooglePlaceAutocompleteSuggestion,
} from "../api/setup";
import type { OnboardingStep } from "../model/onboarding";
import {
  confirmSourceCore,
  manualChecklistCore,
  runCompanySearchCore,
  startMapsSetupCore,
  websiteImportCore,
} from "./sourcesFlows";
import {
  createGoogleMapsSessionToken,
  initialSourcesState,
  type SourcesState,
  sourcesReducer,
} from "./sourcesModel";
import { useMapsSearchEffect, useRegistrySearchEffect } from "./sourcesSearch";

export type SetupSourcesProps = {
  dispatchOnboarding: (
    action: import("../model/onboarding").SetupOnboardingAction,
  ) => void;
  moveToStep: (step: OnboardingStep) => void;
  refreshProfile: (setupSessionId: string) => Promise<void>;
  researchConsent: boolean;
  resetSessionState: () => void;
  startVoiceInterview: (setupSessionIdOverride?: string) => Promise<void>;
};

type SourcesActionsDeps = SetupSourcesProps & {
  dispatch: (action: import("./sourcesModel").SourcesAction) => void;
  googleMapsSessionToken: string;
  setGoogleMapsSessionToken: (token: string) => void;
  state: SourcesState;
};

export type SetupSources = {
  actions: {
    confirmSource: (options?: { startVoice?: boolean }) => Promise<void>;
    markVoiceFollowUp: () => void;
    resetRunState: () => void;
    runCompanySearch: () => Promise<void>;
    selectGoogleMapsCandidate: (
      candidate: GooglePlaceAutocompleteSuggestion | null,
    ) => void;
    setBusinessName: (value: string) => void;
    setCountry: (value: string) => void;
    setGoogleMapsQuery: (value: string) => void;
    setGoogleMapsUrl: (value: string) => void;
    setGooglePlaceId: (value: string) => void;
    setSelectedRegistryCandidate: (
      candidate: CompanyRegistryCandidate | null,
    ) => void;
    setServiceArea: (value: string) => void;
    setTermsAccepted: (value: boolean) => void;
    setWebsiteUrl: (value: string) => void;
    startManualChecklist: () => Promise<void>;
    startMapsSetup: () => Promise<string | null>;
    startWebsiteImport: () => Promise<void>;
  };
  state: SourcesState;
};

/** Re-platform of useOnboardingSources: sources state machine + async flows. */
export function useSetupSources({
  dispatchOnboarding,
  moveToStep,
  refreshProfile,
  researchConsent,
  resetSessionState,
  startVoiceInterview,
}: SetupSourcesProps): SetupSources {
  const [state, dispatch] = useReducer(
    sourcesReducer,
    undefined,
    initialSourcesState,
  );
  const [googleMapsSessionToken, setGoogleMapsSessionToken] = useState(
    createGoogleMapsSessionToken,
  );

  useRegistrySearchEffect(state, dispatch, dispatchOnboarding);
  useMapsSearchEffect(state, dispatch, googleMapsSessionToken);

  const actions = useSourcesActions({
    dispatch,
    dispatchOnboarding,
    googleMapsSessionToken,
    moveToStep,
    refreshProfile,
    researchConsent,
    resetSessionState,
    setGoogleMapsSessionToken,
    startVoiceInterview,
    state,
  });

  return { actions, state };
}

function useSourcesActions({
  dispatch,
  dispatchOnboarding,
  googleMapsSessionToken,
  moveToStep,
  refreshProfile,
  researchConsent,
  resetSessionState,
  setGoogleMapsSessionToken,
  startVoiceInterview,
  state,
}: SourcesActionsDeps): SetupSources["actions"] {
  const runCompanySearch = () =>
    runCompanySearchCore(state, dispatch, dispatchOnboarding);

  const selectGoogleMapsCandidate = (
    candidate: GooglePlaceAutocompleteSuggestion | null,
  ) => {
    dispatch({ type: "google_maps_candidate_selected", candidate });
    setGoogleMapsSessionToken(createGoogleMapsSessionToken());
  };

  const confirmSource = (options: { startVoice?: boolean } = {}) =>
    confirmSourceCore({
      businessName: state.businessName,
      dispatch,
      dispatchOnboarding,
      googleMapsSessionToken,
      googleMapsUrl: state.googleMapsUrl,
      googlePlaceId: state.googlePlaceId,
      moveToStep,
      refreshProfile,
      researchConsent,
      resetSessionState,
      selectedCandidate: state.selectedRegistryCandidate,
      serviceArea: state.serviceArea,
      startVoiceInterview: options.startVoice
        ? startVoiceInterview
        : () => Promise.resolve(),
      termsAccepted: state.termsAccepted,
    });

  const markVoiceFollowUp = () => {
    dispatchOnboarding({
      type: "notice_shown",
      message:
        "Voice interview is intentionally not faked here. Browser or phone-call handoff needs a dedicated claim/setup route before this path can start.",
    });
  };

  const resetRunState = () => {
    resetSessionState();
    dispatch({ type: "sources_reset" });
  };

  const startWebsiteImport = () =>
    websiteImportCore(
      state.websiteUrl,
      dispatchOnboarding,
      refreshProfile,
      researchConsent,
      resetRunState,
    );

  const startManualChecklist = () =>
    manualChecklistCore(
      dispatchOnboarding,
      refreshProfile,
      researchConsent,
      resetRunState,
    );

  const startMapsSetup = async () => {
    if (!state.googlePlaceId.trim()) {
      dispatchOnboarding({
        type: "error_shown",
        message: "Enter a Google Place ID to use the Maps path.",
      });
      return null;
    }
    resetRunState();
    return startMapsSetupCore({
      businessName: state.businessName,
      dispatchOnboarding,
      googleMapsUrl: state.googleMapsUrl,
      googlePlaceId: state.googlePlaceId,
      googlePlacesSessionToken: googleMapsSessionToken,
      moveToStep,
      refreshProfile,
      researchConsent,
      resetSessionState,
      serviceArea: state.serviceArea,
    });
  };

  return {
    confirmSource,
    markVoiceFollowUp,
    resetRunState,
    runCompanySearch,
    selectGoogleMapsCandidate,
    setBusinessName: (value) =>
      dispatch({ type: "business_name_changed", value }),
    setCountry: (value) => dispatch({ type: "country_changed", value }),
    setGoogleMapsQuery: (value) =>
      dispatch({ type: "google_maps_query_changed", value }),
    setGoogleMapsUrl: (value) =>
      dispatch({ type: "google_maps_url_changed", value }),
    setGooglePlaceId: (value) =>
      dispatch({ type: "google_place_id_changed", value }),
    setSelectedRegistryCandidate: (candidate) =>
      dispatch({ type: "registry_candidate_selected", candidate }),
    setServiceArea: (value) =>
      dispatch({ type: "service_area_changed", value }),
    setTermsAccepted: (value) =>
      dispatch({ type: "terms_accepted_changed", accepted: value }),
    setWebsiteUrl: (value) => dispatch({ type: "website_url_changed", value }),
    startManualChecklist,
    startMapsSetup,
    startWebsiteImport,
  };
}
