/** Pure helpers for the private-app auth redirect flow. They never read
 *  browser state directly; callers pass pathname/search read through the
 *  shared navigation module (the router-boundary contract). */
const PRIVATE_APP_HOME_PATH = "/cms";
export const PRIVATE_APP_LOGIN_PATH = "/login";

export function isPrivateAppLoginPath(pathname: string): boolean {
  return (
    pathname === PRIVATE_APP_LOGIN_PATH ||
    pathname.startsWith(`${PRIVATE_APP_LOGIN_PATH}/`)
  );
}

/** The login URL carrying the path to return to after sign-in. */
export function privateAppLoginUrl(returnPath: string): string {
  const params = new URLSearchParams();
  params.set("redirect_url", returnPath);
  return `${PRIVATE_APP_LOGIN_PATH}?${params.toString()}`;
}

/** The validated return path from the login URL's redirect_url search param,
 *  falling back to the private app home when missing or unsafe. Backslashes
 *  are rejected because browsers normalize them to slashes, which would let
 *  `/\evil.example` resolve as a protocol-relative external redirect. */
export function privateAppRedirectUrlFromSearch(
  search: URLSearchParams,
): string {
  const redirectUrl = search.get("redirect_url");
  if (
    !redirectUrl?.startsWith("/") ||
    redirectUrl.startsWith("//") ||
    redirectUrl.includes("\\") ||
    isPrivateAppLoginPath(
      new URL(redirectUrl, "https://app.placis.com").pathname,
    )
  ) {
    return PRIVATE_APP_HOME_PATH;
  }
  return redirectUrl;
}
