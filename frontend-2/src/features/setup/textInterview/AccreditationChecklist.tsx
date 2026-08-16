import type { ReactNode } from "react";

import type { CertificationOption } from "./certifications";

export type AccreditationChecklistProps = {
  busy: boolean;
  countryLabel: string;
  onToggle: (certificationId: string, checked: boolean) => void;
  options: CertificationOption[];
  selectedIds: string[];
};

export function AccreditationChecklist({
  busy,
  countryLabel,
  onToggle,
  options,
  selectedIds,
}: AccreditationChecklistProps): ReactNode {
  const selected = new Set(selectedIds);
  return (
    <div className="grid gap-2">
      <span className="text-xs text-muted-foreground">{countryLabel} checklist</span>
      <div className="grid gap-2">
        {options.map((option) => (
          <label
            className={`grid cursor-pointer gap-1 rounded-md border p-3 transition ${
              selected.has(option.id)
                ? "border-foreground bg-background shadow-sm"
                : "border-border bg-muted"
            } ${busy ? "cursor-not-allowed opacity-70" : ""}`}
            key={option.id}
          >
            <span className="flex items-start gap-3">
              <input
                checked={selected.has(option.id)}
                className="mt-0.5 size-4 accent-foreground"
                disabled={busy}
                onChange={(event) => onToggle(option.id, event.target.checked)}
                type="checkbox"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {option.shortLabel}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

const countryLabels: Record<string, string> = {
  GB: "United Kingdom",
  IE: "Ireland",
  US: "United States",
};

export function countryName(country: string): string {
  return countryLabels[country] ?? "Local";
}
