import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { cn } from "@/lib/cn";
import { listen, play, stop } from "@/lib/mock-voice";
import { ConnectModal } from "@/pages/cms/website/ConnectModal";
import { ContentPanel } from "@/pages/cms/website/ContentPanel";
import { FakeSite, type SiteSection } from "@/pages/cms/website/FakeSite";
import { useCmsLayout } from "@/shell/CmsShell";
import { Button } from "@/ui/Button";
import { DustOrb } from "@/ui/DustOrb";
import { Field, TextArea, TextInput } from "@/ui/Field";
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

type Rail = "pages" | "seo" | "styles" | "versions" | "content";

export function WebsitePage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const fromActivation = params.get("from") === "activation";
  const [rail, setRail] = useState<Rail>("pages");
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
    "desktop",
  );
  const [radius, setRadius] = useState("lg");
  const [density, setDensity] = useState("comfortable");
  const current = pages.find((item) => item.id === page) ?? pages[0];

  function openContent(next: SiteSection): void {
    setSection(next);
    setRail("content");
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
                id: "hero",
                label: "Hero",
                on: section === "hero",
                onSelect: () => openContent("hero"),
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
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <PageHeading
            onOpenDestinations={openDestinations}
            title="Website editor"
          />
          <div className="flex rounded-lg border border-border">
            {(["desktop", "tablet", "mobile"] as const).map((item) => (
              <button
                className={cn(
                  "px-3 py-1.5 text-xs capitalize",
                  viewport === item
                    ? "bg-zinc-50 font-medium"
                    : "text-muted-foreground",
                )}
                key={item}
                onClick={() => setViewport(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="relative">
            <Button onClick={() => setPublishOpen((value) => !value)}>
              Publish
            </Button>
            {publishOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-border bg-white p-3 shadow-sm">
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
        </header>
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-secondary max-sm:hidden">
            <div className="flex border-b border-border">
              {(
                [
                  ["pages", "Website pages"],
                  ["seo", "SEO"],
                  ["styles", "Website styles"],
                  ["versions", "Website versions"],
                ] as const
              ).map(([id, label]) => (
                <button
                  className={cn(
                    "flex-1 px-1 py-2 text-[10px] leading-tight",
                    rail === id
                      ? "bg-white font-medium"
                      : "text-muted-foreground",
                  )}
                  key={id}
                  onClick={() => setRail(rail === id ? "pages" : id)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              {rail === "pages" ? (
                <div className="grid gap-1">
                  {pages.map((item) => (
                    <button
                      className={cn(
                        "flex items-baseline justify-between rounded-lg px-2 py-1.5 text-left text-sm",
                        page === item.id ? "bg-white" : "hover:bg-white/60",
                      )}
                      key={item.id}
                      onClick={() => setPage(item.id)}
                      type="button"
                    >
                      {item.label}
                      <small className="text-zinc-400">{item.path}</small>
                    </button>
                  ))}
                </div>
              ) : null}
              {rail === "seo" ? (
                <div className="grid gap-3">
                  <Field label="Website page title">
                    <TextInput defaultValue={current.title} key={current.id} />
                  </Field>
                  <Field label="Website page path">
                    <TextInput
                      defaultValue={current.path}
                      key={`${current.id}-path`}
                    />
                  </Field>
                  <Field label="Description">
                    <TextArea defaultValue="Dublin roofing repairs, re-roofs, and guttering." />
                  </Field>
                </div>
              ) : null}
              {rail === "styles" ? (
                <div className="grid gap-3">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-white p-3">
                    <div>
                      <strong className="text-sm">Navy &amp; Cream</strong>
                      <div className="mt-1 flex gap-1">
                        <span className="size-4 rounded-full bg-[#1f2933]" />
                        <span className="size-4 rounded-full bg-[#f5f1ea]" />
                        <span className="size-4 rounded-full bg-[#c4a574]" />
                      </div>
                    </div>
                    <Button disabled variant="outline">
                      Applied
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-white p-3">
                    <strong className="text-sm">Timbermill Classic</strong>
                    <Button variant="outline">Apply</Button>
                  </div>
                  <p className="text-[13px] text-zinc-600">Radius</p>
                  <div className="flex flex-wrap gap-1">
                    {["none", "xs", "sm", "md", "lg"].map((item) => (
                      <button
                        className={cn(
                          "rounded-full border px-2 py-1 text-xs",
                          radius === item ? "border-primary" : "border-border",
                        )}
                        key={item}
                        onClick={() => setRadius(item)}
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <p className="text-[13px] text-zinc-600">Density</p>
                  <div className="flex flex-wrap gap-1">
                    {["compact", "comfortable", "spacious"].map((item) => (
                      <button
                        className={cn(
                          "rounded-full border px-2 py-1 text-xs",
                          density === item ? "border-primary" : "border-border",
                        )}
                        key={item}
                        onClick={() => setDensity(item)}
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {rail === "versions" ? (
                <div className="grid gap-2 text-sm">
                  <p>
                    <b>Website version 3</b> · Live
                  </p>
                  <p className="text-muted-foreground">Website version 2</p>
                  <p className="text-muted-foreground">Website version 1</p>
                </div>
              ) : null}
              {rail === "content" && section ? (
                <ContentPanel
                  hidden={Boolean(hidden[section])}
                  onToggleHidden={() =>
                    setHidden((currentHidden) => ({
                      ...currentHidden,
                      [section]: !currentHidden[section],
                    }))
                  }
                  section={section}
                />
              ) : null}
            </div>
          </aside>
          <div className="relative min-w-0 flex-1 overflow-auto bg-[image:linear-gradient(rgb(39_39_42_/_4.5%)_1px,transparent_1px),linear-gradient(90deg,rgb(39_39_42_/_4.5%)_1px,transparent_1px)] bg-[size:24px_24px] p-6">
            <div
              className="mx-auto"
              style={{
                maxWidth:
                  viewport === "desktop"
                    ? 1080
                    : viewport === "tablet"
                      ? 760
                      : 390,
              }}
            >
              <FakeSite
                copyout={copyout}
                density={density}
                hidden={hidden}
                onSelect={openContent}
                page={page}
                pending={askPending}
                radius={radius}
                selected={section}
              />
            </div>
            {askPending ? (
              <div className="absolute top-4 right-4 flex gap-2">
                <Button onClick={() => setAskPending(false)}>Apply</Button>
                <Button onClick={() => setAskPending(false)} variant="outline">
                  Reject
                </Button>
              </div>
            ) : null}
            <DustOrb
              className="absolute right-4 bottom-4"
              level={level}
              onClick={() => {
                setAssistantOpen(true);
                if (!voiceOn) {
                  startVoice();
                }
              }}
              size={56}
              speaking={speaking}
            />
            {assistantOpen && !voiceOn ? (
              <div className="absolute inset-x-4 bottom-4 mx-auto max-w-lg rounded-xl border border-border bg-white p-4 shadow-sm">
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
            {voiceOn ? (
              <button
                className="absolute right-20 bottom-6 text-xs underline"
                onClick={() => {
                  stop();
                  setVoiceOn(false);
                  setSpeaking(false);
                }}
                type="button"
              >
                Restore chatbot
              </button>
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
