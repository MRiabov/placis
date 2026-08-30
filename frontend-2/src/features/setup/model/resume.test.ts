// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { OnboardingStep } from "./onboarding";
import {
  onboardingPathForStep,
  onboardingStepFromLocation,
} from "./resume";

describe("onboarding step routing", () => {
  it("maps steps to their canonical path segments", () => {
    window.history.pushState(null, "", "/onboarding");
    expect(onboardingPathForStep(OnboardingStep.Identify)).toBe(
      "/onboarding/find",
    );
    expect(onboardingPathForStep(OnboardingStep.Review)).toBe(
      "/onboarding/review",
    );
    expect(onboardingPathForStep(OnboardingStep.Interview)).toBe(
      "/onboarding/interview",
    );
    expect(onboardingPathForStep(OnboardingStep.Generating)).toBe(
      "/onboarding/preview",
    );
    expect(onboardingPathForStep(OnboardingStep.PreviewAndEdit)).toBe(
      "/onboarding/preview-and-edit",
    );
  });

  it("reads the step back from the location segment", () => {
    window.history.pushState(null, "", "/onboarding/preview");
    expect(onboardingStepFromLocation()).toBe(OnboardingStep.Generating);
    window.history.pushState(null, "", "/onboarding/preview-and-edit");
    expect(onboardingStepFromLocation()).toBe(OnboardingStep.PreviewAndEdit);
    window.history.pushState(null, "", "/onboarding/interview");
    expect(onboardingStepFromLocation()).toBe(OnboardingStep.Interview);
    window.history.pushState(null, "", "/onboarding/review");
    expect(onboardingStepFromLocation()).toBe(OnboardingStep.Review);
    window.history.pushState(null, "", "/onboarding");
    expect(onboardingStepFromLocation()).toBe(OnboardingStep.Identify);
    window.history.pushState(null, "", "/tenant/onboarding");
    expect(onboardingPathForStep(OnboardingStep.Review)).toBe(
      "/tenant/onboarding/review",
    );
  });
});
