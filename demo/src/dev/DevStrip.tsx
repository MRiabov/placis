import { useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/cn";

export type DevTab = {
  id: string;
  label: string;
  on?: boolean;
  onSelect: () => void;
};

export type DevGroup = {
  title: string;
  tabs: DevTab[];
};

type DevStripProps = {
  groups: DevGroup[];
};

function isOn(value: unknown): boolean {
  return value === "1" || value === 1 || value === true;
}

export function DevStrip({ groups }: DevStripProps): ReactNode {
  const search = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  });
  const shot = isOn(search.shot);
  const [open, setOpen] = useState(() => isOn(search.dev));

  useEffect(() => {
    if (isOn(search.dev)) {
      setOpen(true);
    }
  }, [search.dev]);

  if (shot) {
    return null;
  }

  if (!open) {
    return (
      <button
        aria-label="Show developer states"
        className="fixed top-3 right-3 z-[80] grid size-9 place-items-center rounded-full border border-dashed border-amber-600 bg-amber-50 text-xs font-medium text-amber-700"
        onClick={() => setOpen(true)}
        title="Show developer states"
        type="button"
      >
        Dev
      </button>
    );
  }

  return (
    <div
      aria-label="Developer states, not part of the product"
      className="relative z-[80] flex flex-wrap items-center gap-2 border-b border-dashed border-stone-200 bg-amber-50 py-2 pr-11 pl-4"
      role="note"
    >
      <span className="text-xs font-medium text-amber-700">Dev only</span>
      {groups.map((group) => (
        <span className="flex flex-wrap items-center gap-1.5" key={group.title}>
          <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
            {group.title}
          </span>
          {group.tabs.map((tab) => (
            <button
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs",
                tab.on
                  ? "border-primary bg-white text-foreground"
                  : "border-transparent text-zinc-600 hover:bg-white/70",
              )}
              key={tab.id}
              onClick={tab.onSelect}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </span>
      ))}
      <button
        aria-label="Hide developer states"
        className="absolute top-1.5 right-2 grid size-7 place-items-center rounded-full text-amber-700"
        onClick={() => setOpen(false)}
        type="button"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
