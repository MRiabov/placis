import { describe, expect, it, vi } from "vitest";
import type { SetupOnboardingAction } from "../model/onboarding";
import { OnboardingStatus, OnboardingStep } from "../model/onboarding";
import {
  confirmSourceCore,
  selectCompanyCore,
  startMapsSetupCore,
} from "./sourcesFlows";

const candidate = {
  company_number: "IE123456",
  confidence: "high",
  country: "IE",
  id: "candidate-1",
  legal_name: "Bellfield Construction Ltd",
  match_reason: "name",
  provider: "cro",
  registry_id: "registry-1",
  registry_name: "CRO",
} as const;

function onboardingDeps() {
  const actions: SetupOnboardingAction[] = [];
  const dispatchOnboarding = (action: SetupOnboardingAction) => {
    actions.push(action);
  };
  const moveToStep = vi.fn();
  const refreshProfile = vi.fn(async () => undefined);
  const resetSessionState = vi.fn();
  const startVoiceInterview = vi.fn(async () => undefined);
  return {
    actions,
    dispatchOnboarding,
    moveToStep,
    refreshProfile,
    resetSessionState,
    startVoiceInterview,
  };
}

describe("selectCompanyCore", () => {
  it("creates a session, records consents, selects the record and moves to review", async () => {
    const deps = onboardingDeps();
    const sessionId = await selectCompanyCore({
      businessName: "Bellfield",
      dispatch: () => undefined,
      dispatchOnboarding: deps.dispatchOnboarding,
      googleMapsUrl: "",
      googlePlaceId: "",
      googlePlacesSessionToken: null,
      moveToStep: deps.moveToStep,
      refreshProfile: deps.refreshProfile,
      researchConsent: true,
      resetSessionState: deps.resetSessionState,
      selectedCandidate: candidate,
      serviceArea: "Dublin",
    });
    expect(sessionId).toBe("setup-session-1");
    expect(deps.moveToStep).toHaveBeenCalledWith(OnboardingStep.Review);
    expect(deps.refreshProfile).toHaveBeenCalledWith("setup-session-1");
    expect(deps.resetSessionState).toHaveBeenCalled();
    const statuses = deps.actions
      .filter((action) => action.type === "status_changed")
      .map((action) => (action as { status: unknown }).status);
    expect(statuses).toContain(OnboardingStatus.Creating);
    expect(statuses[0]).toBe(OnboardingStatus.Creating);
    const consents = deps.actions.filter(
      (action) => action.type === "session_created",
    );
    expect(consents).toHaveLength(1);
  });

  it("runs the google place workflow when a place id is selected", async () => {
    const deps = onboardingDeps();
    const sessionId = await selectCompanyCore({
      businessName: "Bellfield",
      dispatch: () => undefined,
      dispatchOnboarding: deps.dispatchOnboarding,
      googleMapsUrl: "https://maps.google.com/?cid=1",
      googlePlaceId: "google-place-1",
      googlePlacesSessionToken: "maps-token-1",
      moveToStep: deps.moveToStep,
      refreshProfile: deps.refreshProfile,
      researchConsent: true,
      resetSessionState: deps.resetSessionState,
      selectedCandidate: candidate,
      serviceArea: "",
    });
    expect(sessionId).toBe("setup-session-1");
    expect(deps.moveToStep).toHaveBeenCalledWith(OnboardingStep.Review);
  });
});

describe("startMapsSetupCore", () => {
  it("runs the maps workflow, records the session and moves to review", async () => {
    const deps = onboardingDeps();
    const sessionId = await startMapsSetupCore({
      businessName: "Bellfield",
      dispatchOnboarding: deps.dispatchOnboarding,
      googleMapsUrl: "https://maps.google.com/?cid=1",
      googlePlaceId: "google-place-1",
      googlePlacesSessionToken: "maps-token-1",
      moveToStep: deps.moveToStep,
      refreshProfile: deps.refreshProfile,
      researchConsent: false,
      resetSessionState: deps.resetSessionState,
      serviceArea: "Dublin",
    });
    expect(sessionId).toBe("setup-session-1");
    expect(deps.moveToStep).toHaveBeenCalledWith(OnboardingStep.Review);
  });
});

describe("confirmSourceCore", () => {
  it("blocks confirmation until terms are accepted", async () => {
    const deps = onboardingDeps();
    await confirmSourceCore({
      businessName: "Bellfield",
      dispatch: () => undefined,
      dispatchOnboarding: deps.dispatchOnboarding,
      googleMapsSessionToken: "maps-token-1",
      googleMapsUrl: "",
      googlePlaceId: "google-place-1",
      moveToStep: deps.moveToStep,
      refreshProfile: deps.refreshProfile,
      researchConsent: true,
      resetSessionState: deps.resetSessionState,
      selectedCandidate: null,
      serviceArea: "",
      startVoiceInterview: deps.startVoiceInterview,
      termsAccepted: false,
    });
    expect(deps.moveToStep).not.toHaveBeenCalled();
    const errors = deps.actions.filter(
      (action) => action.type === "error_shown",
    );
    expect(errors).toHaveLength(1);
  });

  it("confirms a maps-only selection and starts the voice interview on request", async () => {
    const deps = onboardingDeps();
    await confirmSourceCore({
      businessName: "Bellfield",
      dispatch: () => undefined,
      dispatchOnboarding: deps.dispatchOnboarding,
      googleMapsSessionToken: "maps-token-1",
      googleMapsUrl: "https://maps.google.com/?cid=1",
      googlePlaceId: "google-place-1",
      moveToStep: deps.moveToStep,
      refreshProfile: deps.refreshProfile,
      researchConsent: true,
      resetSessionState: deps.resetSessionState,
      selectedCandidate: null,
      serviceArea: "",
      startVoiceInterview: deps.startVoiceInterview,
      termsAccepted: true,
    });
    expect(deps.moveToStep).toHaveBeenCalledWith(OnboardingStep.Review);
    expect(deps.startVoiceInterview).toHaveBeenCalledWith("setup-session-1");
  });
});
