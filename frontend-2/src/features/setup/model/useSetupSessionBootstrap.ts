import { useEffect } from "react";

import { createGuidedSetupSession, getSetupProfile } from "../api/setup";
import {
  OnboardingStatus,
  OnboardingStep,
  type SetupOnboardingAction,
} from "./onboarding";
import {
  clearStoredOnboardingResume,
  OnboardingResumeTimeoutError,
  readStoredOnboardingResume,
  restoredStepForProfile,
  storeOnboardingResume,
  withOnboardingResumeTimeout,
} from "./resume";

/** Creates a session or restores the stored resume on mount. */
export function useSetupSessionBootstrap(
  dispatch: (action: SetupOnboardingAction) => void,
): void {
  useEffect(() => {
    const storedResume = readStoredOnboardingResume();
    if (!storedResume) {
      void createGuidedSetupSession().then(
        (session) => {
          const setupSessionId = String(session.id);
          dispatch({ type: "session_created", setupSessionId });
          storeOnboardingResume(setupSessionId, OnboardingStep.Identify);
          void refreshProfile(setupSessionId, dispatch);
        },
        (caught: unknown) => {
          dispatch({ type: "status_changed", status: OnboardingStatus.Error });
          dispatch({ type: "error_shown", message: errorMessageFrom(caught) });
        },
      );
      return;
    }

    dispatch({ type: "status_changed", status: OnboardingStatus.Refreshing });
    dispatch({
      type: "notice_shown",
      message: "Wait, we are getting your previous setup state.",
    });
    withOnboardingResumeTimeout(getSetupProfile(storedResume.setupSessionId))
      .then((nextProfile) => {
        dispatch({
          type: "session_created",
          setupSessionId: storedResume.setupSessionId,
        });
        dispatch({ type: "profile_refreshed", profile: nextProfile });
        dispatch({ type: "status_changed", status: OnboardingStatus.Ready });
        dispatch({ type: "notice_shown", message: null });
        dispatch({
          type: "step_changed",
          step: restoredStepForProfile(storedResume.step, nextProfile),
        });
      })
      .catch((caught: unknown) => {
        if (caught instanceof OnboardingResumeTimeoutError) {
          dispatch({ type: "status_changed", status: OnboardingStatus.Idle });
          dispatch({
            type: "notice_shown",
            message:
              "Previous setup is taking longer than expected to restore. You can continue from here while we leave it available to retry.",
          });
          return;
        }
        clearStoredOnboardingResume();
        dispatch({ type: "status_changed", status: OnboardingStatus.Idle });
        dispatch({
          type: "notice_shown",
          message:
            "We could not restore the previous setup state. Start a new search to continue.",
        });
      });
  }, [dispatch]);
}

export async function refreshProfile(
  setupSessionId: string,
  dispatch: (action: SetupOnboardingAction) => void,
): Promise<void> {
  try {
    const nextProfile = await getSetupProfile(setupSessionId);
    dispatch({ type: "profile_refreshed", profile: nextProfile });
    dispatch({ type: "status_changed", status: OnboardingStatus.Ready });
  } catch (caught: unknown) {
    dispatch({ type: "error_shown", message: errorMessageFrom(caught) });
  }
}

function errorMessageFrom(caught: unknown): string {
  return caught instanceof Error ? caught.message : "Something went wrong.";
}
