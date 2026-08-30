import { type ReactNode, useEffect, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { useCmsLayout } from "@/layout/CmsLayout";
import { chooserCard } from "@/ui/card";
import { VoiceInterviewOverlay } from "@/ui/VoiceInterviewOverlay";

export function HomePage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [interviewGoal, setInterviewGoal] = useState<"website" | "ads">(
    "website",
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setVoiceOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <DevStrip
        groups={[
          {
            title: "Home",
            tabs: [
              {
                id: "home-voice",
                label: "Voice interview",
                on: voiceOpen,
                onSelect: () => setVoiceOpen((value) => !value),
              },
            ],
          },
        ]}
      />
      <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-7 px-4 py-16 sm:gap-10">
        <button
          aria-label="Open destinations"
          className="absolute top-3 left-3 grid size-9 place-items-center rounded-lg min-[1101px]:hidden"
          onClick={openDestinations}
          type="button"
        >
          <DestinationsGlyph />
        </button>
        <h1 className="text-4xl leading-tight tracking-[-0.03em] text-foreground whitespace-nowrap pb-px">
          placis
        </h1>
        <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <ChooserCard
            hint="Have Placis do your website"
            icon={
              <svg
                aria-hidden="true"
                className="size-[1.35rem]"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.6"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
              </svg>
            }
            title="Do my website…"
            onStart={() => {
              setInterviewGoal("website");
              setVoiceOpen(true);
            }}
          />
          <ChooserCard
            hint="Have Placis run your ads"
            icon={
              <svg
                aria-hidden="true"
                className="size-[1.35rem]"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.6"
                viewBox="0 0 24 24"
              >
                <path d="M4 8h10l6-4v16l-6-4H4z" />
              </svg>
            }
            title="Run my ads"
            onStart={() => {
              setInterviewGoal("ads");
              setVoiceOpen(true);
            }}
          />
        </div>
      </section>
      {voiceOpen ? (
        <VoiceInterviewOverlay
          goal={interviewGoal}
          onBack={() => setVoiceOpen(false)}
        />
      ) : null}
    </>
  );
}

function ChooserCard({
  title,
  hint,
  icon,
  onStart,
}: {
  title: string;
  hint: string;
  icon: ReactNode;
  onStart: () => void;
}): ReactNode {
  return (
    <button
      className={chooserCard(
        "group flex items-center gap-4 px-5 py-[1.15rem] text-left transition-[background,box-shadow] duration-150 ease-out hover:bg-wash",
      )}
      onClick={onStart}
      type="button"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full border border-stone-200 bg-background text-foreground transition group-hover:bg-zinc-50 dark:border-white/20 dark:bg-background dark:group-hover:bg-zinc-900">
        {icon}
      </span>
      <span className="grid min-w-0 gap-1">
        <b className="text-[1.05rem] font-semibold tracking-tight whitespace-nowrap">
          {title}
        </b>
        <span className="text-sm leading-snug text-muted-foreground">
          {hint}
        </span>
      </span>
    </button>
  );
}

function DestinationsGlyph(): ReactNode {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      <rect height="18" rx="2" width="18" x="3" y="3" />
      <path d="M9 3v18" />
    </svg>
  );
}
