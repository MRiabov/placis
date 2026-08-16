// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import type { SetupVoiceAgentSessionRead } from "./types";
import {
  executeVoiceToolCall,
  handleRealtimeMessage,
  mergeVoiceTranscriptTurns,
  sendToolOutput,
  stopAssistantPlayback,
} from "./realtimeRuntime";

const voiceSession: SetupVoiceAgentSessionRead = {
  connection_url: "wss://api.x.ai/v1/realtime?model=grok-voice-latest",
  greeting: "Hello",
  greeting_response_instructions: "Say Hello, then wait.",
  input_format: {
    channels: 1,
    encoding: "pcm16",
    media_type: "audio/pcm",
    sample_rate_hz: 24000,
  },
  instructions: "Collect setup facts.",
  realtime_instructions: "Collect setup facts with the backend bridge policy.",
  model: "grok-voice-latest",
  output_format: {
    channels: 1,
    encoding: "pcm16",
    media_type: "audio/pcm",
    sample_rate_hz: 24000,
  },
  provider: "xai",
  provider_session_id: "xai_123",
  setup_session_id: "setup_123",
};

describe("voice realtime runtime", () => {
  it("treats provider speech-start events as customer interruptions", () => {
    const onDebugEvent = vi.fn();
    const onSpeechStarted = vi.fn();

    handleRealtimeMessage({
      onDebugEvent,
      onOutputAudio: vi.fn(),
      onProviderError: vi.fn(),
      onSpeechStarted,
      onToolCall: vi.fn(),
      onTranscript: vi.fn(),
      rawMessage: JSON.stringify({
        event_id: "event_speech_started",
        type: "input_audio_buffer.speech_started",
      }),
      session: voiceSession,
    });

    expect(onSpeechStarted).toHaveBeenCalledOnce();
    expect(onDebugEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "speech_started",
        provider_event_id: "event_speech_started",
        provider_event_type: "input_audio_buffer.speech_started",
        provider_session_id: "xai_123",
      }),
    );
  });

  it("stops queued assistant playback and resets the playback clock", () => {
    const sourceA = { disconnect: vi.fn(), stop: vi.fn() };
    const sourceB = { disconnect: vi.fn(), stop: vi.fn() };
    const nextPlaybackTimeRef = { current: 12.5 };
    const outputAudioSourcesRef = {
      current: new Set([sourceA, sourceB] as unknown as AudioBufferSourceNode[]),
    };

    stopAssistantPlayback({
      nextPlaybackTimeRef,
      outputAudioSourcesRef,
    });

    expect(sourceA.stop).toHaveBeenCalledOnce();
    expect(sourceA.disconnect).toHaveBeenCalledOnce();
    expect(sourceB.stop).toHaveBeenCalledOnce();
    expect(sourceB.disconnect).toHaveBeenCalledOnce();
    expect(outputAudioSourcesRef.current.size).toBe(0);
    expect(nextPlaybackTimeRef.current).toBe(0);
  });

  it("sends markdown receipts back to realtime tool calls", async () => {
    const sendOutput = vi.fn();

    await executeVoiceToolCall({
      applyResponse: vi.fn(),
      createEvent: vi.fn().mockResolvedValue({
        event_type: "obtained_information",
        profile: {
          checklist: [],
          completeness: { percent: 42 },
          progress_events: [],
          setup_session: { id: "setup_123", status: "in_progress" },
        },
        progress_event: {
          event_type: "setup.voice_agent_obtained_information",
          id: "progress_123",
          setup_session_id: "setup_123",
        },
        tool_result_markdown:
          "# Tool Result\n\n## Required Before Handoff\n- [ ] **Phone**",
      }),
      message: {
        arguments: JSON.stringify({
          confidence: "high",
          field_path: "contact.name",
          needs_confirmation: false,
          value: "Ian Appleby",
        }),
        call_id: "call_123",
        name: "setup_obtained_information",
      },
      sendOutput,
      session: voiceSession,
    });

    expect(sendOutput).toHaveBeenCalledWith(
      "call_123",
      expect.objectContaining({
        markdown: expect.stringContaining("## Required Before Handoff"),
        ok: true,
      }),
    );
  });

  it("uses markdown as the provider-visible function output", () => {
    const send = vi.fn();
    const websocket = {
      readyState: WebSocket.OPEN,
      send,
    } as unknown as WebSocket;

    sendToolOutput(
      { current: websocket },
      "call_123",
      {
        markdown: "# Tool Result\n\n- Saved contact phone.",
        ok: true,
        profile_completeness: { percent: 80 },
      },
    );

    expect(JSON.parse(String(send.mock.calls[0]?.[0] ?? ""))).toMatchObject({
      item: {
        call_id: "call_123",
        output: "# Tool Result\n\n- Saved contact phone.",
        type: "function_call_output",
      },
      type: "conversation.item.create",
    });
  });

  it("replaces user transcript updates instead of appending replacement text", () => {
    const first = mergeVoiceTranscriptTurns([], {
      final: false,
      id: "item_user_1",
      role: "user",
      text: "We are",
    });
    const next = mergeVoiceTranscriptTurns(first, {
      final: false,
      id: "item_user_1",
      role: "user",
      text: "We are a construction company.",
    });
    const final = mergeVoiceTranscriptTurns(next, {
      final: true,
      id: "item_user_1",
      role: "user",
      text: "We are a construction company.",
    });

    expect(final).toHaveLength(1);
    expect(final[0]).toEqual(
      expect.objectContaining({
        final: true,
        text: "We are a construction company.",
      }),
    );
  });
});
