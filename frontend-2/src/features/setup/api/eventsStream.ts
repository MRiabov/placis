import { pick } from "../voice/valueParsers";
import { setupEventsStreamUrl } from "./setup";
import type { ProgressEventRead } from "../voice/types";

export const setupStreamEventTypes = [
  "setup.snapshot",
  "setup.company_registry_selected",
  "setup.google_place_workflow_started",
  "setup.google_place_selected",
  "setup.business_research_completed",
  "setup.progressive_preresearch_queued",
  "setup.progressive_preresearch_started",
  "setup.progressive_preresearch_profile_ingested",
  "setup.progressive_preresearch_completed",
  "setup.website_generation_started",
  "setup.website_generation_completed",
  "setup.voice_agent_tool_saved_event",
  "setup.text_interview_submission_received",
  "setup.text_interview_draft_saved",
  "setup.profile_facts_recorded",
  "setup.generation_run_completed",
] as const;

export const meaningfulSetupRefreshEvents: ReadonlySet<string> = new Set([
  "setup.company_registry_selected",
  "setup.google_place_workflow_started",
  "setup.google_place_selected",
  "setup.business_research_completed",
  "setup.progressive_preresearch_profile_ingested",
  "setup.website_generation_started",
  "setup.website_generation_completed",
  "setup.voice_agent_tool_saved_event",
  "setup.profile_facts_recorded",
]);

export type SetupStreamHandlers = {
  onEvent: (progressEvent: ProgressEventRead) => void;
  onError: () => void;
  onOpen: () => void;
};

export type SetupStreamSubscription = {
  close: () => void;
};

/** One SSE adapter for the setup events stream (EventSource lives here only). */
export function openSetupEventsStream(
  setupSessionId: string,
  handlers: SetupStreamHandlers,
): SetupStreamSubscription {
  const eventSource = new EventSource(setupEventsStreamUrl(setupSessionId));
  const listeners = setupStreamEventTypes.map((eventType) => {
    const listener = (message: Event) => {
      handlers.onEvent(
        progressEventFromSse(
          setupSessionId,
          eventType,
          message as MessageEvent<string>,
        ),
      );
    };
    eventSource.addEventListener(eventType, listener);
    return { eventType, listener };
  });
  eventSource.onopen = handlers.onOpen;
  eventSource.onerror = handlers.onError;

  return {
    close: () => {
      for (const { eventType, listener } of listeners) {
        eventSource.removeEventListener(eventType, listener);
      }
      eventSource.close();
    },
  };
}

function progressEventFromSse(
  setupSessionId: string,
  eventType: string,
  message: MessageEvent<string>,
): ProgressEventRead {
  const parsed = parseSseData(message.data);
  const nested = pick(parsed, "event") as Record<string, unknown>;
  const parsedCreatedAt = pick(parsed, "created_at");
  const nestedCreatedAt = pick(nested, "created_at");
  const parsedEventType = pick(parsed, "event_type");
  const nestedEventType = pick(nested, "event_type");
  const parsedId = pick(parsed, "id");
  const nestedId = pick(nested, "id");
  const parsedSessionId = pick(parsed, "setup_session_id");
  const nestedSessionId = pick(nested, "setup_session_id");
  const streamPayload = (pick(parsed, "payload") ??
    pick(nested, "payload") ??
    {}) as Record<string, unknown>;
  const createdAt =
    typeof parsedCreatedAt === "string"
      ? parsedCreatedAt
      : typeof nestedCreatedAt === "string"
        ? nestedCreatedAt
        : undefined;
  return {
    event_type:
      typeof parsedEventType === "string"
        ? parsedEventType
        : typeof nestedEventType === "string"
          ? nestedEventType
          : eventType,
    id:
      typeof parsedId === "string"
        ? parsedId
        : typeof nestedId === "string"
          ? nestedId
          : `${eventType}-${Date.now().toString(36)}`,
    payload: streamPayload,
    setup_session_id:
      typeof parsedSessionId === "string"
        ? parsedSessionId
        : typeof nestedSessionId === "string"
          ? nestedSessionId
          : setupSessionId,
    ...(typeof createdAt === "string" ? { created_at: createdAt } : {}),
  };
}

function parseSseData(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return { message: raw };
  }
}
