import { useCallback, useEffect, useRef, useState } from "react";

import {
  createSetupVoiceAgentDebugEvent,
  createSetupVoiceAgentEvent,
  createSetupVoiceAgentSession,
} from "../api/voice";
import { inferVoiceChecklistFacts } from "./checklistInference";
import {
  closeRealtimeResources,
  connectProviderSession,
  stopAssistantPlayback,
} from "./realtimeRuntime";
import { buildRealtimeHandlers } from "./realtimeHandlers";
import { setupFieldPath, setupProfileValue } from "./protocol";
import type {
  ProgressEventRead,
  SetupProfileRead,
  SetupVoiceAgentDebugEventCreate,
  SetupVoiceAgentSessionRead,
  VoiceTranscriptTurn,
} from "./types";
import type { SetupChecklistRow } from "../api/setup";

type VoiceInterviewStatus =
  | "idle"
  | "starting"
  | "ready"
  | "listening"
  | "unsupported"
  | "error";

export type SetupVoiceInterview = {
  actions: {
    startVoiceInterview: () => Promise<void>;
    stopVoiceCapture: () => void;
    useCorrectedTranscriptAsNotes: () => void;
  };
  state: {
    error: string | null;
    partialTranscript: string;
    session: SetupVoiceAgentSessionRead | null;
    status: VoiceInterviewStatus;
    transcriptDraft: string;
    transcriptTurns: VoiceTranscriptTurn[];
  };
};

type SetupVoiceInterviewProps = {
  missingChecklistRows: SetupChecklistRow[];
  onApplyEventResponse: (response: {
    event_type?: string;
    profile: SetupProfileRead;
    progress_event: ProgressEventRead;
  }) => void;
  onAppendNotes: (notes: string) => void;
  onNotice: (message: string | null) => void;
  onShowError: (message: string | null) => void;
  setupSessionId: string | null;
};

function createLocalId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/** Wires the realtime voice runtime to the setup voice-api adapters. */
export function useSetupVoiceInterview({
  missingChecklistRows,
  onApplyEventResponse,
  onAppendNotes,
  onNotice,
  onShowError,
  setupSessionId,
}: SetupVoiceInterviewProps): SetupVoiceInterview {
  const [status, setStatus] = useState<VoiceInterviewStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SetupVoiceAgentSessionRead | null>(
    null,
  );
  const [transcriptTurns, setTranscriptTurns] = useState<VoiceTranscriptTurn[]>(
    [],
  );
  const [partialTranscript, setPartialTranscript] = useState("");
  const [transcriptDraft, setTranscriptDraft] = useState("");

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextPlaybackTimeRef = useRef(0);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const voiceStoppedRef = useRef(false);
  const websocketRef = useRef<WebSocket | null>(null);
  const missingChecklistRowsRef = useRef<SetupChecklistRow[]>(
    missingChecklistRows,
  );
  useEffect(() => {
    missingChecklistRowsRef.current = missingChecklistRows;
  }, [missingChecklistRows]);

  const recordVoiceDebugEvent = useVoiceDebugEventLogger(setupSessionId);

  const startVoiceInterview = useCallback(async () => {
    await startVoiceInterviewCore({
      appendAssistantGreeting: (greeting) =>
        appendGreeting(setTranscriptTurns, greeting),
      inputAudioContextRef,
      mediaStreamRef,
      nextPlaybackTimeRef,
      onApplyEventResponse,
      onNotice,
      onShowError,
      outputAudioContextRef,
      outputAudioSourcesRef,
      processorRef,
      recordVoiceChecklistFacts: (text) =>
        recordTranscriptFacts({
          onApplyEventResponse,
          onShowError,
          rows: missingChecklistRowsRef.current,
          setupSessionId: setupSessionId ?? "",
          text,
        }),
      recordVoiceDebugEvent,
      setError,
      setPartialTranscript,
      setSession,
      setStatus,
      setTranscriptDraft,
      setTranscriptTurns,
      setupSessionId,
      sourceRef,
      voiceStoppedRef,
      websocketRef,
    });
  }, [
    onApplyEventResponse,
    onNotice,
    onShowError,
    recordVoiceDebugEvent,
    setupSessionId,
  ]);

  const stopVoiceCapture = useCallback(() => {
    voiceStoppedRef.current = true;
    stopAssistantPlayback({
      nextPlaybackTimeRef,
      outputAudioSourcesRef,
    });
    closeRealtimeResources({
      inputAudioContextRef,
      mediaStreamRef,
      processorRef,
      sourceRef,
      websocketRef,
    });
    setPartialTranscript("");
    setStatus((current) =>
      current === "starting" || current === "listening" ? "ready" : current,
    );
  }, []);

  const useCorrectedTranscriptAsNotes = useCallback(() => {
    const draft = transcriptDraft.trim();
    if (!draft) {
      return;
    }
    onAppendNotes(draft);
    onNotice("Corrected transcript copied into the interview notes.");
  }, [onAppendNotes, onNotice, transcriptDraft]);

  return {
    actions: {
      startVoiceInterview,
      stopVoiceCapture,
      useCorrectedTranscriptAsNotes,
    },
    state: {
      error,
      partialTranscript,
      session,
      status,
      transcriptDraft,
      transcriptTurns,
    },
  };
}

