/**
 * The only place allowed to perform hard browser navigation or read browser
 * navigation state (window.location / window.history) outside the router.
 * The quality checker's `router-boundary` contract whitelists this module.
 */
export function redirectTo(path: string): void {
  window.location.replace(path);
}

export function readUrlSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

export function currentPathWithQuery(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function previewUrlForToken(previewToken: string): string {
  const path = `/preview/${encodeURIComponent(previewToken)}/`;
  const env = import.meta.env as { VITE_PUBLIC_SITE_PREVIEW_BASE_URL?: string };
  const configuredBase = env.VITE_PUBLIC_SITE_PREVIEW_BASE_URL;
  if (configuredBase) {
    return new URL(path, configuredBase).toString();
  }
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (protocol === "http:") {
      return `${protocol}//${hostname}:4321${path}`;
    }
  }
  return path;
}

export function readPathname(): string {
  return window.location.pathname;
}

export function pushPathname(path: string): void {
  if (window.location.pathname !== path) {
    window.history.pushState(null, "", path);
  }
}

export function replacePathname(path: string): void {
  if (window.location.pathname !== path) {
    window.history.replaceState(null, "", path);
  }
}

/** The app origin, resolved through the shared navigation adapter. */
export function currentOrigin(): string {
  return window.location.origin;
}
