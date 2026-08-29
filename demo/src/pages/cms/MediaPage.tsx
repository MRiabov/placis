import {
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { DevStrip } from "@/dev/DevStrip";
import { useCmsLayout } from "@/layout/CmsLayout";
import { cn } from "@/lib/cn";
import { photo } from "@/lib/fixtures";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";
import { Field, TextArea } from "@/ui/Field";
import { PageHeading } from "@/ui/PageHeading";
import { Sweep } from "@/ui/Sweep";

const CLEANUP_WAIT_MS = 7500;

const mediaLibraryItems = [
  {
    caption: "Rear slope after the storm",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Slate repair on a terrace",
    by: "owner",
    status: "uploading",
    ratio: "portrait",
  },
  {
    caption: "New roof on a semi",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Guttering on the front",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Valley flashing",
    by: "research",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Ridge line after wind",
    by: "owner",
    status: "approved",
    ratio: "portrait",
  },
  {
    caption: "Chimney flashing",
    by: "owner",
    status: "approved",
    ratio: "portrait",
  },
  {
    caption: "Battens before the covering",
    by: "ai",
    status: "approved",
    ratio: "portrait",
  },
  {
    caption: "Full re-roof on a semi",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Finished elevation",
    by: "research",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Sheets going on",
    by: "owner",
    status: "approved",
    ratio: "portrait",
  },
  {
    caption: "Front elevation after handover",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
].map((item, index) => ({ ...item, src: photo(index) }));

type CropRect = { left: number; top: number; width: number; height: number };

export function MediaPage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const startCompare =
    new URLSearchParams(window.location.search).get("cleanup") === "1";
  const [index, setIndex] = useState(0);
  const [crop, setCrop] = useState<"full" | "rect">("full");
  const [prompt, setPrompt] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [compare, setCompare] = useState(startCompare);
  const [split, setSplit] = useState(50);
  const [fill, setFill] = useState(0);
  const [focal, setFocal] = useState({ x: 52, y: 38 });
  const [rect, setRect] = useState<CropRect>({
    left: 8,
    top: 10,
    width: 84,
    height: 78,
  });
  const waitTimer = useRef(0);
  const stillRef = useRef<HTMLDivElement>(null);
  const item = mediaLibraryItems[index] ?? mediaLibraryItems[0];
  if (!item) {
    throw new Error("media library is empty");
  }
  const who = item.by === "ai" ? "AI" : item.by;
  const framingHidden = waiting || compare;

  useEffect(() => {
    return () => window.clearTimeout(waitTimer.current);
  }, []);

  useEffect(() => {
    if (!waiting) {
      setFill(0);
      return;
    }
    const frame = window.requestAnimationFrame(() => setFill(100));
    return () => window.cancelAnimationFrame(frame);
  }, [waiting]);

  function resetCleanup(): void {
    window.clearTimeout(waitTimer.current);
    setWaiting(false);
    setCompare(false);
    setSplit(50);
  }

  function startCleanup(): void {
    if (!prompt.trim()) {
      return;
    }
    window.clearTimeout(waitTimer.current);
    setCompare(false);
    setWaiting(true);
    waitTimer.current = window.setTimeout(() => {
      setWaiting(false);
      setCompare(true);
      setSplit(50);
    }, CLEANUP_WAIT_MS);
  }

  return (
    <>
      <DevStrip
        groups={[
          {
            title: "Media library",
            tabs: [
              {
                id: "cleanup",
                label: "Cleanup compare",
                on: compare,
                onSelect: () => {
                  setWaiting(false);
                  setCompare(true);
                  setSplit(50);
                },
              },
            ],
          },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeading
            onOpenDestinations={openDestinations}
            title="Media library"
          />
          <Button>Upload</Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Photos of their work, logos, and documents. Crop, focal, and cleanup
          live here. Attach a photo from Content when an image is selected on
          the canvas.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div
            className={card(
              "relative min-h-80 overflow-hidden bg-zinc-50",
              item.ratio === "portrait" && "max-h-[32rem]",
            )}
          >
            {compare ? (
              <Sweep
                aspect={item.ratio === "portrait" ? "4 / 5" : "16 / 10"}
                onSplit={setSplit}
                split={split}
                src={item.src}
              />
            ) : (
              <div className="relative h-full min-h-80" ref={stillRef}>
                <img
                  alt={item.caption}
                  className="h-full w-full object-cover"
                  src={item.src}
                />
                {crop === "rect" ? (
                  <CropBox hostRef={stillRef} onChange={setRect} rect={rect} />
                ) : null}
                <FocalPin
                  hostRef={stillRef}
                  onChange={setFocal}
                  x={focal.x}
                  y={focal.y}
                />
              </div>
            )}
            {waiting ? (
              <div className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                <div className="w-48 text-center">
                  <p className="text-sm">Cleaning up…</p>
                  <div className="mt-2 h-1 overflow-hidden rounded bg-white/30">
                    <div
                      className="h-full bg-white transition-[width] duration-[7500ms] ease-linear"
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <form
            className="grid content-start gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              startCleanup();
            }}
          >
            {framingHidden ? null : (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-600">Crop</span>
                <button
                  className={cn(
                    "rounded-lg border px-2 py-1 text-xs",
                    crop === "full" ? "border-primary" : "border-border",
                  )}
                  onClick={() => setCrop("full")}
                  type="button"
                >
                  Full
                </button>
                <button
                  className={cn(
                    "rounded-lg border px-2 py-1 text-xs",
                    crop === "rect" ? "border-primary" : "border-border",
                  )}
                  onClick={() => setCrop("rect")}
                  type="button"
                >
                  Rect
                </button>
              </div>
            )}
            <Field label="Cleanup">
              <TextArea
                maxLength={500}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="How should this photo be cleaned up?"
                rows={3}
                value={prompt}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              {item.caption} · supplied by {who} · {item.status}
            </p>
            {compare ? (
              <div className="flex gap-2">
                <Button onClick={resetCleanup} type="button" variant="outline">
                  Reject
                </Button>
                <Button onClick={resetCleanup} type="button">
                  Accept
                </Button>
              </div>
            ) : (
              <Button disabled={waiting || !prompt.trim()} type="submit">
                Cleanup
              </Button>
            )}
          </form>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {mediaLibraryItems.map((thumb, thumbIndex) => (
            <button
              aria-label={thumb.caption}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg border object-cover",
                index === thumbIndex ? "border-primary" : "border-border",
              )}
              key={thumb.caption}
              onClick={() => {
                setIndex(thumbIndex);
                resetCleanup();
              }}
              type="button"
            >
              <img alt="" className="size-full object-cover" src={thumb.src} />
              {thumb.status === "uploading" ? (
                <span className="absolute inset-0 grid place-items-center bg-white/80 text-[9px]">
                  Uploading…
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function FocalPin({
  x,
  y,
  onChange,
  hostRef,
}: {
  x: number;
  y: number;
  onChange: (next: { x: number; y: number }) => void;
  hostRef: { current: HTMLDivElement | null };
}): ReactNode {
  function move(event: PointerEvent<HTMLButtonElement>): void {
    const box = hostRef.current?.getBoundingClientRect();
    if (!box) {
      return;
    }
    const nextX = Math.max(
      0,
      Math.min(100, ((event.clientX - box.left) / box.width) * 100),
    );
    const nextY = Math.max(
      0,
      Math.min(100, ((event.clientY - box.top) / box.height) * 100),
    );
    onChange({ x: nextX, y: nextY });
  }

  return (
    <button
      aria-label="Focal point"
      className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow"
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons) {
          move(event);
        }
      }}
      style={{ left: `${x}%`, top: `${y}%` }}
      type="button"
    />
  );
}

function CropBox({
  rect,
  onChange,
  hostRef,
}: {
  rect: CropRect;
  onChange: (next: CropRect) => void;
  hostRef: { current: HTMLDivElement | null };
}): ReactNode {
  const origin = useRef({ x: 0, y: 0, rect });

  function startDrag(event: PointerEvent<Element>, resize: boolean): void {
    event.preventDefault();
    event.stopPropagation();
    const box = hostRef.current?.getBoundingClientRect();
    if (!box) {
      return;
    }
    origin.current = { x: event.clientX, y: event.clientY, rect };
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (moveEvent: globalThis.PointerEvent) => {
      const dx = ((moveEvent.clientX - origin.current.x) / box.width) * 100;
      const dy = ((moveEvent.clientY - origin.current.y) / box.height) * 100;
      const start = origin.current.rect;
      if (resize) {
        onChange({
          ...start,
          width: Math.max(12, Math.min(100 - start.left, start.width + dx)),
          height: Math.max(12, Math.min(100 - start.top, start.height + dy)),
        });
        return;
      }
      onChange({
        ...start,
        left: Math.max(0, Math.min(100 - start.width, start.left + dx)),
        top: Math.max(0, Math.min(100 - start.height, start.top + dy)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div
      className="absolute border-2 border-white shadow"
      onPointerDown={(event) => startDrag(event, false)}
      style={{
        left: `${rect.left}%`,
        top: `${rect.top}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
      }}
    >
      <button
        aria-label="Resize crop"
        className="absolute right-0 bottom-0 size-3 translate-x-1/2 translate-y-1/2 rounded-sm bg-white"
        onPointerDown={(event) => startDrag(event, true)}
        type="button"
      />
    </div>
  );
}
