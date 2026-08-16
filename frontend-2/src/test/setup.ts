import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";

import { previewServer } from "./msw/server";

/**
 * The MSW server starts before any test module is imported: the API client
 * captures `globalThis.fetch` at module load, so interception must be active
 * first (openapi-fetch would otherwise keep the unpatched fetch).
 */
beforeAll(() => previewServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => previewServer.resetHandlers());
afterAll(() => previewServer.close());