type VoiceStartDeps = {
  appendAssistantGreeting: (greeting?: string | null) => void;
  inputAudioContextRef: React.RefObject<AudioContext | null>;
  mediaStreamRef: React.RefObject<MediaStream | null>;
  nextPlaybackTimeRef: React.RefObject<number>;
  onApplyEventResponse: (response: {
    event_type?: string;
    profile: SetupProfileRead;
    progress_event: ProgressEventRead;
  }) => void;
  onNotice: (message: string | null) => void;
  onShowError: (message: string | null) => void;
  outputAudioContextRef: React.RefObject<AudioContext | null>;
  outputAudioSourcesRef: React.RefObject<Set<AudioBufferSourceNode>>;
  processorRef: React.RefObject<ScriptProcessorNode | null>;
  recordVoiceChecklistFacts: (text: string) => Promise<void>;
  recordVoiceDebugEvent: (event: SetupVoiceAgentDebugEventCreate) => void;
  setError: (message: string | null) => void;
  setPartialTranscript: (text: string) => void;
  setSession: (session: SetupVoiceAgentSessionRead | null) => void;
  setStatus: (status: VoiceInterviewStatus) => void;
  setTranscriptDraft: (updater: (current: string) => string) => void;
  setTranscriptTurns: (
    updater: (current: VoiceTranscriptTurn[]) => VoiceTranscriptTurn[],
  ) => void;
  setupSessionId: string | null;
  sourceRef: React.RefObject<MediaStreamAudioSourceNode | null>;
  voiceStoppedRef: React.RefObject<boolean>;
  websocketRef: React.RefObject<WebSocket | null>;
};

