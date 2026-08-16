import { pushPathname, readPathname, replacePathname } from "@/shared/lib/navigation";
import {
  OnboardingStep,
  onboardingStepFromValue,
  type SetupProfileRead,
} from "./onboarding";

const ONBOARDING_RESUME_SESSION_STORAGE_KEY =
  "placis.contractorOnboarding.setupSessionId";
const ONBOARDING_RESUME_STEP_STORAGE_KEY = "placis.contractorOnboarding.step";
const ONBOARDING_RESUME_TIMEOUT_MS = 6000;

export function readStoredOnboardingResume(): {
  setupSessionId: string;
  step: OnboardingStep | null;
} | null {
  try {
    const setupSessionId = window.localStorage.getItem(
      ONBOARDING_RESUME_SESSION_STORAGE_KEY,
    );
    if (!setupSessionId) {
      return null;
    }
    const storedStep = window.localStorage.getItem(
      ONBOARDING_RESUME_STEP_STORAGE_KEY,
    );
    return {
      setupSessionId,
      step: storedStep ? onboardingStepFromValue(storedStep) : null,
    };
  } catch {
    return null;
  }
}

export function storeOnboardingResume(
  setupSessionId: string,
  step: OnboardingStep,
): void {
  try {
    window.localStorage.setItem(
      ONBOARDING_RESUME_SESSION_STORAGE_KEY,
      setupSessionId,
    );
    window.localStorage.setItem(ONBOARDING_RESUME_STEP_STORAGE_KEY, step.value);
  } catch {
    // Browser storage can be disabled; setup still works for the current tab.
  }
}

export function clearStoredOnboardingResume(): void {
  try {
    window.localStorage.removeItem(ONBOARDING_RESUME_SESSION_STORAGE_KEY);
    window.localStorage.removeItem(ONBOARDING_RESUME_STEP_STORAGE_KEY);
  } catch {
    // Browser storage can be disabled; there is nothing to clear.
  }
}

export class OnboardingResumeTimeoutError extends Error {
  constructor() {
    super("Timed out restoring onboarding setup session");
    this.name = "OnboardingResumeTimeoutError";
  }
}

export function withOnboardingResumeTimeout<T>(
  promise: Promise<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new OnboardingResumeTimeoutError());
    }, ONBOARDING_RESUME_TIMEOUT_MS);

    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export function restoredStepForProfile(
  storedStep: OnboardingStep | null,
  restoredProfile: SetupProfileRead,
): OnboardingStep {
  if (restoredProfile.active_preview_package) {
    return OnboardingStep.Generating;
  }
  if (storedStep && !storedStep.equals(OnboardingStep.Identify)) {
    return storedStep;
  }
  return OnboardingStep.Review;
}

const onboardingStepSegments: Record<string, string | null> = {
  [OnboardingStep.Identify.value]: "find",
  [OnboardingStep.Review.value]: "review",
  [OnboardingStep.Interview.value]: "interview",
  [OnboardingStep.Generating.value]: "preview",
};

/** Reads the step from the /onboarding/{segment} path (port of the original
 *  old-app routing; stubbed out there in #241). */
export function onboardingStepFromLocation(): OnboardingStep {
  const segments = readPathname().split("/").filter(Boolean);
  const onboardingIndex = segments.indexOf("onboarding");
  const stepSegment =
    onboardingIndex >= 0 ? segments[onboardingIndex + 1] : undefined;
  if (stepSegment === "review") {
    return OnboardingStep.Review;
  }
  if (stepSegment === "interview") {
    return OnboardingStep.Interview;
  }
  if (stepSegment === "preview" || stepSegment === "generating") {
    return OnboardingStep.Generating;
  }
  return OnboardingStep.Identify;
}

/** The canonical /onboarding/{segment} path for a step, preserving any
 *  segments before "onboarding" (e.g. a tenant prefix). */
export function onboardingPathForStep(step: OnboardingStep): string {
  const segments = readPathname().split("/").filter(Boolean);
  const onboardingIndex = segments.indexOf("onboarding");
  const rootSegments =
    onboardingIndex >= 0
      ? segments.slice(0, onboardingIndex + 1)
      : ["onboarding"];
  const suffix = onboardingStepSegments[step.value];
  const nextSegments = suffix ? [...rootSegments, suffix] : rootSegments;
  return `/${nextSegments.join("/")}`;
}

/** Writes the step into the URL when it changes. */
export function pushOnboardingStepPath(step: OnboardingStep): void {
  pushPathname(onboardingPathForStep(step));
}

/** Restores the canonical path for the step found in the URL. */
export function canonicalizeOnboardingPath(): void {
  replacePathname(onboardingPathForStep(onboardingStepFromLocation()));
}
