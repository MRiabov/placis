import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
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

export function OnboardingShell(): ReactNode {
  return (
    <OnboardingDevProvider>
      <OnboardingShellInner />
    </OnboardingDevProvider>
  );
}

function OnboardingShellInner(): ReactNode {
  const navigate = useNavigate();
  const { extraGroups } = useOnboardingDev();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const step = pathname.split("/").at(-1) ?? "find";
  const hideOrb = step === "preview" || step === "generated";
  const [guide, setGuide] = useState<"cue" | "listening" | "denied">("cue");
  const [speaking, setSpeaking] = useState(false);
  const [level, setLevel] = useState(0);

  useEffect(() => () => stop(), []);

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
          id: "generated",
          label: "Skip generation",
          on: step === "generated",
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
    if (shot) {
      return;
    }
    play("/onboarding-guide-intro.mp3", {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onLevel: setLevel,
    });
    listen({
      onSpeaking: setSpeaking,
      onLevel: setLevel,
      onDenied: () => {
        stop();
        setGuide("denied");
        setSpeaking(false);
        setLevel(0);
      },
    });
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <DevStrip groups={groups} />
      <header className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <Link aria-label="placis" to="/onboarding/find">
          <img
            alt="placis"
            className="h-8 w-auto"
            height={32}
            src="/placis-mark.png"
            width={81}
          />
        </Link>
      </header>
      {step !== "generated" ? (
        <nav
          aria-label="Onboarding progress"
          className="border-b border-border px-4 py-3"
        >
          <ol className="mx-auto flex max-w-3xl justify-between gap-2">
            {steps.map((item, index) => {
              const currentIndex = steps.findIndex(
                (entry) => entry.id === step,
              );
              const done =
                step === "generated" ||
                (currentIndex >= 0 && index < currentIndex);
              const current = item.id === step;
              return (
                <li key={item.id}>
                  <Link
                    className="flex items-center gap-2 text-sm"
                    to={item.to}
                  >
                    <i
                      className={cn(
                        "grid size-5 place-items-center rounded-full text-[10px]",
                        current || done
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </i>
                    <span
                      className={
                        current ? "text-foreground" : "text-muted-foreground"
                      }
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
      <main className="relative min-h-0 flex-1 overflow-auto">
        <Outlet />
        {hideOrb ? null : (
          <div className="absolute right-4 bottom-4 flex flex-col items-end gap-2">
            {guide === "cue" || guide === "denied" ? (
              <button
                className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs shadow-sm"
                onClick={startGuide}
                type="button"
              >
                {guide === "denied"
                  ? "Allow microphone access in your browser"
                  : "Click to turn on voice"}
              </button>
            ) : (
              <button
                className="text-xs text-muted-foreground underline"
                onClick={() => {
                  stop();
                  setGuide("cue");
                  setSpeaking(false);
                  setLevel(0);
                }}
                type="button"
              >
                Enable voice guide
              </button>
            )}
            <DustOrb
              level={level}
              onClick={startGuide}
              size={64}
              speaking={speaking}
            />
          </div>
        )}
      </main>
    </div>
  );
}
