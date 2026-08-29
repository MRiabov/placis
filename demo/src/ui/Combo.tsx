import { type ReactNode, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { card } from "@/ui/card";
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
  searchIcon?: boolean;
};

export function Combo({
  value,
  onChange,
  options,
  placeholder,
  createKind,
  groupLabel,
  ariaLabel,
  forceOpen = false,
  searchIcon = false,
}: ComboProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  useEffect(() => {
    setQuery(value);
  }, [value]);
  const mapsPlace = createKind === "place";
  const canCreate = Boolean(createKind) && !mapsPlace;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return options;
    }
    return options.filter((option) =>
      `${option.title} ${option.hint ?? ""}`.toLowerCase().includes(needle),
    );
  }, [options, query]);
  const creating = canCreate && Boolean(query.trim()) && filtered.length === 0;
  const shown = open || forceOpen;
  const hasMenu =
    filtered.length > 0 || creating || (mapsPlace && shown) || canCreate;

  return (
    <div className="relative w-full min-w-0">
      <input
        aria-expanded={shown && hasMenu}
        aria-label={ariaLabel}
        className={cn(controlClass, searchIcon ? "pr-10" : "")}
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
      {searchIcon ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" />
        </svg>
      ) : null}
      {shown && hasMenu ? (
        <div
          className={card(
            "absolute top-[calc(100%+6px)] right-0 left-0 z-30 overflow-hidden shadow-card",
          )}
        >
          {canCreate || mapsPlace ? (
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
          ) : null}
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
