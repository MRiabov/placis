import { asObject, asOptionalString, asString, asStringArray, pick } from "./valueParsers";
import { audioSampleRate } from "./audioCodec";
import type {
  ProgressEventRead,
  RealtimeMessage,
  SetupProfileValue,
  SetupVoiceAgentEventCreate,
  SetupVoiceAgentSessionRead,
} from "./types";

export function setupProfileValue(value: unknown): SetupProfileValue {
  if (value === null || value === undefined) return { kind: "null" };
  if (typeof value === "string") return { kind: "text", value };
  if (typeof value === "boolean") return { kind: "boolean", value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { kind: "integer", value }
      : { kind: "number", value };
  }
  if (Array.isArray(value)) {
    return { kind: "list", items: value.map(setupProfileValue) };
  }
  if (typeof value === "object") {
    return {
      kind: "object",
      entries: Object.entries(value).map(([key, entry]) => ({
        key,
        value: setupProfileValue(entry),
      })),
    };
  }
  return { kind: "text", value: String(value) };
}

export type RealtimeSessionUpdate = {
  session: {
    audio: {
      input: {
        format: { rate: number; type: "audio/pcm" };
        transcription?: { model: string } | undefined;
      };
      output: {
        format: { rate: number; type: "audio/pcm" };
        voice?: string | undefined;
      };
    };
    instructions: string;
    modalities: string[];
    tools: unknown[];
    turn_detection: { type: "server_vad" };
    voice?: string | undefined;
  };
  type: "session.update";
};

export function realtimeSessionUpdate(
  session: SetupVoiceAgentSessionRead,
): RealtimeSessionUpdate {
  return {
    session: {
      audio: {
        input: {
          format: {
            rate: audioSampleRate(session.input_format),
            type: "audio/pcm",
          },
          transcription: session.transcription_model
            ? { model: session.transcription_model }
            : undefined,
        },
        output: {
          format: {
            rate: audioSampleRate(session.output_format),
            type: "audio/pcm",
          },
          voice: session.voice ?? undefined,
        },
      },
      instructions: session.realtime_instructions || session.instructions,
      modalities: ["audio", "text"],
      tools: setupVoiceTools(),
      turn_detection: { type: "server_vad" },
      voice: session.voice ?? undefined,
    },
    type: "session.update",
  };
}

const setupFieldPathOptions = {
  enum: [
    "business_identity.display_name",
    "business_identity.legal_name",
    "legal_disclosure.company_number",
    "legal_disclosure.registered_office",
    "legal_disclosure.vat_number",
    "contact.name",
    "contact.phone",
    "contact.email",
    "contact.website",
    "contact.opening_hours",
    "contact.google_profile",
    "contact.facebook_profile",
    "services.primary_trade",
    "services.main_services",
    "service_area.primary",
    "trust.accreditations",
    "trust.founder_profile",
    "trust.reviews",
    "assets.photos",
    "website.preview",
  ],
  type: "string",
};

const setup_obtained_informationTool = {
      description:
        "Save a contractor-provided setup fact after repeating it back clearly.",
      name: "setup_obtained_information",
      parameters: {
        additionalProperties: false,
        properties: {
          confidence: { enum: ["high", "medium", "low"], type: "string" },
          evidence_text: { type: ["string", "null"] },
          field_path: setupFieldPathOptions,
          needs_confirmation: { type: "boolean" },
          value: {},
        },
        required: ["field_path", "value", "confidence"],
        type: "object",
      },
      type: "function",
    };
const setup_mark_information_statusTool = {
      description:
        "Mark a checklist item as missing, unknown, skipped, or not applicable.",
      name: "setup_mark_information_status",
      parameters: {
        additionalProperties: false,
        properties: {
          field_path: setupFieldPathOptions,
          reason: { type: ["string", "null"] },
          status: {
            enum: [
              "missing",
              "unknown",
              "not_applicable",
              "skipped",
              "needs_confirmation",
            ],
            type: "string",
          },
        },
        required: ["field_path", "status"],
        type: "object",
      },
      type: "function",
    };
const setup_request_lookupTool = {
      description:
        "Request a follow-up lookup that frontend or backend observers can run.",
      name: "setup_request_lookup",
      parameters: {
        additionalProperties: false,
        properties: {
          inputs: { additionalProperties: true, type: "object" },
          lookup_type: {
            enum: [
              "company_registry_search",
              "google_profile_search",
              "facebook_profile_search",
              "founder_profile_search",
              "accreditation_search",
              "fast_preresearch",
              "custom",
            ],
            type: "string",
          },
          reason: { type: ["string", "null"] },
        },
        required: ["lookup_type"],
        type: "object",
      },
      type: "function",
    };
const setup_confirm_conflictTool = {
      description: "Confirm the accepted value for a conflicting setup fact.",
      name: "setup_confirm_conflict",
      parameters: {
        additionalProperties: false,
        properties: {
          accepted_value: {},
          field_path: setupFieldPathOptions,
          reason: { type: ["string", "null"] },
          rejected_source_ids: {
            items: { type: "string" },
            type: "array",
          },
        },
        required: ["field_path", "accepted_value"],
        type: "object",
      },
      type: "function",
    };
