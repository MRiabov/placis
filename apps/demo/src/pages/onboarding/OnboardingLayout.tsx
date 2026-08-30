import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { type DevGroup, DevStrip } from "@/dev/DevStrip";
import { cn } from "@/lib/cn";
import { listen, play, stop } from "@/lib/mock-voice";
import {
  OnboardingDevProvider,
  useOnboardingDev,
} from "@/pages/onboarding/onboarding-dev";
import { DustOrb } from "@/ui/DustOrb";

const steps = [
  { id: "find", label: "Find", to: "/onboarding/find" },
  { id: "review", label: "Review", to: "/onboarding/review" },
  { id: "interview", label: "Questions", to: "/onboarding/interview" },
  { id: "preview", label: "Website", to: "/onboarding/preview" },
] as const;

const cueTurnOn = "Click to turn on voice";
const cueMicDenied = "Allow microphone access in your browser";

export function OnboardingLayout(): ReactNode {
  return (
    <OnboardingDevProvider>
      <OnboardingLayoutInner />
    </OnboardingDevProvider>
  );
}

function OnboardingLayoutInner(): ReactNode {
  const navigate = useNavigate();
  const { extraGroups } = useOnboardingDev();
  const pathname = useRouterState({
    select: (route) => route.location.pathname,
  });
  const step = pathname.split("/").filter(Boolean).at(-1) ?? "find";
  const generated = step === "generated";
  const previewAndEdit = step === "preview-and-edit";
  const canvas = generated || previewAndEdit;
  const hideOrb = step === "preview" || canvas;
  const [guide, setGuide] = useState<"cue" | "listening" | "dismissed">("cue");
  const [cueCopy, setCueCopy] = useState(cueTurnOn);
  const [speaking, setSpeaking] = useState(false);
  const greetingRef = useRef(false);
  const ownerRef = useRef(false);

  function syncSpeaking(): void {
    setSpeaking(greetingRef.current || ownerRef.current);
  }

  useEffect(() => () => stop(), []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("guide") === "1") {
      setGuide("listening");
    }
  }, []);

  const groups: DevGroup[] = [
    {
      title: "Onboarding",
      tabs: [
        ...steps.map((item) => ({
          id: item.id,
          label: item.label,
          on: step === item.id,
          onSelect: () => {
            void navigate({ to: item.to });
          },
        })),
        {
          id: "preview-and-edit",
          label: "Website preview",
          on: previewAndEdit,
          onSelect: () => {
            void navigate({ to: "/onboarding/preview-and-edit" });
          },
        },
        {
          id: "generated",
          label: "Skip generation",
          on: generated,
          onSelect: () => {
            void navigate({ to: "/onboarding/generated" });
          },
        },
      ],
    },
    ...extraGroups,
  ];

  function startGuide(): void {
    const shot =
      new URLSearchParams(window.location.search).get("shot") === "1";
    setGuide("listening");
    setCueCopy(cueTurnOn);
    if (shot) {
      return;
    }
    play("/onboarding-guide-intro.mp3", {
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
        setGuide("cue");
        setCueCopy(cueMicDenied);
        setSpeaking(false);
      },
    });
  }

  function stopGuide(): void {
    stop();
    greetingRef.current = false;
    ownerRef.current = false;
    setGuide("dismissed");
    setSpeaking(false);
  }

  const currentIndex = steps.findIndex((entry) => entry.id === step);
  const showBack = !canvas && step !== "find";

  return (
    <div className="flex h-full flex-col bg-background">
      <DevStrip groups={groups} />
      {canvas ? null : (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border">
          <div className="mx-auto flex h-14 w-[min(72rem,calc(100%-2.5rem))] items-center justify-between">
            <Link aria-label="placis" to="/onboarding/find">
              <img
                alt="placis"
                className="block h-8 w-[81px]"
                height={32}
                src="/placis-mark.png"
                width={81}
              />
            </Link>
            {showBack ? (
              <button
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-zinc-50"
                onClick={() => {
                  const previous = steps[Math.max(0, currentIndex - 1)];
                  if (!previous) {
                    return;
                  }
                  void navigate({ to: previous.to });
                }}
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
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back
              </button>
            ) : null}
          </div>
        </header>
      )}
      {canvas ? null : (
        <nav
          aria-label="Onboarding progress"
          className="mx-auto w-[min(72rem,calc(100%-2.5rem))] pt-4"
        >
          <ol className="m-0 grid list-none grid-cols-4 gap-2 p-0">
            {steps.map((item, index) => {
              const done = currentIndex >= 0 && index < currentIndex;
              const current = item.id === step;
              return (
                <li key={item.id}>
                  <Link className="grid w-full gap-2 text-left" to={item.to}>
                    <i
                      className={cn(
                        "block h-[3px] rounded-full",
                        current || done ? "bg-primary" : "bg-border",
                      )}
                    />
                    <span
                      className={cn(
                        "block overflow-hidden text-[11px] font-medium tracking-wide text-ellipsis whitespace-nowrap",
                        current ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <main
        className={cn(
          "relative min-h-0 flex-1 overflow-auto",
          canvas
            ? "flex flex-col overflow-hidden p-0"
            : hideOrb
              ? "pt-5"
              : "pt-5 pb-[max(8rem,calc(5.5rem+2.5rem))]",
        )}
      >
        <Outlet />
      </main>
      {hideOrb || guide === "dismissed" ? null : (
        <div className="fixed right-4 bottom-4 z-50 h-[min(5.5rem,30vw)] w-[min(5.5rem,30vw)] overflow-visible">
          <DustOrb
            aria-label={
              guide === "listening" ? "Assistant on" : "Turn on Assistant"
            }
            aria-pressed={guide === "listening"}
            className="size-full"
            live={guide === "listening"}
            onClick={() => {
              if (guide === "listening") {
                return;
              }
              startGuide();
            }}
            speaking={speaking}
          />
          <button
            aria-label="Turn off Assistant"
            className="absolute -top-[0.35rem] -left-[0.35rem] z-[1] grid size-6 place-items-center rounded-full border border-border bg-white text-[14px] leading-none"
            onClick={stopGuide}
            type="button"
          >
            ×
          </button>
          {guide === "cue" ? (
            <button
              className="absolute right-[calc(100%+0.5rem)] bottom-[0.85rem] grid w-max max-w-[12.5rem] justify-items-end gap-0.5 rounded-[0.55rem] bg-white px-2.5 pt-1.5 pb-2 text-right shadow-[0_1px_2px_rgb(0_0_0/4%),0_4px_16px_rgb(0_0_0/5%)]"
              onClick={startGuide}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="-mr-0.5 h-10 w-[3.75rem] overflow-visible text-foreground"
                viewBox="0 0 72 48"
              >
                <defs>
                  <marker
                    id="onb-cue-head"
                    markerHeight="8"
                    markerWidth="8"
                    orient="auto"
                    refX="6"
                    refY="4"
                  >
                    <polygon
                      fill="currentColor"
                      points="0 0.4, 8 4, 0 7.6"
                      stroke="none"
                    />
                  </marker>
                </defs>
                <path
                  d="M8 10c18-4 38 2 50 26"
                  fill="none"
                  markerEnd="url(#onb-cue-head)"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
              <p className="m-0 text-[13px] font-medium leading-tight">
                {cueCopy}
              </p>
            </button>
          ) : null}
        </div>
      )}
      {hideOrb || guide !== "dismissed" ? null : (
        <button
          className="fixed right-4 bottom-4 z-50 h-9 rounded-lg border border-border bg-background px-3.5 text-sm"
          onClick={startGuide}
          type="button"
        >
          Enable Assistant
        </button>
      )}
    </div>
  );
}
