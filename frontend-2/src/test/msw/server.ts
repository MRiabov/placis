import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import {
  activationStartedFixture,
  claimActionResponseFixture,
  claimCheckoutFixture,
  claimStatusFixture,
  websitePreviewModuleFixture,
} from "@/test/fixtures/websitePreview";
import {
  setupChecklistFixture,
  setupProfileFixture,
  setupSessionFixture,
  setupVoiceEventFixture,
} from "@/test/fixtures/setupProfile";

/**
 * The API client falls back to http://localhost:8000 when VITE_API_BASE_URL
 * is unset (tests run without it). MSW in this version only matches absolute
 * URL handlers in Node, so the handlers pin that base URL; if a test run sets
 * VITE_API_BASE_URL, update these alongside.
 */
const apiBaseUrl = "http://localhost:8000";

export const previewToken = "preview-token";

const claimStatuses = ["checkout_pending", "activated"] as const;
export type PreviewClaimStatus = (typeof claimStatuses)[number];

let claimStatus: PreviewClaimStatus = "checkout_pending";

export function setClaimStatus(status: PreviewClaimStatus): void {
  claimStatus = status;
}

const previewHandlers = [
  http.get(
    `${apiBaseUrl}/api/v1/preview/:token/module/:module`,
    ({ params }) => {
      const token = (params as { token?: string }).token;
      if (token !== previewToken) {
        return HttpResponse.json(
          { detail: "Preview token not found." },
          { status: 404 },
        );
      }
      return HttpResponse.json(websitePreviewModuleFixture);
    },
  ),
  http.post(`${apiBaseUrl}/api/v1/preview/:token/activate`, () =>
    HttpResponse.json(activationStartedFixture),
  ),
  http.post(`${apiBaseUrl}/api/v1/preview/:token/claim`, () =>
    HttpResponse.json(claimActionResponseFixture),
  ),
  http.post(`${apiBaseUrl}/api/v1/preview/:token/claim/checkout`, () =>
    HttpResponse.json(claimCheckoutFixture),
  ),
  http.get(`${apiBaseUrl}/api/v1/preview/:token/claim/status`, () =>
    HttpResponse.json({ ...claimStatusFixture, status: claimStatus }),
  ),
  http.post(`${apiBaseUrl}/api/v1/setup-sessions`, () =>
    HttpResponse.json(setupSessionFixture),
  ),
  http.get(`${apiBaseUrl}/api/v1/setup-sessions/:session/profile`, () =>
    HttpResponse.json(setupProfileFixture),
  ),
  http.get(`${apiBaseUrl}/api/v1/setup-sessions/:session/profile/checklist`, () =>
    HttpResponse.json(setupChecklistFixture),
  ),
  http.post(
    `${apiBaseUrl}/api/v1/setup-sessions/:session/voice-agent/events`,
    () => HttpResponse.json(setupVoiceEventFixture),
  ),
  http.post(
    `${apiBaseUrl}/api/v1/setup-sessions/company-registry/search`,
    () =>
      HttpResponse.json({
        candidates: [
          {
            address: "1 Bellfield Road, Dublin",
            company_number: "IE123456",
            legal_name: "Bellfield Construction Ltd",
          },
        ],
        query: "Bellfield",
      }),
  ),
  http.get(`${apiBaseUrl}/api/v1/setup-sessions/google-places/autocomplete`, () =>
    HttpResponse.json(
      { detail: { message: "Validation failed." } },
      { status: 422 },
    ),
  ),
  http.post(`${apiBaseUrl}/api/v1/setup-sessions/from-google-place`, () =>
    HttpResponse.json({
      next_step: "profile_gathering",
      requested_modules: ["website"],
      setup_session: setupSessionFixture,
    }),
  ),
  http.post(`${apiBaseUrl}/api/v1/setup-sessions/:session/company-selection`, () =>
    HttpResponse.json({ setup_session: setupSessionFixture }),
  ),
  http.post(`${apiBaseUrl}/api/v1/setup-sessions/:session/consents`, () =>
    HttpResponse.json({ id: "consent-1" }),
  ),
  http.post(`${apiBaseUrl}/api/v1/setup-sessions/:session/imports`, () =>
    HttpResponse.json({ id: "import-1" }),
  ),
  http.post(`${apiBaseUrl}/api/v1/setup-sessions/:session/profile/facts`, () =>
    HttpResponse.json(setupProfileFixture),
  ),
  http.post(
    `${apiBaseUrl}/api/v1/setup-sessions/:session/text-interview/submissions`,
    () =>
      HttpResponse.json({
        id: "submission-1",
        setup_session_id: "setup-session-1",
        status: "received",
      }),
  ),
  http.put(
    `${apiBaseUrl}/api/v1/setup-sessions/:session/text-interview/draft`,
    () =>
      HttpResponse.json({
        id: "submission-1",
        setup_session_id: "setup-session-1",
        status: "draft",
      }),
  ),
  http.post(`${apiBaseUrl}/api/v1/setup-sessions/:session/voice-agent/session`, () =>
    HttpResponse.json({
      connection_url: "wss://realtime.example/voice-session-1",
      setup_session_id: "setup-session-1",
    }),
  ),
  http.post(`${apiBaseUrl}/api/v1/setup-sessions/:session/voice-agent/debug-events`, () =>
    HttpResponse.json({ id: "debug-event-1" }),
  ),
  http.post(`${apiBaseUrl}/api/v1/setup-sessions/:session/interview/complete`, () =>
    HttpResponse.json({ setup_session: { id: "setup-session-1" } }),
  ),
  http.post(`${apiBaseUrl}/api/v1/setup-sessions/:session/generation-runs`, () =>
    HttpResponse.json({ id: "generation-run-1", status: "queued" }),
  ),
];

export const previewServer = setupServer(...previewHandlers);