const setup_update_interview_planTool = {
      description:
        "Update the visible setup interview plan, completed topics, and next questions.",
      name: "setup_update_interview_plan",
      parameters: {
        additionalProperties: false,
        properties: {
          completed: { items: { type: "string" }, type: "array" },
          next_questions: { items: { type: "string" }, type: "array" },
          plan_markdown: { type: ["string", "null"] },
        },
        type: "object",
      },
      type: "function",
    };
const setup_end_interviewTool = {
      description:
        "End the setup interview and hand off to backend website generation after all blocking setup facts are complete.",
      name: "setup_end_interview",
      parameters: {
        additionalProperties: false,
        properties: {
          completed_required_row_ids: {
            items: setupFieldPathOptions,
            type: "array",
          },
          handoff_summary: { type: "string" },
          needs_confirmation_row_ids: {
            items: setupFieldPathOptions,
            type: "array",
          },
          ready_for_generation: { type: "boolean" },
          remaining_unresolved_row_ids: {
            items: setupFieldPathOptions,
            type: "array",
          },
        },
        required: ["handoff_summary", "ready_for_generation"],
        type: "object",
      },
      type: "function",
    };

function setupVoiceTools(): unknown[] {
  return [setup_obtained_informationTool, setup_mark_information_statusTool, setup_request_lookupTool, setup_confirm_conflictTool, setup_update_interview_planTool, setup_end_interviewTool];
}

export function voiceEventFromToolCall(
  name: string,
  args: Record<string, unknown>,
): SetupVoiceAgentEventCreate | null {
  if (name === "setup_obtained_information") {
    return {
      confidence: confidenceValue(pick(args, "confidence")),
      event_type: "obtained_information",
      evidence_text: asOptionalString(pick(args, "evidence_text")),
      field_path: setupFieldPath(pick(args, "field_path")),
      needs_confirmation: pick(args, "needs_confirmation") === true,
      value: setupProfileValue(pick(args, "value")),
    };
  }
  if (name === "setup_mark_information_status") {
    return {
      event_type: "mark_information_status",
      field_path: setupFieldPath(pick(args, "field_path")),
      reason: asOptionalString(pick(args, "reason")),
      status: informationStatus(pick(args, "status")),
    };
  }
  if (name === "setup_request_lookup") {
    return {
      event_type: "request_lookup",
      inputs: asObject(pick(args, "inputs")),
      lookup_type: lookupType(pick(args, "lookup_type")),
      reason: asOptionalString(pick(args, "reason")),
    };
  }
  if (name === "setup_confirm_conflict") {
    return {
      accepted_value: setupProfileValue(pick(args, "accepted_value")),
      event_type: "confirm_conflict",
      field_path: setupFieldPath(pick(args, "field_path")),
      reason: asOptionalString(pick(args, "reason")),
      rejected_source_ids: asStringArray(pick(args, "rejected_source_ids")),
    };
  }
  if (name === "setup_update_interview_plan") {
    return {
      completed: asStringArray(pick(args, "completed")),
      event_type: "update_interview_plan",
      next_questions: asStringArray(pick(args, "next_questions")),
      plan_markdown: asOptionalString(pick(args, "plan_markdown")),
    };
  }
  if (name === "setup_end_interview") {
    return {
      completed_required_row_ids: setupFieldPathArray(
        pick(args, "completed_required_row_ids"),
      ),
      event_type: "end_interview",
      handoff_summary: asString(pick(args, "handoff_summary")) ?? "",
      needs_confirmation_row_ids: setupFieldPathArray(
        pick(args, "needs_confirmation_row_ids"),
      ),
      ready_for_generation: pick(args, "ready_for_generation") === true,
      remaining_unresolved_row_ids: setupFieldPathArray(
        pick(args, "remaining_unresolved_row_ids"),
      ),
    };
  }
  return null;
}

export function toolCallFromRealtimeMessage(
  message: RealtimeMessage,
): { arguments: Record<string, unknown>; callId: string; name: string } | null {
  const name = asString(message.name ?? message.item?.name);
  const callId = asString(message.call_id ?? message.item?.call_id);
  if (!name || !callId) {
    return null;
  }
  const rawArguments = message.arguments ?? message.item?.arguments ?? {};
  const args =
    typeof rawArguments === "string"
      ? parseToolArguments(rawArguments)
      : asObject(rawArguments);
  return { arguments: args, callId, name };
}

export function isFunctionCallDone(type: string, message: RealtimeMessage): boolean {
  return (
    type === "response.function_call_arguments.done" ||
    (type === "conversation.item.created" &&
      message.item?.type === "function_call")
  );
}

export function sendRealtimeJson(
  websocket: WebSocket,
  value: Record<string, unknown>,
): void {
  if (websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(value));
  }
}

