import { ArrowRight, AudioLines, Paperclip, X as CloseIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { onboardingHref } from "../lib/appOrigin";
import {
  FLAT_CONTROL_CLASS,
  PROMPT_BOX_INNER_RADIUS_CLASS,
  PROMPT_BOX_RADIUS_CLASS,
  PROMPT_BOX_SURFACE_CLASS,
  RAISED_PRIMARY_CLASS,
} from "../lib/marketingSite";

const BUILD_PROMPT_KEY = "placis-build-prompt";

const PROMPT_PLACEHOLDERS = [
  "Describe what you want Placis to build...",
  "Build a website for my contracting business.",
  "Build a roofing site with storm-damage galleries.",
  "Add my service areas, hours, and phone number to a simple site.",
  "Create a portfolio page for my recent projects.",
];

const SIZE = {
  actionBtn: "size-8 sm:size-9",
  gap: "gap-1.5 sm:gap-2",
  iconBtn: "hidden size-8 sm:grid sm:size-8",
  pad: "px-3 pt-2.5 pb-2.5 sm:px-3.5 sm:pt-3 sm:pb-3",
  placeholder: "text-[14px] leading-5 sm:text-[16px] sm:leading-6",
  textarea: "text-[14px] leading-5 sm:text-[16px] sm:leading-6",
  toolbarMt: "mt-2 sm:mt-2",
} as const;

function resetMobileInputZoom() {
  if (!window.matchMedia("(pointer: coarse)").matches) {
    return;
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta?.content) {
    return;
  }
  const original = meta.content;
  meta.content = `${original}, maximum-scale=1`;
  requestAnimationFrame(() => {
    meta.content = original;
  });
}

function goToOnboarding(prompt?: string) {
  const base = onboardingHref();
  if (prompt && prompt.length > 0) {
    window.location.href = `${base}?prompt=${encodeURIComponent(prompt)}`;
    return;
  }
  window.location.href = base;
}

export function PromptBox() {
  const [value, setValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [emptyNudge, setEmptyNudge] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (value) {
      return;
    }
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      return;
    }
    let swap = 0;
    const id = window.setInterval(() => {
      setPlaceholderVisible(false);
      swap = window.setTimeout(() => {
        setPlaceholderIndex((i) => (i + 1) % PROMPT_PLACEHOLDERS.length);
        setPlaceholderVisible(true);
      }, 480);
    }, 3600);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(swap);
    };
  }, [value]);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) {
      return;
    }
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      textareaRef.current?.focus();
      setEmptyNudge(false);
      requestAnimationFrame(() => setEmptyNudge(true));
      return;
    }
    try {
      window.localStorage.setItem(BUILD_PROMPT_KEY, trimmed);
    } catch {
      // Storage blocked; the typed value still goes on the query string.
    }
    goToOnboarding(trimmed);
  };

  return (
    <div
      className={`w-full max-w-2xl overflow-hidden ${PROMPT_BOX_RADIUS_CLASS} ${PROMPT_BOX_SURFACE_CLASS} ${emptyNudge ? "prompt-empty-nudge" : ""}`}
      onAnimationEnd={() => setEmptyNudge(false)}
    >
      <div className={PROMPT_BOX_INNER_RADIUS_CLASS}>
        <div
          className={`${SIZE.pad} ${dragActive ? "border-2 border-[#13120a]/40 border-dashed" : ""}`}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <div className="relative min-w-0">
            {value ? null : (
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 top-0 truncate px-1 pt-1 ${SIZE.placeholder}`}
              >
                <span
                  className={`inline-block max-w-full truncate text-zinc-400 transition-[opacity,transform,filter] duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:text-zinc-500 ${
                    placeholderVisible
                      ? "translate-y-0 opacity-100 blur-0"
                      : "-translate-y-[0.22em] opacity-0 blur-[2px]"
                  }`}
                >
                  {PROMPT_PLACEHOLDERS[placeholderIndex]}
                </span>
              </div>
            )}
            <textarea
              aria-label="Describe what you want Placis to build"
              className={`relative w-full resize-none bg-transparent px-1 pt-1 text-zinc-950 outline-none dark:text-zinc-50 ${SIZE.textarea}`}
              onBlur={resetMobileInputZoom}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              ref={textareaRef}
              rows={1}
              value={value}
            />
          </div>
          {files.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <span
                  className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-zinc-200 bg-[#ffffff] px-3 py-1.5 text-[12px] text-zinc-700 dark:border-white/10 dark:text-zinc-800"
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                >
                  <Paperclip className="size-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <button
                    aria-label={`Remove ${file.name}`}
                    className="shrink-0 text-zinc-400 transition hover:text-zinc-950 dark:hover:text-white"
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, i) => i !== index))
                    }
                    type="button"
                  >
                    <CloseIcon className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <input
            className="hidden"
            multiple
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
            ref={fileInputRef}
            type="file"
          />
          <div
            className={`${SIZE.toolbarMt} flex items-center justify-between gap-2`}
          >
            <button
              aria-label="Attach files"
              className={`${SIZE.iconBtn} place-items-center rounded-full ${FLAT_CONTROL_CLASS}`}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Paperclip className="size-4 text-current" strokeWidth={2} />
            </button>
            <div className={`flex shrink-0 items-center justify-end ${SIZE.gap}`}>
              <button
                aria-label="Continue by voice"
                className={`grid place-items-center rounded-full ${SIZE.actionBtn} ${FLAT_CONTROL_CLASS}`}
                onClick={() => goToOnboarding()}
                type="button"
              >
                <AudioLines className="voice-icon size-5" />
              </button>
              <button
                aria-label="Start building"
                className={`grid place-items-center rounded-full ${SIZE.actionBtn} ${RAISED_PRIMARY_CLASS}`}
                onClick={submit}
                type="button"
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
