import type { RefObject } from "react";

import {
  audioSampleRate,
  base64ToBytes,
  bytesToBase64,
  float32ToPcm16,
} from "./audioCodec";
import { providerErrorMessage } from "./labels";
import { pick } from "./valueParsers";
import {
  initialRealtimeGreetingEvents,
  isFunctionCallDone,
  outputAudioFromRealtimeMessage,
  realtimeSessionUpdate,
  sendRealtimeJson,
  transcriptTextFromRealtimeMessage,
  toolCallFromRealtimeMessage,
  voiceEventFromToolCall,
} from "./protocol";
import type { RealtimeMessage } from "./types";
import type {
  ProgressEventRead,
  SetupProfileRead,
  SetupVoiceAgentDebugEventCreate,
  SetupVoiceAgentSessionRead,
  VoiceTranscriptTurn,
} from "./types";

type RealtimeRefs = {
  inputAudioContextRef: RefObject<AudioContext | null>;
  mediaStreamRef: RefObject<MediaStream | null>;
  processorRef: RefObject<ScriptProcessorNode | null>;
  sourceRef: RefObject<MediaStreamAudioSourceNode | null>;
  websocketRef: RefObject<WebSocket | null>;
};

interface ConnectProviderSessionProps {
  inputAudioContextRef: RefObject<AudioContext | null>;
  isStopped: () => boolean;
  mediaStreamRef: RefObject<MediaStream | null>;
  onDisconnect: (code: number) => void;
  onMessage: (
    rawMessage: string | ArrayBuffer | Blob,
    session: SetupVoiceAgentSessionRead,
  ) => void;
  processorRef: RefObject<ScriptProcessorNode | null>;
  session: SetupVoiceAgentSessionRead;
  sourceRef: RefObject<MediaStreamAudioSourceNode | null>;
  stream: MediaStream;
  websocketRef: RefObject<WebSocket | null>;
}

export async function connectProviderSession({
  inputAudioContextRef,
  isStopped,
  mediaStreamRef,
  onDisconnect,
  onMessage,
  processorRef,
  session,
  sourceRef,
  stream,
  websocketRef,
}: ConnectProviderSessionProps): Promise<void> {
  if (!session.connection_url) {
    throw new Error("Realtime provider did not return a connection URL.");
  }
  const websocket = new WebSocket(
    session.connection_url,
    session.protocol_header ? [session.protocol_header] : undefined,
  );
  websocketRef.current = websocket;
  mediaStreamRef.current = stream;
  websocket.binaryType = "arraybuffer";

  await new Promise<void>((resolve, reject) => {
    const failTimer = window.setTimeout(() => {
      reject(new Error("Realtime provider connection timed out."));
    }, 12_000);

    websocket.onopen = () => {
      window.clearTimeout(failTimer);
      sendRealtimeJson(websocket, realtimeSessionUpdate(session));
      for (const initialGreeting of initialRealtimeGreetingEvents(session)) {
        sendRealtimeJson(websocket, initialGreeting);
      }
      startMicrophoneStreaming({
        inputAudioContextRef,
        processorRef,
        session,
        sourceRef,
        stream,
        websocket,
      });
      resolve();
    };
    websocket.onerror = () => {
      window.clearTimeout(failTimer);
      reject(new Error("Realtime provider connection failed."));
    };
  });

  websocket.onmessage = (event) => {
    onMessage(event.data, session);
  };
  websocket.onclose = (event) => {
    if (!isStopped() && event.code !== 1000) {
      onDisconnect(event.code);
    }
  };
}

