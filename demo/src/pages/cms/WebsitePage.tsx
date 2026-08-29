import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { useCmsLayout } from "@/layout/CmsLayout";
import { cn } from "@/lib/cn";
import { listen, play, stop } from "@/lib/mock-voice";
import { ConnectModal } from "@/pages/cms/website/ConnectModal";
import {
  type EditorRail,
  EditorWorkspace,
} from "@/pages/cms/website/EditorWorkspace";
import type { SiteSection } from "@/pages/cms/website/FakeSite";
import { PreviewCanvas } from "@/pages/cms/website/PreviewCanvas";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";
import { DustOrb } from "@/ui/DustOrb";
import { TextArea } from "@/ui/Field";
import { Notice } from "@/ui/Notice";
import { PageHeading } from "@/ui/PageHeading";

const pages = [
  { id: "home", label: "Home", path: "/", title: "Bellfield Roofing | Dublin" },
  {
    id: "services",
    label: "Roof repairs",
    path: "/roof-repairs",
    title: "Roof repairs | Bellfield",
  },
  { id: "contact", label: "Contact", path: "/contact", title: "Contact" },
  { id: "privacy", label: "Privacy", path: "/privacy", title: "Privacy" },
  { id: "terms", label: "Terms", path: "/terms", title: "Terms" },
];

