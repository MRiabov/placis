import { type ReactNode, useMemo, useState } from "react";

import { photo } from "@/lib/fixtures";
import { Button } from "@/ui/Button";
import { Field, TextInput } from "@/ui/Field";
import { PageHeading } from "@/ui/PageHeading";

const startIso = "2026-08-15";

function parseIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function monthDay(iso: string): string {
  return parseIso(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function daysLeft(endIso: string): string {
  const days = Math.round(
    (parseIso(endIso).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000,
  );
  if (days > 1) {
    return `${days} days left`;
  }
  if (days === 1) {
    return "1 day left";
  }
  if (days === 0) {
    return "Last day";
  }
  return "Ended";
}

type AdsDetailProps = {
  onOpenDestinations: () => void;
  onBack: () => void;
  onEdit: () => void;
};

export function AdsDetail({
  onOpenDestinations,
  onBack,
  onEdit,
}: AdsDetailProps): ReactNode {
  const [name, setName] = useState("Roofing replacement — spring push");
  const [endIso, setEndIso] = useState("2026-08-29");
  const left = useMemo(() => daysLeft(endIso), [endIso]);

  return (
    <div className="min-h-0 flex-1 overflow-auto p-6">
      <PageHeading onOpenDestinations={onOpenDestinations} title="Ads" />
      <div className="mx-auto mt-6 max-w-[960px]">
        <Button className="mb-4" onClick={onBack} variant="outline">
          ← My ads
        </Button>
        <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 p-4">
            <textarea
              aria-label="Ad name"
              className="min-h-8 min-w-48 flex-1 resize-none border-0 bg-transparent text-lg font-semibold outline-none"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
              rows={1}
              value={name}
            />
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
                Creative ready
              </span>
              <Button disabled variant="outline">
                Publish
              </Button>
              <Button variant="outline">Download</Button>
              <Button onClick={onEdit} variant="outline">
                Edit
              </Button>
            </div>
          </div>
          <div className="grid gap-6 p-4 lg:grid-cols-2">
            <div className="grid gap-4">
              <div>
                <b className="text-sm">Images</b>
                <p className="mb-2 text-xs text-muted-foreground">
                  This ad uses one photo. Edit to pick a different one.
                </p>
                <div
                  className="h-56 rounded-xl bg-cover bg-center"
                  style={{ backgroundImage: `url("${photo(1)}")` }}
                />
              </div>
              <div>
                <b className="text-sm">Budget</b>
                <p className="mb-2 text-xs text-muted-foreground">
                  Disabled until ad posting is connected.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Daily budget">
                    <TextInput disabled value="€15" />
                  </Field>
                  <Field label="Duration">
                    <TextInput
                      disabled
                      lang="en-IE"
                      min={startIso}
                      onChange={(event) => setEndIso(event.target.value)}
                      type="date"
                      value={endIso}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      <b className="text-foreground">{left}</b> (
                      {monthDay(startIso)} to {monthDay(endIso)})
                    </p>
                  </Field>
                </div>
              </div>
              <div>
                <b className="text-sm">Audience</b>
                <p className="text-xs text-muted-foreground">
                  Not editable yet.
                </p>
                <p className="text-sm">Married couples, 30–40</p>
              </div>
              <div>
                <b className="text-sm">Area</b>
                <p className="text-xs text-muted-foreground">
                  Not editable yet.
                </p>
                <p className="text-sm">Kildare area</p>
              </div>
            </div>
            <div className="grid gap-4">
              <div>
                <b className="text-sm">Performance</b>
                <p className="mb-2 text-xs text-muted-foreground">
                  Appears once ad posting is connected.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Impressions",
                    "Clicks",
                    "Spend",
                    "Results",
                    "Cost per ad lead",
                  ].map((label) => (
                    <div
                      className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      key={label}
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <b className="block">—</b>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  At this spend, we expect <b>—</b> more ad leads in the next 30
                  days.
                </p>
              </div>
              <div>
                <b className="text-sm">Ad leads</b>
                <p className="mb-2 text-xs text-muted-foreground">
                  Ad leads from this ad — uncontacted ones are marked.
                </p>
                {[
                  ["John Murphy", "087 123 4567 · Roofing replacement", true],
                  ["Anne Doyle", "086 222 3344 · Roof repair", false],
                  ["Declan Byrne", "085 999 8877 · Gutter cleaning", true],
                ].map(([who, meta, uncontacted]) => (
                  <div
                    className="flex items-center justify-between gap-2 border-b border-stone-100 py-2 text-sm"
                    key={String(who)}
                  >
                    <span>
                      <b className="block">{who}</b>
                      <span className="text-xs text-muted-foreground">
                        {meta}
                      </span>
                    </span>
                    <span
                      className={
                        uncontacted
                          ? "rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800"
                          : "rounded-lg border border-stone-200 px-2 py-0.5 text-xs"
                      }
                    >
                      {uncontacted ? "Uncontacted" : "Contacted"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