function startMicrophoneStreaming({
  inputAudioContextRef,
  processorRef,
  session,
  sourceRef,
  stream,
  websocket,
}: {
  inputAudioContextRef: RefObject<AudioContext | null>;
  processorRef: RefObject<ScriptProcessorNode | null>;
  session: SetupVoiceAgentSessionRead;
  sourceRef: RefObject<MediaStreamAudioSourceNode | null>;
  stream: MediaStream;
  websocket: WebSocket;
}): void {
  const sampleRate = audioSampleRate(session.input_format);
  const audioContext = new AudioContext({ sampleRate });
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(2048, 1, 1);
  inputAudioContextRef.current = audioContext;
  processorRef.current = processor;
  sourceRef.current = source;
  processor.onaudioprocess = (event) => {
    if (websocket.readyState !== WebSocket.OPEN) {
      return;
    }
    const channel = event.inputBuffer.getChannelData(0);
    sendRealtimeJson(websocket, {
      audio: bytesToBase64(float32ToPcm16(channel)),
      type: "input_audio_buffer.append",
    });
  };
  source.connect(processor);
  processor.connect(audioContext.destination);
}

interface HandleRealtimeMessageProps {
  onDebugEvent?: (event: SetupVoiceAgentDebugEventCreate) => void;
  onOutputAudio: (
    base64Audio: string,
    session: SetupVoiceAgentSessionRead,
  ) => void;
  onProviderError: (message: string) => void;
  onSpeechStarted?: (
    message: RealtimeMessage,
    session: SetupVoiceAgentSessionRead,
  ) => void;
  onToolCall: (
    message: RealtimeMessage,
    session: SetupVoiceAgentSessionRead,
  ) => void;
  onTranscript: (turn: TranscriptTurn) => void;
  rawMessage: string | ArrayBuffer | Blob;
  session: SetupVoiceAgentSessionRead;
}

type TranscriptTurn = {
  final: boolean;
  id: string;
  role: "assistant" | "user";
  text: string;
};

export function handleRealtimeMessage({
  onDebugEvent,
  onOutputAudio,
  onProviderError,
  onSpeechStarted,
  onToolCall,
  onTranscript,
  rawMessage,
  session,
}: HandleRealtimeMessageProps): void {
  if (typeof rawMessage !== "string") {
    return;
  }
  let message: RealtimeMessage;
  try {
    message = JSON.parse(rawMessage) as RealtimeMessage;
  } catch {
    return;
  }
  const type = String(message.type ?? "");
  if (type === "conversation.created") {
    onDebugEvent?.({
      event_type: "conversation_created",
      metadata: { provider: session.provider },
      provider_conversation_id: textValue(message.conversation?.id),
      provider_event_id: textValue(message.event_id),
      provider_event_type: type,
      provider_session_id: session.provider_session_id,
    });
  }
  if (type === "input_audio_buffer.speech_started") {
    onDebugEvent?.({
      event_type: "speech_started",
      metadata: { provider: session.provider },
      provider_event_id: textValue(message.event_id),
      provider_event_type: type,
      provider_session_id: session.provider_session_id,
      text: "User speech started.",
    });
    onSpeechStarted?.(message, session);
    return;
  }
  if (type === "error") {
    const errorMessage =
      providerErrorMessage(message.error) ?? "Realtime provider returned an error.";
    onDebugEvent?.({
      event_type: "provider_error",
      metadata: { error: providerErrorMessage(message.error) ?? errorMessage },
      provider_event_id: textValue(message.event_id),
      provider_event_type: type,
      provider_session_id: session.provider_session_id,
      text: errorMessage,
    });
    onProviderError(errorMessage);
    return;
  }
  if (isFunctionCallDone(type, message)) {
    const call = toolCallFromRealtimeMessage(message);
    if (call) {
      onDebugEvent?.({
        event_type: "tool_call",
        metadata: {
          arguments: JSON.stringify(call.arguments),
          call_id: call.callId,
          tool_name: call.name,
        },
        provider_event_id: textValue(message.event_id),
        provider_event_type: type,
        provider_session_id: session.provider_session_id,
        role: "tool",
        text: call.name,
      });
    }
    onToolCall(message, session);
    return;
  }
  const transcript = transcriptTextFromRealtimeMessage(type, message);
  if (transcript) {
    onDebugEvent?.({
      event_type: "transcript",
      final: transcript.final,
      provider_event_id: transcript.id,
      provider_event_type: type,
      provider_session_id: session.provider_session_id,
      role: transcript.role,
      text: transcript.text,
    });
    onTranscript(transcript);
  }
  const outputAudio = outputAudioFromRealtimeMessage(type, message);
  if (outputAudio) {
    onOutputAudio(outputAudio, session);
  }
}

function textValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function sendToolOutput(
  websocketRef: RefObject<WebSocket | null>,
  callId: string,
  output: Record<string, unknown>,
): void {
  const websocket = websocketRef.current;
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    return;
  }
  const markdown = pick(output, "markdown");
  sendRealtimeJson(websocket, {
    item: {
      call_id: callId,
      output:
        typeof markdown === "string" && markdown.trim()
          ? markdown
          : JSON.stringify(output),
      type: "function_call_output",
    },
    type: "conversation.item.create",
  });
  sendRealtimeJson(websocket, { type: "response.create" });
}

interface ExecuteVoiceToolCallProps {
  applyResponse: (response: {
    profile: SetupProfileRead;
    progress_event: ProgressEventRead;
  }) => void;
  createEvent: (
    setupSessionId: string,
    event: NonNullable<ReturnType<typeof voiceEventFromToolCall>>,
  ) => Promise<VoiceToolCallResponse>;
  message: RealtimeMessage;
  onDebugEvent?: (event: SetupVoiceAgentDebugEventCreate) => void;
  sendOutput: (callId: string, output: Record<string, unknown>) => void;
  session: SetupVoiceAgentSessionRead;
}

type VoiceToolCallResponse = {
  event_type: string;
  profile: SetupProfileRead;
  progress_event: ProgressEventRead;
  tool_result_markdown?: string | null;
};

export async function executeVoiceToolCall({
  applyResponse,
  createEvent,
  message,
  onDebugEvent,
  sendOutput,
  session,
}: ExecuteVoiceToolCallProps): Promise<void> {
  const call = toolCallFromRealtimeMessage(message);
  if (!call) {
    return;
  }
  const event = voiceEventFromToolCall(call.name, call.arguments);
  if (!event) {
    sendOutput(call.callId, {
      error: "Unsupported tool",
      markdown: "# Tool Result\n\n- The requested setup tool is not supported.",
      ok: false,
    });
    return;
  }
  try {
    const response = await createEvent(session.setup_session_id, event);
    applyResponse(response);
    onDebugEvent?.({
      event_type: "tool_result",
      metadata: {
        call_id: call.callId,
        event_type: response.event_type,
        profile_completeness: response.profile.completeness,
        progress_event_id: response.progress_event.id ?? null,
        tool_result_markdown: response.tool_result_markdown ?? null,
        tool_name: call.name,
      },
      provider_session_id: session.provider_session_id,
      role: "tool",
      text: response.tool_result_markdown ?? response.event_type,
    });
    sendOutput(call.callId, {
      event_type: response.event_type,
      markdown:
        response.tool_result_markdown ??
        `# Tool Result\n\n- Tool event \`${response.event_type}\` saved successfully.`,
      ok: true,
      progress_event_id: response.progress_event.id,
      profile_completeness: response.profile.completeness,
    });
  } catch (caught) {
    const toolResultMarkdown =
      caught instanceof Error &&
      "toolResultMarkdown" in caught &&
      typeof caught.toolResultMarkdown === "string" &&
      caught.toolResultMarkdown.trim()
        ? caught.toolResultMarkdown.trim()
        : null;
    sendOutput(call.callId, {
      error:
        caught instanceof Error
          ? caught.message
          : "Failed to save setup voice event.",
      markdown:
        toolResultMarkdown ??
        "# Tool Result\n\n- The tool call failed before the backend returned a checklist receipt.",
      ok: false,
    });
  }
}

