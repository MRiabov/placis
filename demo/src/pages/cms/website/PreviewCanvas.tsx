import { type ReactNode, useLayoutEffect, useRef } from "react";

import { FakeSite, type SiteSection } from "@/pages/cms/website/FakeSite";

const nativeWidths = { desktop: 1080, tablet: 760, mobile: 390 } as const;

export type PreviewViewport = keyof typeof nativeWidths;

type PreviewCanvasProps = {
  viewport: PreviewViewport;
  host: string;
  copyout: boolean;
  page: string;
  radius: string;
  density: string;
  selected: SiteSection | null;
  hidden: Partial<Record<SiteSection, boolean>>;
  pending: boolean;
  voiceOn: boolean;
  assistantOpen: boolean;
  onSelect: (section: SiteSection) => void;
};

export function PreviewCanvas({
  viewport,
  host,
  copyout,
  page,
  radius,
  density,
  selected,
  hidden,
  pending,
  voiceOn,
  assistantOpen,
  onSelect,
}: PreviewCanvasProps): ReactNode {
  const stageRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    function sync(): void {
      const scaleEl = scaleRef.current;
      const frame = frameRef.current;
      const canvas = stage?.closest("[data-editor-canvas]");
      if (!stage || !scaleEl || !frame || !(canvas instanceof HTMLElement)) {
        return;
      }
      const native = nativeWidths[viewport];
      const stageStyle = getComputedStyle(stage);
      const availW =
        stage.clientWidth -
        Number.parseFloat(stageStyle.paddingLeft) -
        Number.parseFloat(stageStyle.paddingRight);
      const availH =
        stage.clientHeight -
        Number.parseFloat(stageStyle.paddingTop) -
        Number.parseFloat(stageStyle.paddingBottom);
      if (availW < 1 || availH < 1) {
        return;
      }
      const layoutW =
        viewport === "desktop" ? Math.max(native, availW) : native;
      const scale = Math.min(1, availW / layoutW);
      frame.style.width = `${layoutW}px`;
      frame.style.height = `${availH / scale}px`;
      frame.style.transform = `scale(${scale})`;
      scaleEl.style.width = `${layoutW * scale}px`;
      scaleEl.style.height = `${availH}px`;
      const site = frame.querySelector("[data-fake-site]");
      if (!(site instanceof HTMLElement)) {
        return;
      }
      const canvasRect = canvas.getBoundingClientRect();
      let coverTop = canvasRect.bottom;
      const overlay = document.getElementById("assistantOverlay");
      if (overlay && !canvas.classList.contains("is-voice")) {
        const overlayRect = overlay.getBoundingClientRect();
        if (overlayRect.height > 0) {
          coverTop = Math.min(coverTop, overlayRect.top);
        }
      }
      const actions = document.getElementById("canvasActions");
      if (actions) {
        const actionsRect = actions.getBoundingClientRect();
        if (actionsRect.height > 0) {
          coverTop = Math.min(coverTop, actionsRect.top);
        }
      }
      const visualCover = Math.max(0, canvasRect.bottom - coverTop) + 12;
      const pad = `${Math.ceil(visualCover / scale)}px`;
      site.style.paddingBottom = pad;
      site.style.scrollPaddingBottom = pad;
    }

    const observer = new ResizeObserver(sync);
    observer.observe(stage);
    if (assistantOpen && !voiceOn) {
      const overlay = document.getElementById("assistantOverlay");
      if (overlay) {
        observer.observe(overlay);
      }
    }
    sync();
    return () => observer.disconnect();
  }, [assistantOpen, viewport, voiceOn]);

  return (
    <>
      {copyout ? (
        <p className="relative z-[25] mx-4 mt-3 shrink-0 rounded-lg border border-[#b42318] bg-[#fef2f2] px-3 py-2 text-xs text-[#b42318]">
          Copy-out has not succeeded after 10 seconds. Leaving is blocked until
          this succeeds or you discard.
        </p>
      ) : null}
      <div
        className="relative z-0 flex min-h-0 flex-1 items-stretch justify-center overflow-hidden bg-white bg-[linear-gradient(rgb(39_39_42/4.5%)_1px,transparent_1px),linear-gradient(90deg,rgb(39_39_42/4.5%)_1px,transparent_1px)] bg-[size:24px_24px] p-6 max-[1100px]:p-3"
        ref={stageRef}
      >
        <div
          className="relative min-h-0 min-w-0 shrink-0 overflow-hidden"
          ref={scaleRef}
        >
          <div
            className="absolute top-0 left-0 grid min-h-0 origin-top-left overflow-hidden rounded-panel bg-white bg-[linear-gradient(rgb(39_39_42/4.5%)_1px,transparent_1px),linear-gradient(90deg,rgb(39_39_42/4.5%)_1px,transparent_1px)] bg-[size:24px_24px] shadow-prompt [grid-template-rows:auto_minmax(0,1fr)]"
            ref={frameRef}
          >
            <div className="flex items-center gap-2.5 border-b border-border bg-secondary px-3.5 py-[9px]">
              <div aria-hidden="true" className="flex gap-1.5">
                <span className="size-2 rounded-full bg-hairline" />
                <span className="size-2 rounded-full bg-hairline" />
                <span className="size-2 rounded-full bg-hairline" />
              </div>
              <div className="flex-1 overflow-hidden rounded-full border border-border bg-white px-3 py-[5px] text-center text-[11px] text-ellipsis whitespace-nowrap text-muted-foreground">
                {host}
              </div>
            </div>
            <FakeSite
              density={density}
              hidden={hidden}
              onSelect={onSelect}
              page={page}
              pending={pending}
              radius={radius}
              selected={selected}
            />
          </div>
        </div>
      </div>
    </>
  );
}
