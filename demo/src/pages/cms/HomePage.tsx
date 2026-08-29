import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { useCmsLayout } from "@/layout/CmsLayout";
import { chooserCard } from "@/ui/card";
import { VoiceInterviewOverlay } from "@/ui/VoiceInterviewOverlay";

export function HomePage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const [voiceOpen, setVoiceOpen] = useState(false);

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
        <h1 className="text-4xl font-normal tracking-tight">placis</h1>
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
            to="/cms/website"
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
            to="/cms/ads"
          />
        </div>
      </section>
      {voiceOpen ? (
        <VoiceInterviewOverlay onBack={() => setVoiceOpen(false)} />
      ) : null}
    </>
  );
}

function ChooserCard({
  to,
  title,
  hint,
  icon,
}: {
  to: "/cms/website" | "/cms/ads";
  title: string;
  hint: string;
  icon: ReactNode;
}): ReactNode {
  return (
    <Link
      className={chooserCard(
        "group flex items-center gap-4 px-5 py-[1.15rem] text-left transition-[background,box-shadow] duration-150 ease-out hover:bg-wash",
      )}
      to={to}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-[1rem] border border-hairline bg-wash text-foreground group-hover:bg-white">
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
    </Link>
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
