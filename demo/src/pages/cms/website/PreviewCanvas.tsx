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
      const canvas = stage?.closest(".cms-editor-canvas");
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
      const site = frame.querySelector(".fake-site");
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
      site.style.setProperty("--cms-canvas-scroll-pad", pad);
      site.style.paddingBottom = pad;
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
        <p className="cms-copy-error">
          Copy-out has not succeeded after 10 seconds. Leaving is blocked until
          this succeeds or you discard.
        </p>
      ) : null}
      <div className="cms-stage-grid" ref={stageRef}>
        <div className="cms-stage-scale" ref={scaleRef}>
          <div
            className={`cms-public-preview-shell is-${viewport}`}
            ref={frameRef}
          >
            <div className="cms-browser-chrome">
              <div aria-hidden="true" className="cms-browser-chrome-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="cms-browser-chrome-url">{host}</div>
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
