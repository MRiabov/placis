import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { photo } from "@/lib/fixtures";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";
import { Field, Select, TextArea, TextInput } from "@/ui/Field";
import { Sweep } from "@/ui/Sweep";

const fmtNames: Record<string, string> = {
  feed_square: "Square feed",
  feed_portrait: "Portrait feed",
  carousel: "Carousel",
  story: "Story",
};

const sweepRatio: Record<string, string> = {
  feed_square: "1 / 1",
  feed_portrait: "4 / 5",
  carousel: "1 / 1",
  story: "9 / 16",
};

type Thumb = {
  id: string;
  src: string;
  busy?: boolean;
};

const uploadReadyMs = 10_000;

const initialThumbs: Thumb[] = [
  { id: "0", src: photo(3) },
  { id: "1", src: photo(1) },
  { id: "2", src: photo(2) },
  { id: "busy", src: photo(0), busy: true },
];

type AdsReviewProps = {
  format: string;
  shot: boolean;
};

export function AdsReview({ format, shot }: AdsReviewProps): ReactNode {
  const fileRef = useRef<HTMLInputElement>(null);
  const [thumbs, setThumbs] = useState(initialThumbs);
  const [selected, setSelected] = useState("0");
  const [headline, setHeadline] = useState("New roof, done right");
  const [body, setBody] = useState(
    "We replace and repair roofs across Kildare. Free quotes, 10+ years experience. Get yours this week.",
  );
  const [shortLabel, setShortLabel] = useState("Free quotes");
  const [cta, setCta] = useState("Get Quote");
  const [leadTitle, setLeadTitle] = useState("Get a free roof quote");
  const [cleanupOpen, setCleanupOpen] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [split, setSplit] = useState(50);
  const [prompt, setPrompt] = useState<string | null>(shot ? "headline" : null);
  const [promptText, setPromptText] = useState("");
  const [plat, setPlat] = useState<"facebook" | "instagram">("facebook");
  const [narrow, setNarrow] = useState(
    () => window.matchMedia("(max-width: 720px)").matches,
  );
  const selectedSrc =
    thumbs.find((item) => item.id === selected && !item.busy)?.src ?? photo(3);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const sync = () => setNarrow(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const timers = initialThumbs
      .filter((thumb) => thumb.busy)
      .map((thumb) =>
        window.setTimeout(() => {
          setThumbs((current) =>
            current.map((item) =>
              item.id === thumb.id ? { ...item, busy: false } : item,
            ),
          );
        }, uploadReadyMs),
      );
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  function restoreCleanup(): void {
    setAccepted(false);
    setSplit(50);
    setCleanupOpen(true);
  }

  return (
    <div className="grid gap-4">
      <div>
        <p className="mb-2 text-[13px] text-zinc-600">Photos</p>
        <div className="flex flex-wrap gap-2">
          {thumbs.map((thumb) =>
            thumb.busy ? (
              <div
                aria-busy="true"
                className="relative size-20 overflow-hidden rounded-lg border border-border"
                key={thumb.id}
              >
                <img
                  alt=""
                  className="size-full object-cover"
                  src={thumb.src}
                />
                <span className="absolute inset-0 grid place-items-center bg-white/80 text-[10px]">
                  Uploading…
                </span>
                <button
                  aria-label="Cancel upload"
                  className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-white text-xs"
                  onClick={() =>
                    setThumbs((current) =>
                      current.filter((item) => item.id !== thumb.id),
                    )
                  }
                  type="button"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                aria-pressed={selected === thumb.id}
                className={cn(
                  "relative h-[88px] w-[88px] overflow-hidden rounded-xl border p-0",
                  selected === thumb.id
                    ? "border-primary shadow-[0_0_0_2px_var(--color-primary)]"
                    : "border-hairline",
                )}
                key={thumb.id}
                onClick={() => {
                  setSelected(thumb.id);
                  restoreCleanup();
                }}
                type="button"
              >
                <img
                  alt=""
                  className="pointer-events-none size-full object-cover object-[50%_32%]"
                  draggable={false}
                  src={thumb.src}
                />
              </button>
            ),
          )}
          <button
            className="grid h-[88px] w-[88px] place-items-center rounded-xl border border-dashed border-stone-300 text-sm font-semibold text-foreground"
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            + Add
          </button>
        </div>
        <input
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            const id = `up-${file.name}`;
            setThumbs((current) => [
              ...current,
              { id, src: URL.createObjectURL(file), busy: true },
            ]);
            window.setTimeout(() => {
              setThumbs((current) =>
                current.map((item) =>
                  item.id === id ? { ...item, busy: false } : item,
                ),
              );
            }, uploadReadyMs);
            event.target.value = "";
          }}
          ref={fileRef}
          type="file"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Tip: drag a photo anywhere on this page to add it.
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-red-700">
          Couldn&apos;t upload that photo — try again
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <b className="text-sm">Cleanup edit</b>
          <PromptOrb
            onGenerate={restoreCleanup}
            open={prompt === "cleanup"}
            placeholder="How should this photo be cleaned up?"
            promptText={promptText}
            setOpen={(open) => setPrompt(open ? "cleanup" : null)}
            setPromptText={setPromptText}
          />
        </div>
        {cleanupOpen ? (
          <>
            <p className="mb-2 flex gap-3 text-xs text-muted-foreground">
              <span>Clutter · high</span>
              <span>Lighting · medium</span>
            </p>
            <Sweep
              accepted={accepted}
              aspect={sweepRatio[format] ?? "1 / 1"}
              onSplit={setSplit}
              split={split}
              src={selectedSrc}
            />
            <div className="mt-2 flex gap-2">
              <Button onClick={() => setCleanupOpen(false)} variant="outline">
                Reject
              </Button>
              <Button
                onClick={() => {
                  setAccepted(true);
                  setSplit(100);
                }}
              >
                Accept
              </Button>
            </div>
          </>
        ) : null}
      </div>

      <CopyField count={`${headline.length} / 40`} label="Headline">
        <div className="relative">
          <TextInput
            maxLength={40}
            onChange={(event) => setHeadline(event.target.value)}
            value={headline}
          />
          <PromptOrb
            className="absolute top-1.5 right-1.5"
            onGenerate={() => undefined}
            open={prompt === "headline"}
            placeholder="How should this headline change?"
            promptText={promptText}
            setOpen={(open) => setPrompt(open ? "headline" : null)}
            setPromptText={setPromptText}
          />
        </div>
      </CopyField>
      <CopyField count={`${body.length} / 5000`} label="Text">
        <div className="relative">
          <TextArea
            maxLength={5000}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            value={body}
          />
          <PromptOrb
            className="absolute top-1.5 right-1.5"
            onGenerate={() => undefined}
            open={prompt === "text"}
            placeholder="How should this text change?"
            promptText={promptText}
            setOpen={(open) => setPrompt(open ? "text" : null)}
            setPromptText={setPromptText}
          />
        </div>
      </CopyField>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Button">
          <Select onChange={(event) => setCta(event.target.value)} value={cta}>
            <option>Get Quote</option>
            <option>Learn More</option>
            <option>Call Now</option>
          </Select>
        </Field>
        <CopyField
          count={`${shortLabel.length} / 30`}
          label="Short label — optional"
        >
          <TextInput
            maxLength={30}
            onChange={(event) => setShortLabel(event.target.value)}
            value={shortLabel}
          />
        </CopyField>
      </div>
      <Field label="Ad lead form title">
        <TextInput
          onChange={(event) => setLeadTitle(event.target.value)}
          value={leadTitle}
        />
      </Field>

      <div>
        <p className="mb-2 text-[13px] text-zinc-600">Ad format preview</p>
        <div className="mb-3 flex gap-1 rounded-lg border border-border p-1">
          {(["facebook", "instagram"] as const).map((item) => (
            <button
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-sm",
                plat === item
                  ? "bg-zinc-50 font-medium"
                  : "text-muted-foreground",
              )}
              key={item}
              onClick={() => setPlat(item)}
              type="button"
            >
              {item === "facebook" ? "Facebook" : "Instagram"}
            </button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(["facebook", "instagram"] as const).map((item) => {
            if (narrow && item !== plat) {
              return null;
            }
            return (
              <PreviewCard
                body={body}
                cta={cta}
                format={format}
                headline={headline}
                key={item}
                platform={item}
                shortLabel={shortLabel}
                src={selectedSrc}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CopyField({
  label,
  count,
  children,
}: {
  label: string;
  count: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="grid gap-2">
      <span className="flex justify-between text-[13px] text-zinc-600">
        {label}
        <span className="text-muted-foreground">{count}</span>
      </span>
      {children}
    </div>
  );
}

function PromptOrb({
  open,
  setOpen,
  promptText,
  setPromptText,
  placeholder,
  onGenerate,
  className,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  promptText: string;
  setPromptText: (value: string) => void;
  placeholder: string;
  onGenerate: () => void;
  className?: string;
}): ReactNode {
  return (
    <div className={cn("relative", className)}>
      <button
        aria-expanded={open}
        aria-label="Prompt"
        className="grid size-11 place-items-center rounded-[10px] border border-stone-300 bg-zinc-50 text-foreground"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-[18px]"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          <path d="M20 3v4" />
          <path d="M22 5h-4" />
          <path d="M4 17v2" />
          <path d="M5 18H3" />
        </svg>
      </button>
      {open ? (
        <div
          className={card("absolute top-9 right-0 z-20 w-64 p-2 shadow-card")}
        >
          <TextArea
            onChange={(event) => setPromptText(event.target.value)}
            placeholder={placeholder}
            rows={2}
            value={promptText}
          />
          <div className="mt-2 flex justify-end">
            <Button
              disabled={!promptText.trim()}
              onClick={() => {
                onGenerate();
                setPromptText("");
                setOpen(false);
              }}
            >
              Generate
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PreviewCard({
  platform,
  format,
  headline,
  body,
  shortLabel,
  cta,
  src,
}: {
  platform: "facebook" | "instagram";
  format: string;
  headline: string;
  body: string;
  shortLabel: string;
  cta: string;
  src: string;
}): ReactNode {
  const story = format === "story";
  const carousel = format === "carousel";
  const name =
    platform === "facebook" ? "Bellfield Roofing" : "bellfieldroofing";
  const cap = `${platform === "facebook" ? "Facebook" : "Instagram"} · ${fmtNames[format] ?? "Square feed"}`;

  if (story) {
    return (
      <article className="overflow-hidden rounded-xl border border-stone-200 bg-zinc-950 text-white">
        <div
          className="relative mx-auto max-w-[220px] bg-cover bg-center"
          style={{ aspectRatio: "9 / 16", backgroundImage: `url("${src}")` }}
        >
          <p className="absolute top-8 left-3 text-sm font-semibold drop-shadow">
            {name}
          </p>
          <p className="absolute bottom-16 left-3 right-3 text-lg font-semibold">
            {headline}
          </p>
          <span className="absolute bottom-6 left-3 rounded-full bg-white px-3 py-1 text-xs text-black">
            {cta}
          </span>
        </div>
        <p className="bg-white px-3 py-2 text-xs text-muted-foreground">
          {cap}
        </p>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <span className="size-8 rounded-full bg-zinc-200" />
        <span>
          <b className="block">{name}</b>
          <span className="text-xs text-muted-foreground">Sponsored</span>
        </span>
      </div>
      {platform === "facebook" ? (
        <p className="px-3 pb-2 text-sm">{body}</p>
      ) : null}
      <div
        className="bg-cover bg-center"
        style={{
          aspectRatio: format === "feed_portrait" ? "4 / 5" : "1 / 1",
          backgroundImage: `url("${src}")`,
        }}
      />
      {carousel ? (
        <div className="flex gap-1 p-2">
          {[0, 1, 2].map((index) => (
            <span
              className="h-16 flex-1 rounded bg-cover bg-center"
              key={index}
              style={{ backgroundImage: `url("${photo(index)}")` }}
            />
          ))}
        </div>
      ) : null}
      {platform === "facebook" ? (
        <>
          <div className="flex items-center justify-between gap-2 border-t border-stone-100 px-3 py-2">
            <div>
              <p className="text-sm font-medium">{headline}</p>
              <p className="text-xs text-muted-foreground">{shortLabel}</p>
            </div>
            <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs">
              {cta}
            </span>
          </div>
          <p className="border-t border-stone-100 px-3 py-2 text-xs text-muted-foreground">
            Like · Comment · Share
          </p>
        </>
      ) : (
        <div className="px-3 py-2 text-sm">
          <p className="text-xs text-muted-foreground">Liked by neighbours</p>
          <p>
            <b>{name}</b> {body}
          </p>
          <p className="mt-1 text-xs font-medium">{cta}</p>
        </div>
      )}
      <p className="border-t border-stone-100 px-3 py-2 text-xs text-muted-foreground">
        {cap}
      </p>
    </article>
  );
}