export function mergeVoiceTranscriptTurns(
  current: VoiceTranscriptTurn[],
  turn: TranscriptTurn,
): VoiceTranscriptTurn[] {
  const existingIndex = current.findIndex((entry) => entry.id === turn.id);
  const nextTurn: VoiceTranscriptTurn = {
    createdAt: new Date().toISOString(),
    final: turn.final,
    id: turn.id,
    role: turn.role,
    text: turn.text,
  };
  if (existingIndex === -1) {
    return [...current, nextTurn].slice(-20);
  }
  return current.map((entry, index) =>
    index === existingIndex
      ? {
          ...entry,
          final: turn.final,
          text:
            turn.role === "user" || turn.final
              ? turn.text
              : `${entry.text}${turn.text}`,
        }
      : entry,
  );
}

export function closeRealtimeResources({
  inputAudioContextRef,
  mediaStreamRef,
  processorRef,
  sourceRef,
  websocketRef,
}: RealtimeRefs): void {
  try {
    websocketRef.current?.close(1000, "setup interview stopped");
  } catch {
    // Browser close can throw if the socket is already closing.
  }
  websocketRef.current = null;
  processorRef.current?.disconnect();
  sourceRef.current?.disconnect();
  processorRef.current = null;
  sourceRef.current = null;
  void inputAudioContextRef.current?.close();
  inputAudioContextRef.current = null;
  stopMediaStream(mediaStreamRef);
}

function stopMediaStream(mediaStreamRef: RefObject<MediaStream | null>): void {
  for (const track of mediaStreamRef.current?.getTracks() ?? []) {
    track.stop();
  }
  mediaStreamRef.current = null;
}

interface StopAssistantPlaybackProps {
  nextPlaybackTimeRef: RefObject<number>;
  outputAudioSourcesRef: RefObject<Set<AudioBufferSourceNode>>;
}

export function stopAssistantPlayback({
  nextPlaybackTimeRef,
  outputAudioSourcesRef,
}: StopAssistantPlaybackProps): void {
  for (const source of outputAudioSourcesRef.current) {
    try {
      source.stop();
    } catch {
      // Stopping can throw if a source has already ended.
    }
    try {
      source.disconnect();
    } catch {
      // Disconnect can throw if the node is already disconnected.
    }
  }
  outputAudioSourcesRef.current.clear();
  nextPlaybackTimeRef.current = 0;
}

interface PlayPcm16AudioProps {
  base64Audio: string;
  nextPlaybackTimeRef: RefObject<number>;
  outputAudioContextRef: RefObject<AudioContext | null>;
  outputAudioSourcesRef: RefObject<Set<AudioBufferSourceNode>>;
  session: SetupVoiceAgentSessionRead;
}

export function playPcm16Audio({
  base64Audio,
  nextPlaybackTimeRef,
  outputAudioContextRef,
  outputAudioSourcesRef,
  session,
}: PlayPcm16AudioProps): void {
  const sampleRate = audioSampleRate(session.output_format);
  const bytes = base64ToBytes(base64Audio);
  if (bytes.byteLength < 2) {
    return;
  }
  const pcm16 = new Int16Array(
    bytes.buffer,
    bytes.byteOffset,
    Math.floor(bytes.byteLength / 2),
  );
  const audioContext =
    outputAudioContextRef.current ?? new AudioContext({ sampleRate });
  outputAudioContextRef.current = audioContext;
  const buffer = audioContext.createBuffer(1, pcm16.length, sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < pcm16.length; index += 1) {
    channel[index] = (pcm16[index] ?? 0) / 32768;
  }
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  outputAudioSourcesRef.current.add(source);
  source.onended = () => {
    outputAudioSourcesRef.current.delete(source);
  };
  const startAt = Math.max(
    audioContext.currentTime,
    nextPlaybackTimeRef.current,
  );
  source.start(startAt);
  nextPlaybackTimeRef.current = startAt + buffer.duration;
}
