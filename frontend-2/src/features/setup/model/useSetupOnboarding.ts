import { useCallback, useEffect, useReducer, useRef } from "react";

import {
  meaningfulSetupRefreshEvents,
  openSetupEventsStream,
} from "../api/eventsStream";
import {
  type InterviewMode,
  initialState,
  OnboardingStatus,
  type OnboardingStep,
  onboardingReducer,
  type SetupOnboardingAction,
  type SetupOnboardingState,
  StreamState,
} from "./onboarding";
import {
  canonicalizeOnboardingPath,
  clearStoredOnboardingResume,
  onboardingStepFromLocation,
  pushOnboardingStepPath,
  storeOnboardingResume,
} from "./resume";
import {
  refreshProfile,
  useSetupSessionBootstrap,
} from "./useSetupSessionBootstrap";

export type SetupOnboarding = {
  actions: {
    changeInterviewMode: (mode: InterviewMode) => void;
    changeStep: (step: OnboardingStep) => void;
    clearError: () => void;
    resetSession: () => void;
    setResearchConsent: (granted: boolean) => void;
    showError: (message: string | null) => void;
    showNotice: (message: string | null) => void;
  };
  dispatch: (action: SetupOnboardingAction) => void;
  state: SetupOnboardingState;
};

/** Typed controller over the onboarding state machine; panels consume state + actions. */
export function useSetupOnboarding(): SetupOnboarding {
  const [state, dispatch] = useReducer(
    onboardingReducer,
    undefined,
    initialState,
  );
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    canonicalizeOnboardingPath();
    const handleRouteStepChange = () => {
      dispatch({ type: "step_changed", step: onboardingStepFromLocation() });
    };
    window.addEventListener("popstate", handleRouteStepChange);
    return () => {
      window.removeEventListener("popstate", handleRouteStepChange);
    };
  }, []);

  useSetupSessionBootstrap(dispatch);

  useEffect(() => {
    const setupSessionId = state.setupSessionId;
    if (!setupSessionId || state.status.equals(OnboardingStatus.Error)) {
      return;
    }
    const subscription = openSetupEventsStream(setupSessionId, {
      onEvent: (progressEvent) => {
        dispatch({ type: "stream_event_received", progressEvent });
        if (meaningfulSetupRefreshEvents.has(progressEvent.event_type)) {
          void refreshProfile(setupSessionId, dispatch);
        }
      },
      onError: () => {
        dispatch({
          type: "stream_state_changed",
          streamState: StreamState.Reconnecting,
        });
      },
      onOpen: () => {
        dispatch({
          type: "stream_state_changed",
          streamState: StreamState.Connected,
        });
      },
    });
    return subscription.close;
  }, [state.setupSessionId, state.status]);

  const changeStep = useCallback((step: OnboardingStep) => {
    dispatch({ type: "step_changed", step });
    pushOnboardingStepPath(step);
    const currentSessionId = stateRef.current.setupSessionId;
    if (currentSessionId) {
      storeOnboardingResume(currentSessionId, step);
    }
  }, []);

  return {
    actions: {
      changeInterviewMode: (mode) => dispatch({ type: "mode_changed", mode }),
      changeStep,
      clearError: () => dispatch({ type: "error_shown", message: null }),
      resetSession: () => {
        clearStoredOnboardingResume();
        dispatch({ type: "session_reset" });
      },
      setResearchConsent: (granted) =>
        dispatch({ type: "consent_changed", granted }),
      showError: (message) => dispatch({ type: "error_shown", message }),
      showNotice: (message) => dispatch({ type: "notice_shown", message }),
    },
    dispatch,
    state,
  };
}
