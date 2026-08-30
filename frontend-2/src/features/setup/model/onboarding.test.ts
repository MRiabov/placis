import { describe, expect, it } from "vitest";

import { setupProfileFixture } from "@/test/fixtures/setupProfile";
import {
  InterviewMode,
  initialState,
  OnboardingStatus,
  OnboardingStep,
  onboardingReducer,
  type SetupOnboardingState,
  StreamState,
} from "./onboarding";
import { restoredStepForProfile } from "./resume";

const progressEvent = {
  event_type: "setup.progressive_preresearch_profile_ingested",
  id: "progress-1",
  payload: { field_path: "contact.phone" },
  setup_session_id: "setup-session-1",
};

function withSession(state: SetupOnboardingState): SetupOnboardingState {
  return onboardingReducer(state, {
    type: "session_created",
    setupSessionId: "setup-session-1",
  });
}

describe("onboardingReducer", () => {
  it("creates and refreshes a session", () => {
    let state = initialState();
    state = withSession(state);
    expect(state.setupSessionId).toBe("setup-session-1");

    state = onboardingReducer(state, {
      type: "profile_refreshed",
      profile: setupProfileFixture,
    });
    expect(state.status).toBe(OnboardingStatus.Idle);
    expect(state.profileCompleteness).toBe(42);
    expect(state.checklistRows).toHaveLength(0);
  });

  it("advances the step and mode", () => {
    let state = initialState();
    state = onboardingReducer(state, {
      type: "step_changed",
      step: OnboardingStep.Interview,
    });
    expect(state.step).toBe(OnboardingStep.Interview);

    state = onboardingReducer(state, {
      type: "mode_changed",
      mode: InterviewMode.Text,
    });
    expect(state.interviewMode).toBe(InterviewMode.Text);
  });

  it("accumulates stream events and tracks the stream state", () => {
    let state = initialState();
    state = onboardingReducer(state, {
      type: "stream_event_received",
      progressEvent,
    });
    state = onboardingReducer(state, {
      type: "stream_event_received",
      progressEvent,
    });
    expect(state.progressEvents).toHaveLength(2);

    state = onboardingReducer(state, {
      type: "stream_state_changed",
      streamState: StreamState.Connected,
    });
    expect(state.streamState).toBe(StreamState.Connected);
  });

  it("records consent, errors, notices and submission", () => {
    let state = initialState();
    state = onboardingReducer(state, {
      type: "consent_changed",
      granted: false,
    });
    state = onboardingReducer(state, { type: "error_shown", message: "boom" });
    state = onboardingReducer(state, { type: "notice_shown", message: "wait" });
    state = onboardingReducer(state, { type: "interview_submitted" });

    expect(state.researchConsent).toBe(false);
    expect(state.error).toBe("boom");
    expect(state.notice).toBe("wait");
    expect(state.interviewSubmitted).toBe(true);
  });

  it("resets to the initial state", () => {
    let state = initialState();
    state = withSession(state);
    state = onboardingReducer(state, {
      type: "profile_refreshed",
      profile: setupProfileFixture,
    });
    state = onboardingReducer(state, { type: "session_reset" });

    expect(state).toEqual(initialState());
  });
});

describe("resume", () => {
  it("restores the review step for a stored session without a preview", () => {
    expect(
      restoredStepForProfile(OnboardingStep.Review, setupProfileFixture),
    ).toBe(OnboardingStep.Review);
  });

  it("keeps the stored step even when a leftover preview package exists", () => {
    const profileWithPreview = {
      ...setupProfileFixture,
      active_preview_package: {
        id: "preview-1",
        setup_contract_version_id: "contract-v1",
        setup_session_id: "setup-session-1",
        status: "approved" as const,
      },
    };
    expect(
      restoredStepForProfile(OnboardingStep.Interview, profileWithPreview),
    ).toBe(OnboardingStep.Interview);
  });

  it("restores the website preview after wait-end", () => {
    expect(
      restoredStepForProfile(
        OnboardingStep.PreviewAndEdit,
        setupProfileFixture,
      ),
    ).toBe(OnboardingStep.PreviewAndEdit);
  });
});