export function WebsitePage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const fromActivation = params.get("from") === "activation";
  const [rail, setRail] = useState<EditorRail>("pages");
  const [workspaceOpen, setWorkspaceOpen] = useState(
    params.get("workspace") === "1",
  );
  const [page, setPage] = useState("home");
  const [section, setSection] = useState<SiteSection | null>("hero");
  const [hidden, setHidden] = useState<Partial<Record<SiteSection, boolean>>>(
    {},
  );
  const [publishOpen, setPublishOpen] = useState(
    params.get("publication") === "1" ||
      params.get("subscription") === "canceled",
  );
  const [payBlocked, setPayBlocked] = useState(
    params.get("subscription") === "canceled",
  );
  const [connectOpen, setConnectOpen] = useState(params.get("connect") === "1");
  const [assistantOpen, setAssistantOpen] = useState(
    params.get("assistant") !== "collapsed",
  );
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [level, setLevel] = useState(0);
  const [askPending, setAskPending] = useState(params.get("ask") !== "0");
  const [copyout, setCopyout] = useState(params.get("copyout") === "1");
  const [notice, setNotice] = useState(false);
  const [planMode, setPlanMode] = useState(true);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    () =>
      window.matchMedia("(max-width: 1100px)").matches ? "mobile" : "desktop",
  );
  const [radius, setRadius] = useState("lg");
  const [density, setDensity] = useState("comfortable");
  const home = pages[0];
  if (!home) {
    throw new Error("website pages are empty");
  }
  const current = pages.find((item) => item.id === page) ?? home;

  function openContent(next: SiteSection): void {
    setSection(next);
    setRail("content");
    setWorkspaceOpen(true);
  }

  function selectRail(next: Exclude<EditorRail, "content">): void {
    if (rail === next && workspaceOpen) {
      setWorkspaceOpen(false);
      return;
    }
    setRail(next);
    setWorkspaceOpen(true);
  }

  function startVoice(): void {
    if (params.get("shot") === "1") {
      setVoiceOn(true);
      return;
    }
    setVoiceOn(true);
    play("/cms-voice-greeting.mp3", {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onLevel: setLevel,
    });
    listen({
      onSpeaking: setSpeaking,
      onLevel: setLevel,
      onDenied: () => {
        stop();
        setVoiceOn(false);
        setNotice(true);
      },
    });
  }

  return (
    <>
      <DevStrip
        groups={[
          {
            title: "Website",
            tabs: [
              {
                id: "publication",
                label: "Publish",
                on: publishOpen,
                onSelect: () => setPublishOpen(true),
              },
              {
                id: "subscription",
                label: "Subscription not active",
                on: payBlocked,
                onSelect: () => {
                  setPayBlocked(true);
                  setPublishOpen(true);
                },
              },
              {
                id: "connect",
                label: "Connect",
                on: connectOpen,
                onSelect: () => setConnectOpen(true),
              },
              {
                id: "assistant",
                label: "Assistant collapsed",
                on: !assistantOpen,
                onSelect: () => setAssistantOpen(false),
              },
              {
                id: "voice",
                label: "Voice agent",
                on: voiceOn,
                onSelect: startVoice,
              },
              {
                id: "ask",
                label: "Ask first pending",
                on: askPending,
                onSelect: () => setAskPending(true),
              },
              {
                id: "copyout",
                label: "Copy-out blocked",
                on: copyout,
                onSelect: () => setCopyout(true),
              },
              {
                id: "notice",
                label: "Notification",
                on: notice,
                onSelect: () => setNotice(true),
              },
              {
                id: "workspace",
                label: "Pages list",
                on: workspaceOpen && rail === "pages",
                onSelect: () => selectRail("pages"),
              },
              {
                id: "hero",
                label: "Hero",
                on: section === "hero" && rail === "content",
                onSelect: () => openContent("hero"),
              },
              {
                id: "reviews",
                label: "Reviews",
                on: section === "reviews" && rail === "content",
                onSelect: () => openContent("reviews"),
              },
              {
                id: "top-menu",
                label: "Top menu",
                on: section === "top-menu" && rail === "content",
                onSelect: () => openContent("top-menu"),
              },
              {
                id: "footer",
                label: "Footer",
                on: section === "footer" && rail === "content",
                onSelect: () => openContent("footer"),
              },
              {
                id: "form",
                label: "Website form",
                on: section === "form" && rail === "content",
                onSelect: () => openContent("form"),
              },
              {
                id: "seo",
                label: "SEO",
                on: workspaceOpen && rail === "seo",
                onSelect: () => selectRail("seo"),
              },
              {
                id: "styles",
                label: "Styles",
                on: workspaceOpen && rail === "styles",
                onSelect: () => selectRail("styles"),
              },
              {
                id: "versions",
                label: "Website versions",
                on: workspaceOpen && rail === "versions",
                onSelect: () => selectRail("versions"),
              },
              {
                id: "home-page",
                label: "Home",
                on: page === "home",
                onSelect: () => setPage("home"),
              },
            ],
          },
        ]}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 bg-white px-4 py-3">
          <div className="mx-auto grid min-h-[52px] max-w-[1580px] items-center gap-3 min-[1101px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] max-[1100px]:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0 max-[1100px]:col-span-2">
              <PageHeading
                onOpenDestinations={openDestinations}
                title="Website editor"
                titleClassName="text-[1.125rem] font-medium tracking-[-0.02em]"
              />
            </div>
            <ViewportSwitcher viewport={viewport} onViewport={setViewport} />
            <div className="relative justify-self-end">
              <Button onClick={() => setPublishOpen((value) => !value)}>
                Publish
              </Button>
              {publishOpen ? (
                <PublishMenu
                  fromActivation={fromActivation}
                  onBilling={() => {
                    void navigate({ to: "/cms/billing" });
                  }}
                  onConnect={() => setConnectOpen(true)}
                  onHero={() => openContent("hero")}
                  onMedia={() => {
                    void navigate({ to: "/cms/media" });
                  }}
                  payBlocked={payBlocked}
                />
              ) : null}
            </div>
          </div>
        </header>
        <div className="grid min-h-0 flex-1 min-[1101px]:grid-cols-[auto_minmax(0,1fr)] max-[1100px]:grid-cols-1 max-[1100px]:grid-rows-[minmax(0,1fr)_auto]">
          <EditorWorkspace
            current={current}
            density={density}
            hidden={hidden}
            onCollapse={() => setWorkspaceOpen(false)}
            onDensity={setDensity}
            onPage={setPage}
            onRadius={setRadius}
            onRail={selectRail}
            onToggleHidden={() => {
              if (!section) {
                return;
              }
              setHidden((currentHidden) => ({
                ...currentHidden,
                [section]: !currentHidden[section],
              }));
            }}
            open={workspaceOpen}
            page={page}
            pages={pages}
            radius={radius}
            rail={rail}
            section={section}
          />
          <div
            className={cn(
              "relative flex min-h-0 min-w-0 flex-col overflow-hidden max-[1100px]:row-start-1",
              "[--assistant-h:7rem] [--voice-orb:min(5.5rem,30vw)] [--voice-orb-hit:2.75rem]",
              "min-[1101px]:[--assistant-h:3.25rem] max-[480px]:[--voice-orb:min(50vw,50dvh)] max-[480px]:[--voice-orb-hit:min(12rem,42vw)]",
            )}
            data-editor-canvas
          >
            <PreviewCanvas
              assistantOpen={assistantOpen && !voiceOn}
              copyout={copyout}
              density={density}
              hidden={hidden}
              host={
                fromActivation
                  ? "bellfield-roofing-dublin.preview.placis.com"
                  : "acme-roofing-dublin.preview.placis.com"
              }
              onSelect={openContent}
              page={page}
              pending={askPending}
              radius={radius}
              selected={section}
              viewport={viewport}
              voiceOn={voiceOn}
            />
            <CanvasActions
              askPending={askPending}
              assistantOpen={assistantOpen}
              level={level}
              onAsk={() => setAskPending(false)}
              onRestore={() => {
                stop();
                setVoiceOn(false);
                setSpeaking(false);
                setAssistantOpen(true);
              }}
              onVoice={() => {
                setAssistantOpen(true);
                if (!voiceOn) {
                  startVoice();
                }
              }}
              speaking={speaking}
              voiceOn={voiceOn}
            />
            {assistantOpen && !voiceOn ? (
              <AssistantPanel
                planMode={planMode}
                onClose={() => setAssistantOpen(false)}
                onPlanMode={setPlanMode}
                onVoice={startVoice}
              />
            ) : null}
          </div>
        </div>
      </div>
      {connectOpen ? (
        <ConnectModal onClose={() => setConnectOpen(false)} />
      ) : null}
      {notice ? (
        <Notice
          message="Allow microphone access in your browser"
          onPrimary={() => setNotice(false)}
          onSecondary={startVoice}
          primary="Switch to text mode"
          secondary="Try again"
        />
      ) : null}
    </>
  );
}

