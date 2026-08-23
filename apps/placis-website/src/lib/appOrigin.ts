export function appOrigin(): string {
  const value = import.meta.env.PUBLIC_APP_ORIGIN;
  if (typeof value === "string" && value.length > 0) {
    return value.replace(/\/$/, "");
  }
  return "https://app.placis.com";
}

export function onboardingHref(): string {
  return `${appOrigin()}/onboarding/find`;
}

export function signInHref(): string {
  return `${appOrigin()}/sign-in`;
}