async function startVoiceInterviewCore({
  appendAssistantGreeting,
  inputAudioContextRef,
  mediaStreamRef,
  nextPlaybackTimeRef,
  onApplyEventResponse,
  onNotice,
  onShowError,
  outputAudioContextRef,
  outputAudioSourcesRef,
  processorRef,
  recordVoiceChecklistFacts,
  recordVoiceDebugEvent,
  setError,
  setPartialTranscript,
  setSession,
  setStatus,
  setTranscriptDraft,
  setTranscriptTurns,
  setupSessionId,
  sourceRef,
  voiceStoppedRef,
  websocketRef,
}: VoiceStartDeps): Promise<void> {
  closeRealtimeResources({
    inputAudioContextRef,
    mediaStreamRef,
    processorRef,
    sourceRef,
    websocketRef,
  });
  voiceStoppedRef.current = false;
  setStatus("starting");
  setError(null);
  onShowError(null);
  onNotice("Allow microphone access in your browser, then answer the greeting.");
  try {
    if (!setupSessionId) {
      throw new Error("Start setup before starting the voice interview.");
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("This browser does not expose microphone capture.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    mediaStreamRef.current = stream;
    const providerSession = await createSetupVoiceAgentSession(setupSessionId, {
      context: { surface: "contractor_onboarding" },
      mode: "plan",
    });
    setSession(providerSession);
    recordVoiceDebugEvent({
      event_type: "session_started",
      metadata: {
        model: providerSession.model,
        provider: providerSession.provider,
        transcription_model: providerSession.transcription_model ?? null,
        voice: providerSession.voice ?? null,
      },
      provider_session_id: providerSession.provider_session_id,
    });
    if (!providerSession.connection_url || providerSession.provider === "fake") {
      appendAssistantGreeting(providerSession.greeting);
      closeRealtimeResources({
        inputAudioContextRef,
        mediaStreamRef,
        processorRef,
        sourceRef,
        websocketRef,
      });
      setStatus("unsupported");
      setError(
        "The realtime provider is not configured for live audio in this environment.",
      );
      return;
    }
    const handlers = buildRealtimeHandlers({
      nextPlaybackTimeRef,
      onApplyEventResponse,
      onDebugEvent: recordVoiceDebugEvent,
      onPartialTranscriptChange: setPartialTranscript,
      onProviderError: (message) => {
        setStatus("error");
        setError(message);
      },
      onSessionDisconnected: (code) => {
        recordVoiceDebugEvent({
          event_type: "connection_closed",
          metadata: { code },
          provider_session_id: providerSession.provider_session_id,
          text: `Realtime provider disconnected (${code}).`,
        });
        setStatus("error");
        setError(`Realtime provider disconnected (${code}).`);
      },
      onSpeechStarted: () => undefined,
      onTranscriptChange: setTranscriptTurns,
      onTranscriptDraftChange: setTranscriptDraft,
      onVoiceChecklistFacts: recordVoiceChecklistFacts,
      outputAudioContextRef,
      outputAudioSourcesRef,
      websocketRef,
    });
    await connectProviderSession({
      inputAudioContextRef,
      isStopped: () => voiceStoppedRef.current,
      mediaStreamRef,
      onDisconnect: handlers.onDisconnect,
      onMessage: handlers.onMessage,
      processorRef,
      session: providerSession,
      sourceRef,
      stream,
      websocketRef,
    });
    onNotice(null);
    setStatus("listening");
  } catch (caught) {
    closeRealtimeResources({
      inputAudioContextRef,
      mediaStreamRef,
      processorRef,
      sourceRef,
      websocketRef,
    });
    onNotice(null);
    setStatus("error");
    setError(
      caught instanceof Error
        ? caught.message
        : "Failed to start voice interview.",
    );
  }
}

function useVoiceDebugEventLogger(
  setupSessionId: string | null,
): (event: SetupVoiceAgentDebugEventCreate) => void {
  return useCallback(
    (event: SetupVoiceAgentDebugEventCreate) => {
      if (!import.meta.env.DEV || !setupSessionId) {
        return;
      }
      void createSetupVoiceAgentDebugEvent(setupSessionId, event).catch(
        () => undefined,
      );
    },
    [setupSessionId],
  );
}

function appendGreeting(
  setTranscriptTurns: (
    updater: (current: VoiceTranscriptTurn[]) => VoiceTranscriptTurn[],
  ) => void,
  greeting?: string | null,
): void {
  if (!greeting?.trim()) {
    return;
  }
  const text = greeting.trim();
  setTranscriptTurns((current) => {
    if (
      current.some((turn) => turn.role === "assistant" && turn.text === text)
    ) {
      return current;
    }
    return [
      ...current,
      {
        createdAt: new Date().toISOString(),
        final: true,
        id: createLocalId("assistant-turn"),
        role: "assistant",
        text,
      },
    ];
  });
}

async function recordTranscriptFacts({
  onApplyEventResponse,
  onShowError,
  rows,
  setupSessionId,
  text,
}: {
  onApplyEventResponse: (response: {
    event_type?: string;
    profile: SetupProfileRead;
    progress_event: ProgressEventRead;
  }) => void;
  onShowError: (message: string | null) => void;
  rows: SetupChecklistRow[];
  setupSessionId: string;
  text: string;
}): Promise<void> {
  const facts = inferVoiceChecklistFacts(text, rows);
  if (!facts.length) {
    return;
  }
  onShowError(null);
  for (const fact of facts) {
    try {
      const response = await createSetupVoiceAgentEvent(setupSessionId, {
        confidence: fact.confidence,
        event_type: "obtained_information",
        evidence_text: text.trim(),
        field_path: setupFieldPath(fact.row.id),
        needs_confirmation: fact.needsConfirmation,
        value: setupProfileValue(fact.value),
      });
      onApplyEventResponse(response);
    } catch (caught) {
      onShowError(
        caught instanceof Error
          ? caught.message
          : `Failed to save ${fact.row.label} from the voice interview.`,
      );
      return;
    }
  }
}
