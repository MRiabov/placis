import { type ReactNode, useEffect, useRef, useState } from "react";

import { listen, stop } from "@/lib/mock-voice";
import { DustOrb } from "@/ui/DustOrb";

type VoiceInterviewOverlayProps = {
  onBack: () => void;
  goal?: "website" | "ads";
};

type InterviewQuestion = {
  id: string;
  input: "voice" | "number";
  prompt: string;
  placeholder?: string;
};

const questionsByGoal: Record<"website" | "ads", InterviewQuestion[]> = {
  website: [
    {
      id: "business",
      input: "voice",
      prompt: "Tell Placis about your business.",
    },
    {
      id: "cro",
      input: "number",
      prompt: "What is your CRO number?",
      placeholder: "e.g. 123456",
    },
    {
      id: "marketing_phone",
      input: "number",
      prompt: "What marketing phone should customers use?",
      placeholder: "e.g. 01 234 5678",
    },
    {
      id: "difference",
      input: "voice",
      prompt: "What makes your business different?",
    },
  ],
  ads: [
    {
      id: "offer",
      input: "voice",
      prompt: "What service do you want to advertise?",
    },
    {
      id: "cro",
      input: "number",
      prompt: "What is your CRO number?",
      placeholder: "e.g. 123456",
    },
    {
      id: "marketing_phone",
      input: "number",
      prompt: "What marketing phone should new leads call?",
      placeholder: "e.g. 01 234 5678",
    },
    {
      id: "audience",
      input: "voice",
      prompt: "Who would you like to reach?",
    },
  ],
};

function CompletePanel({ goal }: { goal: "website" | "ads" }): ReactNode {
  return (
    <div className="max-w-sm text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Thanks, we have what we need.
      </h1>
      <p className="mt-3 text-sm leading-snug text-muted-foreground">
        Placis is preparing your{" "}
        {goal === "website" ? "website" : "ad campaign"}.
      </p>
    </div>
  );
}

function NumberAnswerField({
  placeholder,
  value,
  onChange,
  onEnter,
}: {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
}): ReactNode {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <input
      className="mt-5 h-11 w-full max-w-sm rounded-full border border-stone-200 bg-background px-4 text-center text-sm outline-none placeholder:text-muted-foreground focus:border-zinc-400 dark:border-white/20 dark:focus:border-white/40"
      inputMode="numeric"
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onEnter();
        }
      }}
      placeholder={placeholder}
      ref={inputRef}
      type="tel"
      value={value}
    />
  );
}

function QuestionPanel({
  question,
  listening,
  speaking,
  numericAnswer,
  onToggleListen,
  onNumericChange,
  onEnter,
}: {
  question: InterviewQuestion;
  listening: boolean;
  speaking: boolean;
  numericAnswer: string;
  onToggleListen: () => void;
  onNumericChange: (value: string) => void;
  onEnter: () => void;
}): ReactNode {
  return (
    <>
      {question.input === "voice" ? (
        <DustOrb
          aria-label={listening ? "Pause interview" : "Resume interview"}
          aria-pressed={listening}
          className={`size-[min(20rem,70vw)] shrink-0 ${speaking ? "scale-110" : ""}`}
          live={listening}
          speaking={speaking}
          onClick={onToggleListen}
        />
      ) : null}
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <h1
          className={`text-xl font-semibold tracking-tight sm:text-2xl ${question.input === "voice" ? "mt-6 whitespace-nowrap" : ""}`}
        >
          {question.prompt}
        </h1>
        {question.input === "number" ? (
          <NumberAnswerField
            key={question.id}
            onChange={onNumericChange}
            onEnter={onEnter}
            placeholder={question.placeholder ?? ""}
            value={numericAnswer}
          />
        ) : null}
      </div>
    </>
  );
}

export function VoiceInterviewOverlay({
  onBack,
  goal = "website",
}: VoiceInterviewOverlayProps): ReactNode {
  const questions = questionsByGoal[goal];
  const [questionIndex, setQuestionIndex] = useState(0);
  const [numericAnswer, setNumericAnswer] = useState("");
  const [listening, setListening] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const silenceTimerRef = useRef<number | undefined>(undefined);
  const question = questions[questionIndex];
  const complete = questionIndex === questions.length;
  const advanceRef = useRef<() => void>(() => undefined);

  function advance(): void {
    if (!question || (question.input === "number" && !numericAnswer.trim())) {
      return;
    }
    setListening(false);
    setNumericAnswer("");
    setQuestionIndex((index) => index + 1);
  }

  advanceRef.current = advance;

  function handleVoiceOrb(): void {
    setListening((active) => !active);
  }

  useEffect(() => {
    if (question?.input !== "voice" || !listening) {
      setSpeaking(false);
      stop();
      return;
    }

    listen({
      onDenied: () => setListening(false),
      onSpeaking: (active) => {
        setSpeaking(active);
        if (silenceTimerRef.current !== undefined) {
          window.clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = undefined;
        }
        // A completed spoken answer advances naturally after a short silence,
        // so the interview never needs a visible submit control.
        if (!active) {
          silenceTimerRef.current = window.setTimeout(() => {
            silenceTimerRef.current = undefined;
            advanceRef.current();
          }, 700);
        }
      },
    });

    return () => {
      if (silenceTimerRef.current !== undefined) {
        window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = undefined;
      }
      stop();
    };
  }, [question?.input, listening]);

  return (
    <div
      aria-hidden="false"
      className="animate-voice-fade fixed inset-0 z-[90] flex flex-col overflow-hidden bg-white text-foreground"
    >
      <button
        className="absolute top-4 left-4 z-[2] inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white/86 px-3.5 text-[13px] font-medium shadow-[0_4px_18px_rgb(9_9_11/8%)] backdrop-blur-lg hover:bg-zinc-50"
        onClick={onBack}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          viewBox="0 0 24 24"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back
      </button>
      <section className="animate-voice-rise flex min-h-dvh flex-col items-center justify-center px-6 pt-16 pb-8">
        {complete ? (
          <CompletePanel goal={goal} />
        ) : question ? (
          <QuestionPanel
            listening={listening}
            numericAnswer={numericAnswer}
            onEnter={advance}
            onNumericChange={setNumericAnswer}
            onToggleListen={handleVoiceOrb}
            question={question}
            speaking={speaking}
          />
        ) : null}
      </section>
    </div>
  );
}
