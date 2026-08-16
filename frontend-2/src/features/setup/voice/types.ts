import type { components } from "@/generated/api-types";

export type SetupProfileChecklistRow =
  components["schemas"]["SetupProfileChecklistRow"];
export type SetupVoiceAgentSessionRead =
  components["schemas"]["SetupVoiceAgentSessionRead"];
export type SetupVoiceAgentDebugEventCreate =
  components["schemas"]["SetupVoiceAgentDebugEventCreate"];
export type SetupProfileRead = components["schemas"]["SetupProfileResponse"];
export type ProgressEventRead = components["schemas"]["ProgressEventRead"];

export type SetupVoiceAgentEventCreate =
  | components["schemas"]["SetupVoiceObtainedInformationEvent"]
  | components["schemas"]["SetupVoiceMarkInformationStatusEvent"]
  | components["schemas"]["SetupVoiceRequestLookupEvent"]
  | components["schemas"]["SetupVoiceConfirmConflictEvent"]
  | components["schemas"]["SetupVoiceUpdateInterviewPlanEvent"]
  | components["schemas"]["SetupVoiceEndInterviewEvent"];

export type SetupProfileValue =
  | components["schemas"]["SetupProfileNullValue"]
  | components["schemas"]["SetupProfileTextValue"]
  | components["schemas"]["SetupProfileIntegerValue"]
  | components["schemas"]["SetupProfileNumberValue"]
  | components["schemas"]["SetupProfileBooleanValue"]
  | components["schemas"]["SetupProfileObjectValue-Input"]
  | components["schemas"]["SetupProfileListValue-Input"];

export type ConnectionState =
  | "idle"
  | "requesting_microphone"
  | "creating_session"
  | "connecting"
  | "recording"
  | "ended"
  | "failed";

export type TranscriptRole = "assistant" | "user" | "system" | "tool";

export type RealtimeMessage = {
  arguments?: unknown;
  call_id?: unknown;
  conversation?: {
    id?: unknown;
  };
  delta?: unknown;
  error?: unknown;
  event_id?: unknown;
  item?: {
    arguments?: unknown;
    call_id?: unknown;
    content?: unknown;
    name?: unknown;
    role?: unknown;
    type?: unknown;
  };
  item_id?: unknown;
  name?: unknown;
  output_index?: unknown;
  response?: {
    output?: unknown;
  };
  response_id?: unknown;
  role?: unknown;
  transcript?: unknown;
  type?: unknown;
};

export type VoiceTranscriptTurn = {
  createdAt: string;
  final: boolean;
  id: string;
  role: "user" | "assistant";
  text: string;
};