const viewportOptions = [
  ["desktop", "Desktop", "M8 21h8M12 17v4", [2, 3, 20, 14]],
  ["tablet", "Tablet", "M12 18h.01", [4, 2, 16, 20]],
  ["mobile", "Mobile", "M12 18h.01", [5, 2, 14, 20]],
] as const;

function ViewportSwitcher({
  viewport,
  onViewport,
}: {
  viewport: "desktop" | "tablet" | "mobile";
  onViewport: (value: "desktop" | "tablet" | "mobile") => void;
}): ReactNode {
  return (
    <fieldset className="m-0 flex min-w-0 items-center gap-0.5 rounded-full border border-border bg-zinc-50 p-[3px] max-[1100px]:justify-self-start">
      <legend className="sr-only">Canvas width</legend>
      {viewportOptions.map(([id, label, path, box]) => (
        <button
          aria-label={label}
          aria-pressed={viewport === id}
          className={cn(
            "relative inline-flex items-center gap-1.5 rounded-full border-0 bg-transparent px-3 py-1.5 text-[12.5px] font-[450] text-muted-foreground max-[1100px]:size-11 max-[1100px]:min-w-11 max-[1100px]:justify-center max-[1100px]:gap-0 max-[1100px]:p-0",
            viewport === id
              ? "bg-secondary text-foreground shadow-[0_0_0_1px_var(--color-border)]"
              : "",
          )}
          key={id}
          onClick={() => onViewport(id)}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="block size-4 shrink-0 fill-none stroke-current stroke-[1.6] max-[1100px]:size-[18px]"
            viewBox="0 0 24 24"
          >
            <rect height={box[3]} rx="2" width={box[2]} x={box[0]} y={box[1]} />
            <path d={path} />
          </svg>
          <span className="max-[1100px]:sr-only">{label}</span>
        </button>
      ))}
    </fieldset>
  );
}

function PublishMenu({
  fromActivation,
  payBlocked,
  onBilling,
  onConnect,
  onHero,
  onMedia,
}: {
  fromActivation: boolean;
  payBlocked: boolean;
  onBilling: () => void;
  onConnect: () => void;
  onHero: () => void;
  onMedia: () => void;
}): ReactNode {
  return (
    <div className={card("absolute right-0 z-20 mt-2 w-80 p-3 shadow-card")}>
      <button
        className="flex w-full items-start justify-between gap-2 rounded-lg p-2 text-left hover:bg-zinc-50"
        type="button"
      >
        <span>
          <b className="block text-sm">
            {fromActivation
              ? "bellfield-roofing-dublin.preview.placis.com"
              : "acme-roofing-dublin.preview.placis.com"}
          </b>
          <span className="text-xs text-muted-foreground">
            {fromActivation ? "Not published yet" : "Last published 2 days ago"}
          </span>
        </span>
      </button>
      {fromActivation ? null : (
        <PublishBlockers
          onBilling={onBilling}
          onConnect={onConnect}
          onHero={onHero}
          onMedia={onMedia}
          payBlocked={payBlocked}
        />
      )}
    </div>
  );
}

