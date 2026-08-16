import createClient from "openapi-fetch";
import type { Middleware } from "openapi-fetch";
import type { paths } from "@/generated/api-types";

export const apiBaseUrl = (import.meta.env as { VITE_API_BASE_URL?: string })
  .VITE_API_BASE_URL ?? "http://localhost:8000";

export type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider | null = null;

export function setApiTokenProvider(provider: TokenProvider | null): void {
  tokenProvider = provider;
}

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    // Include cookies so the Placis session/org cookies round-trip
    // cross-origin (the old app's cmsFetch used credentials: include).
    const next = new Request(request, { credentials: "include" });
    const token = await tokenProvider?.();
    if (token) {
      next.headers.set("Authorization", `Bearer ${token}`);
    }
    return next;
  },
};

/** Single authenticated transport for the app. */
export const apiClient = createClient<paths>({
  baseUrl: apiBaseUrl,
  // Resolve fetch at request time so test interception (MSW patching
  // globalThis.fetch) works regardless of module import order.
  fetch: (input) => globalThis.fetch(input),
});
apiClient.use(authMiddleware);
