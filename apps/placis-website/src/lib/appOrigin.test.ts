import { describe, expect, it } from "vitest";

import { onboardingHref, signInHref } from "./appOrigin";

describe("appOrigin", () => {
  it("defaults CTAs to app.placis.com", () => {
    expect(onboardingHref()).toBe("https://app.placis.com/onboarding/find");
    expect(signInHref()).toBe("https://app.placis.com/sign-in");
  });
});