export function outputAudioFromRealtimeMessage(
  type: string,
  message: RealtimeMessage,
): string | null {
  if (
    type === "response.output_audio.delta" ||
    type === "response.audio.delta"
  ) {
    return asString(message.delta);
  }
  return null;
}

export function transcriptTextFromRealtimeMessage(
  type: string,
  message: RealtimeMessage,
): {
  final: boolean;
  id: string;
  role: "assistant" | "user";
  text: string;
} | null {
  if (!isTranscriptEventType(type)) {
    return null;
  }
  const text = asString(message.transcript ?? message.delta);
  if (!text) {
    return null;
  }
  const isUser =
    type.startsWith("conversation.item.input_audio_transcription") ||
    message.role === "user" ||
    message.item?.role === "user";
  const final =
    type.endsWith(".completed") ||
    type === "response.output_audio_transcript.done" ||
    type === "response.output_text.done";
  return {
    final,
    id:
      asString(message.item_id ?? message.response_id ?? message.event_id) ??
      `${type}-${Date.now()}`,
    role: isUser ? "user" : "assistant",
    text,
  };
}

function isTranscriptEventType(type: string): boolean {
  return (
    type.includes("transcript") ||
    type.includes("transcription") ||
    type === "response.output_text.delta" ||
    type === "response.output_text.done"
  );
}

function parseToolArguments(value: string): Record<string, unknown> {
  try {
    return asObject(JSON.parse(value));
  } catch {
    return {};
  }
}

export function progressEventFromSse(
  setupSessionId: string,
  eventType: string,
  event: MessageEvent<string>,
): ProgressEventRead {
  const parsed = parseSseData(event.data);
  const nested = asObject(pick(parsed, "event"));
  const createdAt = asString(
    pick(parsed, "created_at") ?? pick(nested, "created_at"),
  );
  return {
    event_type:
      asString(pick(parsed, "event_type") ?? pick(nested, "event_type")) ?? eventType,
    id:
      asString(pick(parsed, "id") ?? pick(nested, "id")) ??
      `${eventType}-${Date.now().toString(36)}`,
    payload: asObject(pick(parsed, "payload") ?? pick(nested, "payload")),
    setup_session_id:
      asString(pick(parsed, "setup_session_id") ?? pick(nested, "setup_session_id")) ??
      setupSessionId,
    ...(createdAt ? { created_at: createdAt } : {}),
  };
}

function parseSseData(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return asObject(parsed);
  } catch {
    return { message: raw };
  }
}

export function setupFieldPath(value: unknown): SetupFieldPath {
  const fallback = "business_identity.display_name";
  return (asString(value) ?? fallback) as SetupFieldPath;
}

type SetupFieldPath = Extract<
  SetupVoiceAgentEventCreate,
  { field_path: unknown }
>["field_path"];

function setupFieldPathArray(value: unknown): SetupFieldPath[] {
  return asStringArray(value).map((entry) => setupFieldPath(entry));
}

function confidenceValue(value: unknown): "high" | "medium" | "low" {
  return value === "medium" || value === "low" ? value : "high";
}

function informationStatus(value: unknown): SetupInformationStatus {
  if (
    value === "unknown" ||
    value === "not_applicable" ||
    value === "skipped" ||
    value === "needs_confirmation"
  ) {
    return value;
  }
  return "missing";
}

type SetupInformationStatus =
  | "missing"
  | "unknown"
  | "not_applicable"
  | "skipped"
  | "needs_confirmation";

type SetupLookupType =
  | "company_registry_search"
  | "google_profile_search"
  | "facebook_profile_search"
  | "founder_profile_search"
  | "accreditation_search"
  | "fast_preresearch"
  | "custom";

function lookupType(value: unknown): SetupLookupType {
  const valid: readonly string[] = [
    "company_registry_search",
    "google_profile_search",
    "facebook_profile_search",
    "founder_profile_search",
    "accreditation_search",
    "fast_preresearch",
    "custom",
  ];
  return valid.includes(String(value)) ? (value as SetupLookupType) : "custom";
}

export function initialRealtimeGreetingEvents(
  session: SetupVoiceAgentSessionRead,
): Record<string, unknown>[] {
  const greeting = session.greeting?.trim();
  if (!greeting) {
    return [];
  }
  const greetingInstructions =
    session.greeting_response_instructions?.trim() ||
    `Speak the assistant greeting that was just added to the conversation, then wait for the contractor's answer:

${greeting}`;
  if (session.provider === "xai") {
    return [
      {
        item: {
          content: [{ text: greeting, type: "output_text" }],
          interruptible: true,
          role: "assistant",
          type: "force_message",
        },
        type: "conversation.item.create",
      },
      {
        response: {
          instructions: greetingInstructions,
        },
        type: "response.create",
      },
    ];
  }
  return [
    {
      item: {
        content: [{ text: greeting, type: "input_text" }],
        role: "user",
        type: "message",
      },
      type: "conversation.item.create",
    },
    {
      response: {
        instructions: greetingInstructions,
      },
      type: "response.create",
    },
  ];
}
