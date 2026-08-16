import type { RefObject } from "react";

import {
  executeVoiceToolCall,
  handleRealtimeMessage,
  mergeVoiceTranscriptTurns,
  playPcm16Audio,
  sendToolOutput,
  stopAssistantPlayback,
} from "./realtimeRuntime";
import { createSetupVoiceAgentEvent } from "../api/voice";
import type {
  ProgressEventRead,
  SetupProfileRead,
  SetupVoiceAgentDebugEventCreate,
  SetupVoiceAgentSessionRead,
  VoiceTranscriptTurn,
} from "./types";

export type RealtimeHandlersResult = {
  onDisconnect: (code: number) => void;
  onMessage: (
    rawMessage: string | ArrayBuffer | Blob,
    session: SetupVoiceAgentSessionRead,
  ) => void;
};

export type RealtimeHandlersProps = {
  nextPlaybackTimeRef: RefObject<number>;
  onApplyEventResponse: (response: {
    event_type?: string;
    profile: SetupProfileRead;
    progress_event: ProgressEventRead;
  }) => void;
  onDebugEvent: (event: SetupVoiceAgentDebugEventCreate) => void;
  onTranscriptChange: (
    updater: (current: VoiceTranscriptTurn[]) => VoiceTranscriptTurn[],
  ) => void;
  onTranscriptDraftChange: (updater: (current: string) => string) => void;
  onPartialTranscriptChange: (text: string) => void;
  onProviderError: (message: string) => void;
  onSessionDisconnected: (code: number) => void;
  onSpeechStarted: () => void;
  onVoiceChecklistFacts: (text: string) => void;
  outputAudioContextRef: RefObject<AudioContext | null>;
  outputAudioSourcesRef: RefObject<Set<AudioBufferSourceNode>>;
  websocketRef: RefObject<WebSocket | null>;
};

/** Builds the realtime message/disconnect handlers for connectProviderSession. */
export function buildRealtimeHandlers({
  nextPlaybackTimeRef,
  onApplyEventResponse,
  onDebugEvent,
  onPartialTranscriptChange,
  onProviderError,
  onSessionDisconnected,
  onSpeechStarted,
  onTranscriptChange,
  onTranscriptDraftChange,
  onVoiceChecklistFacts,
  outputAudioContextRef,
  outputAudioSourcesRef,
  websocketRef,
}: RealtimeHandlersProps): RealtimeHandlersResult {
  const handleMessage = (
    rawMessage: string | ArrayBuffer | Blob,
    providerSession: SetupVoiceAgentSessionRead,
  ): void => {
    handleRealtimeMessage({
      onDebugEvent,
      onOutputAudio: (base64Audio, outputSession) =>
        playPcm16Audio({
          base64Audio,
          nextPlaybackTimeRef,
          outputAudioContextRef,
          outputAudioSourcesRef,
          session: outputSession,
        }),
      onProviderError,
      onSpeechStarted: () => {
        stopAssistantPlayback({
          nextPlaybackTimeRef,
          outputAudioSourcesRef,
        });
        onSpeechStarted();
      },
      onToolCall: (message, toolSession) => {
        void executeVoiceToolCall({
          applyResponse: onApplyEventResponse,
          createEvent: (sessionId, event) =>
            createSetupVoiceAgentEvent(sessionId, event),
          message,
          onDebugEvent,
          sendOutput: (callId, output) =>
            sendToolOutput(websocketRef, callId, output),
          session: toolSession,
        });
      },
      onTranscript: (transcript) => {
        onTranscriptChange((current) =>
          mergeVoiceTranscriptTurns(current, transcript),
        );
        if (transcript.final && transcript.role === "user") {
          onPartialTranscriptChange("");
          onTranscriptDraftChange((current) =>
            [current.trim(), transcript.text.trim()]
              .filter(Boolean)
              .join("\n"),
          );
          void onVoiceChecklistFacts(transcript.text);
        } else if (transcript.role === "user") {
          onPartialTranscriptChange(transcript.text);
        }
      },
      rawMessage,
      session: providerSession,
    });
  };

  return {
    onDisconnect: (code: number) => {
      onSessionDisconnected(code);
    },
    onMessage: handleMessage,
  };
}
