import { Link } from "@tanstack/react-router";
import { Globe2, Megaphone } from "lucide-react";
import { type ReactNode, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { useCmsLayout } from "@/shell/CmsShell";

export function HomePage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const [connected, setConnected] = useState(
    new URLSearchParams(window.location.search).get("connected") === "1",
  );
  const [connectOpen, setConnectOpen] = useState(false);

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
                onSelect: () => setConnected(true),
              },
            ],
          },
        ]}
      />
      <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-10 px-4 py-16">
        <button
          aria-label="Open destinations"
          className="absolute top-3 left-3 grid size-9 place-items-center rounded-lg min-[1101px]:hidden"
          onClick={openDestinations}
          type="button"
        >
          <span className="sr-only">Open destinations</span>
          <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
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
            <path
              d="M9 3v18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        </button>
        <h1 className="text-4xl font-normal tracking-tight">placis</h1>
        <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <ChooserCard
            to="/cms/website"
            title="Do my website…"
            hint="Have Placis do your website"
            icon={<Globe2 className="size-5" />}
          />
          <ChooserCard
            to="/cms/ads"
            title="Run my ads"
            hint="Have Placis run your ads"
            icon={<Megaphone className="size-5" />}
          />
        </div>
        {connected ? null : (
          <div className="relative">
            <button
              className="rounded-full border border-dashed border-stone-200 px-3 py-1.5 text-sm text-zinc-600"
              onClick={() => setConnectOpen((value) => !value)}
              type="button"
            >
              Connect
            </button>
            {connectOpen ? (
              <div className="absolute top-full left-1/2 z-10 mt-2 w-64 -translate-x-1/2 rounded-xl border border-border bg-white p-3 shadow-md">
                <p className="text-sm text-muted-foreground">
                  Link Google and Meta ad accounts.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    type="button"
                  >
                    Google
                  </button>
                  <button
                    className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    type="button"
                  >
                    Meta
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
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
      className="flex items-center gap-4 rounded-[28px] border border-stone-200 bg-white px-5 py-4 text-left shadow-md hover:bg-zinc-50"
      to={to}
    >
      <span className="grid size-11 place-items-center rounded-[1rem] border border-stone-200 bg-zinc-50 text-foreground">
        {icon}
      </span>
      <span className="grid min-w-0 gap-1">
        <b className="text-[1.05rem] font-semibold tracking-tight whitespace-nowrap">
          {title}
        </b>
        <span className="text-sm text-muted-foreground">{hint}</span>
      </span>
    </Link>
  );
}
