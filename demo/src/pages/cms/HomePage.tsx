import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { useCmsLayout } from "@/layout/CmsLayout";
import { cn } from "@/lib/cn";
import { chooserCard } from "@/ui/card";
import { VoiceInterviewOverlay } from "@/ui/VoiceInterviewOverlay";

export function HomePage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const [connected, setConnected] = useState(
    new URLSearchParams(window.location.search).get("connected") === "1",
  );
  const [connectOpen, setConnectOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const connectRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef(0);

  useEffect(() => {
    function onPointerDown(event: PointerEvent): void {
      const root = connectRef.current;
      if (!root || root.contains(event.target as Node)) {
        return;
      }
      setConnectOpen(false);
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setConnectOpen(false);
        setVoiceOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(closeTimer.current);
    };
  }, []);

  function hoverCapable(): boolean {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function openConnect(): void {
    window.clearTimeout(closeTimer.current);
    setConnectOpen(true);
  }

  function scheduleCloseConnect(): void {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setConnectOpen(false), 120);
  }

  return (
    <>
      <DevStrip
        groups={[
          {
            title: "Home",
            tabs: [
              {
                id: "connected",
                label: "All connected",
                on: connected,
                onSelect: () => {
                  setConnected(true);
                  setConnectOpen(false);
                },
              },
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
        {connected ? null : (
          <div
            className="flex w-full max-w-2xl flex-col items-stretch"
            ref={connectRef}
          >
            <div className="rounded-prompt relative z-[1] overflow-hidden border border-hairline bg-white shadow-none sm:shadow-prompt">
              <div className="flex items-center justify-between px-3 pt-2 pb-3">
                <button
                  aria-controls="mcpConnectPanel"
                  aria-expanded={connectOpen}
                  aria-haspopup="true"
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border border-hairline bg-white px-3 text-xs font-normal",
                    connectOpen ? "bg-zinc-50" : "",
                  )}
                  id="homeConnect"
                  onClick={() => {
                    if (hoverCapable()) {
                      return;
                    }
                    setConnectOpen((value) => !value);
                  }}
                  onMouseEnter={() => {
                    if (hoverCapable()) {
                      openConnect();
                    }
                  }}
                  onMouseLeave={() => {
                    if (hoverCapable()) {
                      scheduleCloseConnect();
                    }
                  }}
                  type="button"
                >
                  Connect
                </button>
              </div>
              <div
                aria-hidden={!connectOpen}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                  connectOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "pointer-events-none grid-rows-[0fr] opacity-0",
                )}
                id="mcpConnectPanel"
                onMouseEnter={() => {
                  if (hoverCapable()) {
                    openConnect();
                  }
                }}
                onMouseLeave={() => {
                  if (hoverCapable()) {
                    scheduleCloseConnect();
                  }
                }}
              >
                <div className="overflow-hidden">
                  <div className="px-3 pb-2.5 text-center sm:px-4 sm:pb-3">
                    <p className="m-0 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                      Link Google and Meta ad accounts.
                    </p>
                    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                      <BrandChip label="Google Ads campaigns" name="Google">
                        <GoogleMark />
                      </BrandChip>
                      <BrandChip label="Meta Ads campaigns" name="Meta">
                        <MetaMark />
                      </BrandChip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <rect
        fill="none"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
        width="18"
        x="3"
        y="3"
      />
      <path d="M9 3v18" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function BrandChip({
  label,
  name,
  children,
}: {
  label: string;
  name: string;
  children: ReactNode;
}): ReactNode {
  return (
    <button
      aria-label={`Connect ${label}`}
      className="inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-full border border-hairline bg-white px-2 text-[11px] font-medium text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 sm:px-2.5 sm:text-xs"
      type="button"
    >
      <span className="grid size-5 shrink-0 place-items-center overflow-hidden">
        {children}
      </span>
      {name}
    </button>
  );
}

function GoogleMark(): ReactNode {
  return (
    <svg aria-hidden="true" className="size-[18px]" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        className="fill-brand-google-blue"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        className="fill-brand-google-green"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        className="fill-brand-google-yellow"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        className="fill-brand-google-red"
      />
    </svg>
  );
}

function MetaMark(): ReactNode {
  return (
    <svg aria-hidden="true" className="size-[18px]" viewBox="0 0 24 24">
      <path
        d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
        className="fill-brand-facebook"
      />
    </svg>
  );
}
