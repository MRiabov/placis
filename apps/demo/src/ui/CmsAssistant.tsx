import { useRouterState } from "@tanstack/react-router";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/cn";
import { listen, play, stop } from "@/lib/mock-voice";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";
import { DustOrb } from "@/ui/DustOrb";
import { TextArea, TextInput } from "@/ui/Field";
import { GoogleSignUpButton } from "@/ui/GoogleSignUpButton";
import { Notice } from "@/ui/Notice";

export const assistantOrbVars =
  "[--assistant-h:7rem] [--voice-orb:min(5.5rem,30vw)] [--voice-orb-hit:2.75rem] min-[1101px]:[--assistant-h:3.25rem] max-[480px]:[--voice-orb:min(50vw,50dvh)] max-[480px]:[--voice-orb-hit:min(12rem,42vw)]";

const pillClass =
  "pointer-events-auto inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-semibold shadow-prompt";

function shotMode(): boolean {
  return new URLSearchParams(window.location.search).get("shot") === "1";
}

function urlCall(): { open: boolean; voiceOn: boolean } | null {
  const params = new URLSearchParams(window.location.search);
  const assistant = params.get("assistant");
  const voice = params.get("voice");
  if (assistant === "text") {
    return { open: true, voiceOn: false };
  }
  if (assistant === "1" || assistant === "expanded" || voice === "1") {
    return { open: true, voiceOn: true };
  }
  return null;
}

export type CmsAssistant = {
  open: boolean;
  voiceOn: boolean;
  speaking: boolean;
  planMode: boolean;
  notice: boolean;
  callAssistant: () => void;
  closeAssistant: () => void;
  startVoice: () => void;
  setPlanMode: (value: boolean) => void;
  retryMicrophone: () => void;
  switchToText: () => void;
  setNotice: (value: boolean) => void;
};

const CmsAssistantContext = createContext<CmsAssistant | null>(null);

export function useCmsAssistant(): CmsAssistant {
  const value = useContext(CmsAssistantContext);
  if (!value) {
    throw new Error("useCmsAssistant must be used inside CmsAssistantProvider");
  }
  return value;
}

export function CmsAssistantProvider({
  children,
  startText = false,
}: {
  children: ReactNode;
  startText?: boolean;
}): ReactNode {
  const start = useMemo(
    () =>
      urlCall() ??
      (startText
        ? { open: true, voiceOn: false }
        : { open: false, voiceOn: true }),
    [startText],
  );
  const [open, setOpen] = useState(start.open);
  const [voiceOn, setVoiceOn] = useState(start.voiceOn);
  const [speaking, setSpeaking] = useState(false);
  const [planMode, setPlanMode] = useState(true);
  const [notice, setNotice] = useState(false);
  const greetingRef = useRef(false);
  const ownerRef = useRef(false);

  function syncSpeaking(): void {
    setSpeaking(greetingRef.current || ownerRef.current);
  }

  function startVoice(): void {
    setOpen(true);
    setVoiceOn(true);
    setNotice(false);
    if (shotMode()) {
      return;
    }
    play("/cms-voice-greeting.mp3", {
      onStart: () => {
        greetingRef.current = true;
        syncSpeaking();
      },
      onEnd: () => {
        greetingRef.current = false;
        syncSpeaking();
      },
    });
    listen({
      onSpeaking: (on) => {
        ownerRef.current = on;
        syncSpeaking();
      },
      onDenied: () => {
        stop();
        greetingRef.current = false;
        ownerRef.current = false;
        setSpeaking(false);
        setNotice(true);
      },
    });
  }

  function callAssistant(): void {
    startVoice();
  }

  function closeAssistant(): void {
    stop();
    greetingRef.current = false;
    ownerRef.current = false;
    setOpen(false);
    setVoiceOn(true);
    setSpeaking(false);
    setNotice(false);
  }

  function switchToText(): void {
    stop();
    greetingRef.current = false;
    ownerRef.current = false;
    setOpen(true);
    setVoiceOn(false);
    setSpeaking(false);
    setNotice(false);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key !== "Escape" || !open) {
        return;
      }
      stop();
      greetingRef.current = false;
      ownerRef.current = false;
      setOpen(false);
      setVoiceOn(true);
      setSpeaking(false);
      setNotice(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const value: CmsAssistant = {
    open,
    voiceOn,
    speaking,
    planMode,
    notice,
    callAssistant,
    closeAssistant,
    startVoice,
    setPlanMode,
    retryMicrophone: startVoice,
    switchToText,
    setNotice,
  };

  return (
    <CmsAssistantContext.Provider value={value}>
      {children}
      {notice ? (
        <Notice
          message="Allow microphone access in your browser to talk. You can keep typing."
          onPrimary={switchToText}
          onSecondary={startVoice}
          primary="Switch to text mode"
          secondary="Try again"
        />
      ) : null}
    </CmsAssistantContext.Provider>
  );
}

export function AssistantLaunch({
  className,
}: {
  className?: string;
}): ReactNode {
  const { open, callAssistant } = useCmsAssistant();
  if (open) {
    return null;
  }
  return (
    <button
      aria-label="Assistant"
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground hover:bg-zinc-50 max-[1100px]:h-11 max-[1100px]:min-w-11",
        className,
      )}
      onClick={callAssistant}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="size-4 shrink-0 fill-none stroke-current stroke-[1.6]"
        viewBox="0 0 24 24"
      >
        <path d="M2 10v4M6 6v12M10 3v18M14 8v8M18 5v14M22 10v4" />
      </svg>
      <span>Assistant</span>
    </button>
  );
}

