import { type ReactNode, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { controlClass } from "@/ui/Field";

export type ComboOption = {
  id: string;
  title: string;
  hint?: string;
};

type ComboProps = {
  value: string;
  onChange: (value: string, option?: ComboOption) => void;
  options: ComboOption[];
  placeholder?: string;
  createKind?: string;
  groupLabel?: string;
  ariaLabel?: string;
  forceOpen?: boolean;
};

export function Combo({
  value,
  onChange,
  options,
  placeholder,
  createKind = "item",
  groupLabel,
  ariaLabel,
  forceOpen = false,
}: ComboProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  useEffect(() => {
    setQuery(value);
  }, [value]);
  const mapsPlace = createKind === "place";
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return options;
    }
    return options.filter((option) =>
      `${option.title} ${option.hint ?? ""}`.toLowerCase().includes(needle),
    );
  }, [options, query]);
  const creating = Boolean(query.trim()) && filtered.length === 0 && !mapsPlace;

  return (
    <div className="relative">
      <input
        aria-expanded={open || forceOpen}
        aria-label={ariaLabel}
        className={controlClass}
        role="combobox"
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        value={query}
      />
      {open || forceOpen ? (
        <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-30 overflow-hidden rounded-xl border border-border bg-white shadow-md">
          <div className="p-1.5">
            <p
              className={cn(
                "flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[13px]",
                creating
                  ? "bg-black/5 text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {creating ? (
                <>
                  <span className="font-bold">+</span>
                  Create new {createKind} “{query.trim()}”
                </>
              ) : mapsPlace ? (
                "Type to search a place…"
              ) : (
                `Type to create a new ${createKind}…`
              )}
            </p>
          </div>
          {creating ? <div className="mx-2 h-px bg-border" /> : null}
          {groupLabel ? (
            <p className="px-3 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {groupLabel}
            </p>
          ) : null}
          <div className="max-h-44 overflow-auto">
            {filtered.map((option) => {
              const current = option.title === value || option.id === value;
              return (
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-black/5"
                  key={option.id}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setQuery(mapsPlace ? "" : option.title);
                    onChange(option.title, option);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <span className="w-4 font-bold text-muted-foreground">
                    {current ? "✓" : ""}
                  </span>
                  <span className="min-w-0">
                    <b className="block text-[13px]">{option.title}</b>
                    {option.hint ? (
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {option.hint}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
