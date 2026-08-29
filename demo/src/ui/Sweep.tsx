import { type PointerEvent, type ReactNode, useRef } from "react";

import { cn } from "@/lib/cn";

type SweepProps = {
  src: string;
  split: number;
  onSplit: (pct: number) => void;
  accepted?: boolean;
  aspect?: string;
};

export function Sweep({
  src,
  split,
  onSplit,
  accepted = false,
  aspect = "1 / 1",
}: SweepProps): ReactNode {
  const hostRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function setFromClientX(clientX: number): void {
    const box = hostRef.current?.getBoundingClientRect();
    if (!box) {
      return;
    }
    const pct = Math.max(
      4,
      Math.min(96, ((clientX - box.left) / box.width) * 100),
    );
    onSplit(pct);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>): void {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setFromClientX(event.clientX);
  }

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border bg-zinc-100 select-none"
      onPointerCancel={() => {
        dragging.current = false;
      }}
      onPointerDown={onPointerDown}
      onPointerMove={(event) => {
        if (dragging.current) {
          setFromClientX(event.clientX);
        }
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      ref={hostRef}
      style={{ aspectRatio: aspect }}
    >
      <img
        alt=""
        className="absolute inset-0 size-full object-cover"
        draggable={false}
        src={src}
      />
      <div
        className={cn(
          "absolute inset-0 overflow-hidden",
          accepted ? "hidden" : "contrast-75 saturate-50",
        )}
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
      >
        <img
          alt=""
          className="absolute inset-0 size-full object-cover"
          draggable={false}
          src={src}
        />
      </div>
      {accepted ? null : (
        <>
          <div
            className="absolute inset-y-0 w-0.5 bg-white shadow"
            style={{ left: `${split}%` }}
          />
          <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
            before
          </span>
          <span className="absolute right-2 bottom-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
            after
          </span>
        </>
      )}
    </div>
  );
}