export function CmsAssistantLayer(): ReactNode {
  const pathname = useRouterState({
    select: (route) => route.location.pathname,
  });
  if (pathname.startsWith("/cms/website")) {
    return null;
  }
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-20",
        assistantOrbVars,
      )}
    >
      <AssistantSession />
    </div>
  );
}

export type AssistantThreadItem = {
  id: string;
  kind: "owner" | "assistant" | "tool_summary" | "thinking";
  body: string;
  icon: "write" | "think" | null;
};

type AssistantSessionProps = {
  website?: boolean;
  unpaid?: boolean;
  signedIn?: boolean;
  onSignUp?: () => void;
  onSend?: (prompt?: string) => void;
  askPending?: boolean;
  onAsk?: () => void;
  inFlight?: boolean;
  items?: AssistantThreadItem[];
};

export function AssistantSession({
  website = false,
  unpaid = false,
  signedIn = true,
  onSignUp,
  onSend,
  askPending = false,
  onAsk,
  inFlight = false,
  items = [],
}: AssistantSessionProps): ReactNode {
  const {
    open,
    voiceOn,
    speaking,
    planMode,
    setPlanMode,
    closeAssistant,
    switchToText,
    startVoice,
  } = useCmsAssistant();
  if (!open) {
    return null;
  }

  return (
    <>
      <CanvasActions
        askPending={askPending}
        onAsk={onAsk}
        speaking={speaking}
        startVoice={startVoice}
        switchToText={switchToText}
        voiceOn={voiceOn}
      />
      {voiceOn ? null : unpaid ? (
        <UnpaidComposer
          closeAssistant={closeAssistant}
          inFlight={inFlight}
          items={items}
          onSend={onSend}
          onSignUp={onSignUp}
          signedIn={signedIn}
          startVoice={startVoice}
        />
      ) : (
        <AssistantComposer
          closeAssistant={closeAssistant}
          onSend={onSend}
          planMode={planMode}
          setPlanMode={setPlanMode}
          startVoice={startVoice}
          website={website}
        />
      )}
    </>
  );
}

