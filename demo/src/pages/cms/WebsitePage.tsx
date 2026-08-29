import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { cn } from "@/lib/cn";
import { listen, play, stop } from "@/lib/mock-voice";
import { ConnectModal } from "@/pages/cms/website/ConnectModal";
import {
  type EditorRail,
  EditorWorkspace,
} from "@/pages/cms/website/EditorWorkspace";
import type { SiteSection } from "@/pages/cms/website/FakeSite";
import { PreviewCanvas } from "@/pages/cms/website/PreviewCanvas";
import { useCmsLayout } from "@/shell/CmsShell";
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
    params.get("publication") === "1",
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
  const current = pages.find((item) => item.id === page) ?? pages[0];

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
            <fieldset className="cms-viewport-control m-0 min-w-0 max-[1100px]:justify-self-start">
              <legend className="sr-only">Canvas width</legend>
              <button
                aria-label="Desktop"
                aria-pressed={viewport === "desktop"}
                className={viewport === "desktop" ? "is-active" : ""}
                onClick={() => setViewport("desktop")}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect height="14" rx="2" width="20" x="2" y="3" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                <span>Desktop</span>
              </button>
              <button
                aria-label="Tablet"
                aria-pressed={viewport === "tablet"}
                className={viewport === "tablet" ? "is-active" : ""}
                onClick={() => setViewport("tablet")}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect height="20" rx="2" width="16" x="4" y="2" />
                  <path d="M12 18h.01" />
                </svg>
                <span>Tablet</span>
              </button>
              <button
                aria-label="Mobile"
                aria-pressed={viewport === "mobile"}
                className={viewport === "mobile" ? "is-active" : ""}
                onClick={() => setViewport("mobile")}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect height="20" rx="2" width="14" x="5" y="2" />
                  <path d="M12 18h.01" />
                </svg>
                <span>Mobile</span>
              </button>
            </fieldset>
            <div className="relative justify-self-end">
              <Button onClick={() => setPublishOpen((value) => !value)}>
                Publish
              </Button>
              {publishOpen ? (
                <div
                  className={card(
                    "absolute right-0 z-20 mt-2 w-80 p-3 shadow-card",
                  )}
                >
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
                        {fromActivation
                          ? "Not published yet"
                          : "Last published 2 days ago"}
                      </span>
                    </span>
                  </button>
                  {fromActivation ? null : (
                    <>
                      <button
                        className="mt-1 w-full rounded-lg p-2 text-left text-sm hover:bg-zinc-50"
                        onClick={() => setConnectOpen(true)}
                        type="button"
                      >
                        acme.ie · Waiting for DNS
                      </button>
                      <button
                        className="w-full rounded-lg p-2 text-left text-sm hover:bg-zinc-50"
                        onClick={() => setConnectOpen(true)}
                        type="button"
                      >
                        New URL · Connect website address
                      </button>
                      <p className="mt-2 text-xs text-red-700">
                        Publishing is blocked:
                      </p>
                      <ul className="list-disc pl-4 text-xs text-zinc-600">
                        <li>
                          <button
                            className="underline"
                            onClick={() => openContent("hero")}
                            type="button"
                          >
                            A required image on Hero cannot resolve
                          </button>
                        </li>
                        <li>
                          <button
                            className="underline"
                            onClick={() => {
                              void navigate({ to: "/cms/media" });
                            }}
                            type="button"
                          >
                            One media library item on the live path is not
                            approved.
                          </button>
                        </li>
                      </ul>
                    </>
                  )}
                </div>
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
              "cms-editor-canvas relative flex min-h-0 min-w-0 flex-col overflow-hidden max-[1100px]:row-start-1",
              voiceOn ? "is-voice" : "",
              !assistantOpen || voiceOn ? "is-assistant-collapsed" : "",
            )}
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
              <div
                className={card(
                  "absolute inset-x-3 bottom-3 z-20 mx-auto max-w-lg p-4 shadow-card",
                )}
                id="assistantOverlay"
              >
                <div className="mb-2 flex items-center justify-between">
                  <b className="text-sm">Assistant</b>
                  <button onClick={() => setAssistantOpen(false)} type="button">
                    Close
                  </button>
                </div>
                <label className="mr-3 text-xs">
                  <input
                    checked={planMode}
                    onChange={(event) => setPlanMode(event.target.checked)}
                    type="checkbox"
                  />{" "}
                  Plan mode
                </label>
                <TextArea
                  placeholder="e.g. Make the home website page focus on emergency call-outs"
                  rows={2}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button onClick={startVoice} variant="outline">
                    Voice
                  </Button>
                  <Button>{planMode ? "Plan" : "Send"}</Button>
                </div>
              </div>
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

const pillClass = "cms-ask-pill";

function CanvasActions({
  askPending,
  voiceOn,
  speaking,
  level,
  onAsk,
  onRestore,
  onVoice,
}: {
  askPending: boolean;
  voiceOn: boolean;
  speaking: boolean;
  level: number;
  onAsk: () => void;
  onRestore: () => void;
  onVoice: () => void;
}): ReactNode {
  return (
    <div className="cms-canvas-actions" id="canvasActions">
      {askPending ? (
        <div className="cms-ask-pills">
          <button
            className={`${pillClass} is-apply`}
            onClick={onAsk}
            type="button"
          >
            Apply
          </button>
          <button
            className={`${pillClass} is-reject`}
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
            className="cms-voice-restore"
            onClick={onRestore}
            type="button"
          >
            Restore chatbot
          </button>
          <div className="cms-voice-orb-wrap">
            <button
              aria-label="Restore chatbot"
              className="cms-voice-close"
              onClick={onRestore}
              title="Restore chatbot"
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <DustOrb
              aria-label="Voice agent"
              className={cn("cms-voice-orb", speaking ? "is-speaking" : "")}
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
