import { apiClient } from "@/shared/api/client";
import {
  setupApiErrorMessage,
  setupApiErrorToolResultMarkdown,
} from "./setup";
import type { components, operations } from "@/generated/api-types";
import type {
  SetupVoiceAgentDebugEventCreate,
  SetupVoiceAgentEventCreate,
} from "../voice/types";

type SuccessStatus = 200 | 201 | 202 | 203 | 204 | 206;

type SuccessContent<Op extends keyof operations> = {
  [Status in keyof operations[Op]["responses"]]: Status extends SuccessStatus
    ? operations[Op]["responses"][Status] extends {
        content: { "application/json": infer Json };
      }
      ? Json
      : never
    : never;
}[keyof operations[Op]["responses"]];

export async function createSetupVoiceAgentSession(
  setupSessionId: string,
  input: Partial<components["schemas"]["SetupVoiceAgentSessionCreate"]> = {},
): Promise<SuccessContent<"setup_create_voice_agent_session">> {
  const response = await apiClient.POST(
    "/api/v1/setup-sessions/{setup_session_id}/voice-agent/session",
    {
      params: { path: { setup_session_id: setupSessionId } },
      body: {
        mode: "plan",
        ...input,
      },
    },
  );
  if (response.error) {
    throw new Error("Failed to start realtime setup interview");
  }
  return response.data;
}

export async function createSetupVoiceAgentEvent(
  setupSessionId: string,
  input: SetupVoiceAgentEventCreate,
): Promise<SuccessContent<"setup_create_voice_agent_event">> {
  const response = await apiClient.POST(
    "/api/v1/setup-sessions/{setup_session_id}/voice-agent/events",
    {
      params: { path: { setup_session_id: setupSessionId } },
      body: input,
    },
  );
  if (response.error) {
    const message =
      setupApiErrorMessage(response.error) ?? "Failed to save setup voice event";
    const thrown = new Error(message) as Error & {
      toolResultMarkdown?: string;
    };
    const markdown = setupApiErrorToolResultMarkdown(response.error);
    if (markdown) {
      thrown.toolResultMarkdown = markdown;
    }
    throw thrown;
  }
  return response.data;
}

export async function createSetupVoiceAgentDebugEvent(
  setupSessionId: string,
  input: SetupVoiceAgentDebugEventCreate,
): Promise<SuccessContent<"setup_create_voice_agent_debug_event">> {
  const response = await apiClient.POST(
    "/api/v1/setup-sessions/{setup_session_id}/voice-agent/debug-events",
    {
      body: input,
      params: { path: { setup_session_id: setupSessionId } },
    },
  );
  if (response.error) {
    throw new Error("Failed to save setup voice debug event");
  }
  return response.data;
}