function CanvasActions({
  askPending,
  onAsk,
  speaking,
  startVoice,
  switchToText,
  voiceOn,
}: {
  askPending: boolean;
  onAsk: (() => void) | undefined;
  speaking: boolean;
  startVoice: () => void;
  switchToText: () => void;
  voiceOn: boolean;
}): ReactNode {
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-[21] max-w-[calc(100%-24px)] items-center whitespace-nowrap",
        voiceOn
          ? "right-3 bottom-3 left-auto grid w-max grid-cols-[max-content_var(--voice-orb)] grid-rows-2 items-center gap-x-3 gap-y-2 isolation-isolate max-[1100px]:bottom-[calc(12px+env(safe-area-inset-bottom))] max-[1100px]:gap-x-5 max-[1100px]:gap-y-1.5"
          : "left-1/2 flex -translate-x-1/2 gap-2.5 bottom-[calc(20px+var(--assistant-h))]",
      )}
      id="canvasActions"
    >
      {askPending ? (
        <div
          className={cn(
            "flex shrink-0 gap-2",
            voiceOn ? "col-start-1 row-start-1 justify-self-start" : "",
          )}
        >
          <button
            className={cn(
              pillClass,
              "border-0 bg-primary text-primary-foreground",
            )}
            onClick={onAsk}
            type="button"
          >
            Apply
          </button>
          <button
            className={cn(
              pillClass,
              "border border-border bg-white text-foreground",
            )}
            onClick={onAsk}
            type="button"
          >
            Reject
          </button>
        </div>
      ) : null}
      {voiceOn ? (
        <>
          <button
            className={cn(
              pillClass,
              "col-start-1 row-start-2 justify-self-start border border-border bg-white text-foreground",
            )}
            onClick={switchToText}
            type="button"
          >
            Switch to text mode
          </button>
          <div className="relative col-start-2 row-start-1 row-span-2 grid size-[var(--voice-orb)] place-items-center justify-self-end self-center overflow-visible pointer-events-none isolation-isolate">
            <button
              aria-label="Switch to text mode"
              className="absolute top-0 right-0 z-[2] grid size-8 place-items-center rounded-full border-0 bg-transparent p-0 text-muted-foreground pointer-events-auto hover:text-foreground"
              onClick={switchToText}
              title="Switch to text mode"
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-3.5 fill-none stroke-current stroke-[1.6]"
                viewBox="0 0 24 24"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <DustOrb
              aria-label="Voice agent"
              canvasClassName="absolute top-1/2 left-1/2 size-[var(--voice-orb)] -translate-x-1/2 -translate-y-1/2 bg-transparent"
              className="relative size-[var(--voice-orb-hit)] overflow-visible bg-transparent pointer-events-auto"
              live
              onClick={startVoice}
              speaking={speaking}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function AssistantThread({
  items,
}: {
  items: AssistantThreadItem[];
}): ReactNode {
  return (
    <ol
      className="grid max-h-40 gap-2 overflow-y-auto py-1"
      ref={(node) => {
        node?.scrollTo({ top: node.scrollHeight });
      }}
    >
      {items.map((item) => (
        <li
          className="flex items-start gap-2 text-xs leading-snug text-muted-foreground"
          key={item.id}
        >
          {item.icon === "write" ? (
            <svg
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0 stroke-current stroke-[1.6] fill-none"
              viewBox="0 0 24 24"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          ) : null}
          {item.icon === "think" ? (
            <svg
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0 stroke-current stroke-[1.6] fill-none"
              viewBox="0 0 24 24"
            >
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />
            </svg>
          ) : null}
          <span
            className={item.kind === "owner" ? "text-foreground" : undefined}
          >
            {item.body}
          </span>
        </li>
      ))}
    </ol>
  );
}

function UnpaidComposer({
  closeAssistant,
  inFlight,
  items,
  onSend,
  onSignUp,
  signedIn,
  startVoice,
}: {
  closeAssistant: () => void;
  inFlight: boolean;
  items: AssistantThreadItem[];
  onSend: ((prompt?: string) => void) | undefined;
  onSignUp: (() => void) | undefined;
  signedIn: boolean;
  startVoice: () => void;
}): ReactNode {
  const [threadOpen, setThreadOpen] = useState(true);
  const [prompt, setPrompt] = useState("");

  function send(): void {
    if (inFlight) {
      return;
    }
    const body =
      prompt.trim() || "Focus this website page on emergency call-outs";
    setPrompt("");
    setThreadOpen(true);
    onSend?.(body);
  }
  return (
    <div
      className={card(
        "absolute bottom-2 left-1/2 z-20 flex w-[min(32rem,calc(100%-1rem))] -translate-x-1/2 flex-col gap-1.5 p-2 shadow-card pointer-events-auto",
      )}
      id="assistantOverlay"
    >
      <div className="flex items-center gap-1 px-0.5">
        <button
          aria-expanded={threadOpen}
          aria-label={threadOpen ? "Reduce" : "Expand"}
          className="grid size-7 shrink-0 place-items-center text-muted-foreground"
          onClick={() => setThreadOpen((open) => !open)}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-4 fill-none stroke-current stroke-[1.6]"
            viewBox="0 0 24 24"
          >
            {threadOpen ? (
              <path d="m6 9 6 6 6-6" />
            ) : (
              <path d="m18 15-6-6-6 6" />
            )}
          </svg>
        </button>
        <b className="text-xs font-medium">Assistant</b>
        <button
          className="ml-auto text-xs text-muted-foreground"
          onClick={closeAssistant}
          type="button"
        >
          Close
        </button>
      </div>
      {threadOpen ? <AssistantThread items={items} /> : null}
      <TextInput
        disabled={inFlight}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) {
            return;
          }
          event.preventDefault();
          if (!signedIn) {
            onSignUp?.();
            return;
          }
          send();
        }}
        placeholder="e.g. Focus this website page on emergency call-outs"
        value={prompt}
      />
      <div className="flex gap-2 justify-stretch">
        {signedIn ? (
          <>
            <Button
              className="h-11 flex-1"
              disabled={inFlight}
              onClick={() => {
                if (inFlight) {
                  return;
                }
                startVoice();
                window.setTimeout(() => send(), 1400);
              }}
              variant="outline"
            >
              Voice
            </Button>
            <Button className="h-11 flex-1" disabled={inFlight} onClick={send}>
              Send
            </Button>
          </>
        ) : (
          <GoogleSignUpButton className="flex-1" onClick={onSignUp} />
        )}
      </div>
    </div>
  );
}

