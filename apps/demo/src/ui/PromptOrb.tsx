import { Sparkles } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

import { cn } from "@/lib/cn";
import { Button } from "@/ui/Button";
import { TextArea } from "@/ui/Field";

type PromptOrbProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  promptText: string;
  setPromptText: (value: string) => void;
  placeholder: string;
  onGenerate: () => void;
  className?: string;
  buttonClassName?: string;
};

export function PromptOrb({
  open,
  setOpen,
  promptText,
  setPromptText,
  placeholder,
  onGenerate,
  className,
  buttonClassName,
}: PromptOrbProps): ReactNode {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointer(event: PointerEvent): void {
      const root = rootRef.current;
      if (
        !root ||
        !(event.target instanceof Node) ||
        root.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, setOpen]);

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <button
        aria-expanded={open}
        aria-label="Prompt"
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-[10px]",
          "border border-stone-300 bg-white text-primary hover:bg-zinc-50",
          open ? "border-primary bg-zinc-50" : "",
          buttonClassName,
        )}
        onClick={() => setOpen(!open)}
        type="button"
      >
        <Sparkles className="size-[18px]" />
      </button>
      {open ? (
        <div
          className={cn(
            "absolute bottom-[calc(100%+8px)] left-0 z-20",
            "w-[min(100%,22.5rem)] rounded-xl border border-stone-200",
            "bg-white p-2.5 shadow-sm",
          )}
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
