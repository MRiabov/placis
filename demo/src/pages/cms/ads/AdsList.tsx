import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { photo } from "@/lib/fixtures";
import { Button } from "@/ui/Button";
import { PageHeading } from "@/ui/PageHeading";

export const ads = [
  {
    title: "Gutter cleaning — summer",
    status: "Creative ready",
    ready: true,
    image: photo(0),
    meta: "Updated yesterday · Guttering",
  },
  {
    title: "Roofing replacement — spring push",
    status: "Creative ready",
    ready: true,
    image: photo(1),
    meta: "Updated today · Roofing",
  },
  {
    title: "Roof repair — winter",
    status: "Draft",
    ready: false,
    image: photo(2),
    meta: "Updated 3 days ago · Roofing",
  },
  {
    title: "Garage conversions",
    status: "Draft",
    ready: false,
    image: photo(3),
    meta: "Updated last week · Conversions",
  },
] as const;

type AdsListProps = {
  compact: boolean;
  onOpenDestinations: () => void;
  onOpenDetail: () => void;
  onNewAd: () => void;
  onToggleCompact: () => void;
};

export function AdsList({
  compact,
  onOpenDestinations,
  onOpenDetail,
  onNewAd,
  onToggleCompact,
}: AdsListProps): ReactNode {
  return (
    <div className="min-h-0 flex-1 overflow-auto p-6">
      <PageHeading
        actions={
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline">
              <img alt="" className="size-4" src="/google-ads-icon.svg" />
              Connect Google Ads
            </Button>
            <Button onClick={onToggleCompact} variant="outline">
              {compact ? "Show large" : "Show compact"}
            </Button>
            <Button onClick={onNewAd}>+ New ad</Button>
          </div>
        }
        onOpenDestinations={onOpenDestinations}
        title="Ads"
      />
      <div className="mx-auto mt-6 max-w-[960px]">
        <p className="mb-5 text-sm text-muted-foreground">
          Ads usually run 6 at a time, so cards are large; more than 6 compress
          automatically. Sorted: active first, then newest.
        </p>
        <div className={cn("grid gap-4", compact && "sm:grid-cols-2")}>
          {ads.map((ad) => (
            <button
              className={cn(
                "flex overflow-hidden rounded-[28px] border border-stone-200 bg-white text-left shadow-sm hover:bg-zinc-50",
                compact ? "flex-col sm:flex-row" : "",
              )}
              key={ad.title}
              onClick={onOpenDetail}
              type="button"
            >
              <img
                alt=""
                className={cn(
                  "object-cover",
                  compact ? "h-28 w-full sm:h-24 sm:w-32" : "h-36 w-44",
                )}
                src={ad.image}
              />
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
                <b>{ad.title}</b>
                <span className="flex flex-wrap items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "rounded-lg border px-2 py-0.5 text-xs",
                      ad.ready
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-stone-200",
                    )}
                  >
                    {ad.status}
                  </span>
                  <span className="text-muted-foreground">{ad.meta}</span>
                </span>
                {compact ? null : (
                  <span className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>
                      Impressions <b className="text-foreground">—</b>
                    </span>
                    <span>
                      Clicks <b className="text-foreground">—</b>
                    </span>
                    <span>
                      Spend <b className="text-foreground">—</b>
                    </span>
                    <span>
                      Performance appears once ad posting is connected
                    </span>
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