function AssistantComposer({
  closeAssistant,
  onSend,
  planMode,
  setPlanMode,
  startVoice,
  website,
}: {
  closeAssistant: () => void;
  onSend: (() => void) | undefined;
  planMode: boolean;
  setPlanMode: (value: boolean) => void;
  startVoice: () => void;
  website: boolean;
}): ReactNode {
  return (
    <div
      className={card(
        "absolute inset-x-3 bottom-3 z-20 mx-auto max-w-lg p-4 shadow-card pointer-events-auto",
      )}
      id="assistantOverlay"
    >
      <div className="mb-2 flex items-center justify-between gap-1">
        <b className="text-sm">Assistant</b>
        <button onClick={closeAssistant} type="button">
          Close
        </button>
      </div>
      {website ? (
        <label className="mr-3 text-xs">
          <input
            checked={planMode}
            onChange={(event) => setPlanMode(event.target.checked)}
            type="checkbox"
          />{" "}
          Plan mode
        </label>
      ) : null}
      <TextArea
        placeholder="e.g. Make the home website page focus on emergency call-outs"
        rows={2}
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button onClick={startVoice} variant="outline">
          Voice
        </Button>
        <Button onClick={() => onSend?.()}>
          {website && planMode ? "Plan" : "Send"}
        </Button>
      </div>
    </div>
  );
}