function PublishBlockers({
  payBlocked,
  onBilling,
  onConnect,
  onHero,
  onMedia,
}: {
  payBlocked: boolean;
  onBilling: () => void;
  onConnect: () => void;
  onHero: () => void;
  onMedia: () => void;
}): ReactNode {
  return (
    <>
      <button
        className="mt-1 w-full rounded-lg p-2 text-left text-sm hover:bg-zinc-50"
        onClick={onConnect}
        type="button"
      >
        acme.ie · Waiting for DNS
      </button>
      <button
        className="w-full rounded-lg p-2 text-left text-sm hover:bg-zinc-50"
        onClick={onConnect}
        type="button"
      >
        New URL · Connect website address
      </button>
      <p className="mt-2 text-xs text-red-700">Publishing is blocked:</p>
      <ul className="list-disc pl-4 text-xs text-zinc-600">
        {payBlocked ? (
          <li>
            <button className="underline" onClick={onBilling} type="button">
              Pay the subscription price to Publish
            </button>
          </li>
        ) : (
          <>
            <li>
              <button className="underline" onClick={onHero} type="button">
                A required image on Hero cannot resolve
              </button>
            </li>
            <li>
              <button className="underline" onClick={onMedia} type="button">
                One media library item on the live path is not approved.
              </button>
            </li>
          </>
        )}
      </ul>
    </>
  );
}

function AssistantPanel({
  planMode,
  onClose,
  onPlanMode,
  onVoice,
}: {
  planMode: boolean;
  onClose: () => void;
  onPlanMode: (value: boolean) => void;
  onVoice: () => void;
}): ReactNode {
  return (
    <div
      className={card(
        "absolute inset-x-3 bottom-3 z-20 mx-auto max-w-lg p-4 shadow-card",
      )}
      id="assistantOverlay"
    >
      <div className="mb-2 flex items-center justify-between">
        <b className="text-sm">Assistant</b>
        <button onClick={onClose} type="button">
          Close
        </button>
      </div>
      <label className="mr-3 text-xs">
        <input
          checked={planMode}
          onChange={(event) => onPlanMode(event.target.checked)}
          type="checkbox"
        />{" "}
        Plan mode
      </label>
      <TextArea
        placeholder="e.g. Make the home website page focus on emergency call-outs"
        rows={2}
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button onClick={onVoice} variant="outline">
          Voice
        </Button>
        <Button>{planMode ? "Plan" : "Send"}</Button>
      </div>
    </div>
  );
}

const pillClass =
  "pointer-events-auto inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-semibold shadow-prompt";

function CanvasActions({
  askPending,
  assistantOpen,
  voiceOn,
  speaking,
  level,
  onAsk,
  onRestore,
  onVoice,
}: {
  askPending: boolean;
  assistantOpen: boolean;
  voiceOn: boolean;
  speaking: boolean;
  level: number;
  onAsk: () => void;
  onRestore: () => void;
  onVoice: () => void;
}): ReactNode {
  const collapsed = !assistantOpen || voiceOn;
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-[21] max-w-[calc(100%-24px)] items-center whitespace-nowrap",
        voiceOn
          ? "right-3 bottom-3 left-auto grid w-max grid-cols-[max-content_var(--voice-orb)] grid-rows-2 items-center gap-x-3 gap-y-2 isolation-isolate max-[1100px]:bottom-[calc(12px+env(safe-area-inset-bottom))] max-[1100px]:gap-x-5 max-[1100px]:gap-y-1.5"
          : cn(
              "left-1/2 flex -translate-x-1/2 gap-2.5",
              collapsed
                ? "bottom-[calc(20px+var(--assistant-h))]"
                : "bottom-[calc(20px+50%)]",
            ),
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
            onClick={onRestore}
            type="button"
          >
            Restore chatbot
          </button>
          <div className="relative col-start-2 row-start-1 row-span-2 grid size-[var(--voice-orb)] place-items-center justify-self-end self-center overflow-visible pointer-events-none isolation-isolate">
            <button
              aria-label="Restore chatbot"
              className="absolute top-0 right-0 z-[2] grid size-8 place-items-center rounded-full border-0 bg-transparent p-0 text-muted-foreground pointer-events-auto hover:text-foreground"
              onClick={onRestore}
              title="Restore chatbot"
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
              level={level}
              onClick={onVoice}
              speaking={speaking}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
