import { useNavigate, useParams } from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";
import { useCmsLayout } from "@/layout/CmsLayout";
import { ads } from "@/pages/cms/ads/AdsList";
import { adsSearch } from "@/pages/cms/ads/search";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";
import { Field, TextInput } from "@/ui/Field";
import { PageHeading } from "@/ui/PageHeading";

const startIso = "2026-08-15";

function parseIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return new Date(NaN);
  }
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

export function AdsDetail(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const navigate = useNavigate();
  const { adId } = useParams({ from: "/cms/ads/$adId" });
  const ad = ads.find((item) => item.id === adId) ?? ads[1];
  const [name, setName] = useState<string>(ad.title);
  const [endIso, setEndIso] = useState("2026-08-29");
  const left = useMemo(() => daysLeft(endIso), [endIso]);

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-[960px] px-7 pt-8 pb-14 max-[1023px]:px-4 max-[1023px]:pt-6 max-[1023px]:pb-12">
        <PageHeading onOpenDestinations={openDestinations} title="Ads" />
        <Button
          className="mt-6 mb-4"
          onClick={() => void navigate({ search: adsSearch(), to: "/cms/ads" })}
          variant="outline"
        >
          ← My ads
        </Button>
        <div
          className={card(
            "overflow-hidden rounded-prompt border-hairline shadow-prompt",
          )}
        >
          <div className="flex min-w-0 items-center gap-4 border-b border-hairline px-5 py-4 max-[720px]:flex-wrap max-[720px]:items-start max-[720px]:gap-3 max-[720px]:p-4">
            <div className="grid min-w-0 flex-1 justify-items-stretch max-[720px]:w-full max-[720px]:flex-none">
              <span
                aria-hidden="true"
                className="invisible pointer-events-none col-start-1 row-start-1 min-w-[8ch] overflow-hidden px-1 pt-0.5 pb-2 text-[21px] leading-[1.25] font-semibold tracking-[-0.025em] whitespace-pre max-[720px]:min-w-0 max-[720px]:overflow-wrap-anywhere max-[720px]:whitespace-pre-wrap"
              >
                {name || " "}
              </span>
              <textarea
                aria-label="Ad name"
                className="col-start-1 row-start-1 m-0 h-full min-h-0 w-full min-w-0 resize-none appearance-none overflow-hidden border-0 border-b border-transparent bg-transparent px-1 pt-0.5 pb-2 text-[21px] leading-[1.25] font-semibold tracking-[-0.025em] shadow-none focus:border-foreground focus:outline-none max-[720px]:overflow-wrap-anywhere max-[720px]:whitespace-pre-wrap"
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
            </div>
            <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 max-[720px]:w-full">
              <div className="flex min-w-0 flex-nowrap items-center gap-2">
                <span
                  className="group relative inline-flex after:pointer-events-none after:absolute after:bottom-[calc(100%+6px)] after:left-1/2 after:z-10 after:-translate-x-1/2 after:rounded-[10px] after:bg-foreground after:px-2.5 after:py-1.5 after:text-xs after:whitespace-nowrap after:text-primary-foreground after:opacity-0 after:shadow-prompt after:transition-opacity after:content-[attr(data-tip)] hover:after:opacity-100 focus-within:after:opacity-100 max-[720px]:after:max-w-[min(280px,calc(100vw-32px))] max-[720px]:after:whitespace-normal"
                  data-tip="Publish is not available yet — ad posting to Meta is coming"
                >
                  <Button disabled variant="outline">
                    Publish
                  </Button>
                </span>
                <Button variant="outline">Download</Button>
                <Button
                  onClick={() =>
                    void navigate({
                      params: { adId },
                      search: adsSearch(),
                      to: "/cms/ads/$adId/edit",
                    })
                  }
                  variant="outline"
                >
                  Edit
                </Button>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                Creative ready
              </span>
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
                  className="h-[280px] rounded-xl border border-hairline bg-cover bg-[position:50%_32%]"
                  style={{ backgroundImage: `url("${ad.image}")` }}
                />
              </div>
              <div>
                <b className="text-sm">Budget</b>
                <p className="mb-2 text-xs text-muted-foreground">
                  Disabled until ad posting is connected.
                </p>
                <div className="grid items-start gap-3 sm:grid-cols-2">
                  <Field label="Daily budget">
                    <TextInput className="h-11" disabled value="€15" />
                  </Field>
                  <Field label="Duration">
                    <TextInput
                      className="h-11 py-0"
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
                    <div className={card("px-3 py-2 text-sm")} key={label}>
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
                    className="flex items-center justify-between gap-2 border-b border-border py-2 text-sm"
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
                          : "rounded-lg border border-border px-2 py-0.5 text-xs"
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
