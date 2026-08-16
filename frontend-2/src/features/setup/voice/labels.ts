import { asObject, asString, pick } from "./valueParsers";
import type {
  ConnectionState,
  SetupProfileChecklistRow,
  SetupVoiceAgentEventCreate,
  TranscriptRole,
} from "./types";

export function connectionStateLabel(state: ConnectionState): string {
  switch (state) {
    case "requesting_microphone":
      return "Requesting mic";
    case "creating_session":
      return "Creating session";
    case "connecting":
      return "Connecting";
    case "recording":
      return "Recording";
    case "ended":
      return "Stopped";
    case "failed":
      return "Failed";
    default:
      return "Idle";
  }
}

export function roleLabel(role: TranscriptRole): string {
  if (role === "assistant") {
    return "Assistant";
  }
  if (role === "user") {
    return "Contractor";
  }
  if (role === "tool") {
    return "Saved event";
  }
  return "System";
}

export function checklistStatusLabel(row: SetupProfileChecklistRow): string {
  if (row.status === "filled_by_source") {
    return "source";
  }
  if (row.status === "filled_by_user") {
    return "answered";
  }
  if (row.status === "needs_confirmation") {
    return "confirm";
  }
  if (row.status === "conflict") {
    return "conflict";
  }
  if (row.status === "not_applicable") {
    return "n/a";
  }
  return "open";
}

export function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function providerErrorMessage(error: unknown): string | undefined {
  const errorObject = asObject(error);
  return (
    asString(pick(errorObject, "message")) ??
    asString(pick(errorObject, "error")) ??
    asString(pick(errorObject, "code")) ??
    undefined
  );
}

export function toolEventSummary(event: SetupVoiceAgentEventCreate): string {
  if (event.event_type === "obtained_information") {
    return `${event.field_path}: ${String(event.value ?? "")}`;
  }
  if (event.event_type === "mark_information_status") {
    return `${event.field_path}: ${event.status}`;
  }
  if (event.event_type === "request_lookup") {
    return event.lookup_type;
  }
  if (event.event_type === "confirm_conflict") {
    return `${event.field_path}: ${String(event.accepted_value ?? "")}`;
  }
  if (event.event_type === "end_interview") {
    return event.handoff_summary || "Interview handoff requested";
  }
  return event.next_questions?.join(", ") || "Plan changed";
}
