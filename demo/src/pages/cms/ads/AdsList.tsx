import { Link, useNavigate } from "@tanstack/react-router";
import { Archive as ArchiveIcon } from "lucide-react";
import { type MouseEvent, type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { photo } from "@/lib/fixtures";
import { adsSearch } from "@/pages/cms/ads/search";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";
import { PageHeading } from "@/ui/PageHeading";

export type AdRow = {
  id: string;
  title: string;
  status: string;
  ready: boolean;
  image: string;
  meta: string;
  archived: boolean;
};

export const ads: AdRow[] = [
  {
    id: "gutter-cleaning-summer",
    title: "Gutter cleaning — summer",
    status: "Creative ready",
    ready: true,
    image: photo(0),
    meta: "Updated yesterday · Guttering",
    archived: false,
  },
  {
    id: "roofing-replacement-spring",
    title: "Roofing replacement — spring push",
    status: "Creative ready",
    ready: true,
    image: photo(1),
    meta: "Updated today · Roofing",
    archived: false,
  },
  {
    id: "roof-repair-winter",
    title: "Roof repair — winter",
    status: "Draft",
    ready: false,
    image: photo(2),
    meta: "Updated 3 days ago · Roofing",
    archived: false,
  },
  {
    id: "garage-conversions",
    title: "Garage conversions",
    status: "Draft",
    ready: false,
    image: photo(3),
    meta: "Updated last week · Conversions",
    archived: true,
  },
];

type AdsListProps = {
  compact: boolean;
  googleConnected: boolean;
  metaConnected: boolean;
  onConnectGoogle: () => void;
  onConnectMeta: () => void;
  onOpenDestinations: () => void;
  onToggleCompact: () => void;
};

export function AdsList({
  compact,
  googleConnected,
  metaConnected,
  onConnectGoogle,
  onConnectMeta,
  onOpenDestinations,
  onToggleCompact,
}: AdsListProps): ReactNode {
  const navigate = useNavigate();
  const search = adsSearch();
  const archivedId =
    typeof search.archived === "string" ? search.archived : undefined;
  const startArchive = search.archive === "1";
  const [archiveOpen, setArchiveOpen] = useState(startArchive);
  const [toast, setToast] = useState(Boolean(archivedId));
  const [hiddenId, setHiddenId] = useState<string | null>(archivedId ?? null);
  const [releasedIds, setReleasedIds] = useState<string[]>([]);

  useEffect(() => {
    if (startArchive) {
      setArchiveOpen(true);
    }
  }, [startArchive]);

  const active = ads.filter((row) => {
    if (releasedIds.includes(row.id)) {
      return true;
    }
    return !row.archived && row.id !== hiddenId;
  });
  const archived = ads.filter((row) => {
    if (releasedIds.includes(row.id)) {
      return false;
    }
    return row.archived || row.id === hiddenId;
  });

  function archiveAd(id: string): void {
    setHiddenId(id);
    setToast(true);
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-[960px] px-7 pt-8 pb-14 max-[1023px]:px-4 max-[1023px]:pt-6 max-[1023px]:pb-12">
        <PageHeading
          actions={
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {googleConnected ? null : (
                <Button
                  className="rounded-full"
                  onClick={onConnectGoogle}
                  variant="outline"
                >
                  <img
                    alt=""
                    className="size-[18px]"
                    src="/google-ads-icon.svg"
                  />
                  Connect Google Ads
                </Button>
              )}
              {metaConnected ? null : (
                <Button
                  className="rounded-full"
                  onClick={onConnectMeta}
                  variant="outline"
                >
                  <MetaMark />
                  Connect Meta
                </Button>
              )}
              <Button onClick={onToggleCompact} variant="outline">
                {compact ? "Show large" : "Show compact"}
              </Button>
              <Button
                onClick={() =>
                  void navigate({ search: adsSearch(), to: "/cms/ads/new" })
                }
              >
                + New ad
              </Button>
            </div>
          }
          onOpenDestinations={onOpenDestinations}
          narrowTitle="Ads"
          title="Your ads"
        />
        <div className="mt-2">
          <p className="mb-5 text-[13px] leading-snug text-muted-foreground">
            Ads usually run 6 at a time, so cards are large; more than 6
            compress automatically. Sorted: active first, then newest.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {active.map((ad) => (
              <Link
                className={card(
                  "relative rounded-prompt border-hairline p-2.5 text-left shadow-prompt hover:bg-wash",
                  compact ? "flex items-center gap-3" : "block",
                )}
                key={ad.id}
                params={{ adId: ad.id }}
                search={adsSearch()}
                to="/cms/ads/$adId"
              >
                <span
                  className={cn("relative", compact ? "shrink-0" : "block")}
                >
                  <img
                    alt=""
                    className={cn(
                      "pointer-events-none block object-cover object-[50%_32%] transition-[width,height,border-radius] duration-200 ease-out",
                      compact
                        ? "aspect-square h-[84px] w-[84px] max-h-[84px] max-w-[84px] flex-none self-center rounded-xl"
                        : "h-44 w-full rounded-[18px]",
                    )}
                    draggable={false}
                    src={ad.image}
                  />
                  <button
                    aria-label="Archive"
                    className="absolute top-1.5 right-1.5 z-10 grid size-7 place-items-center rounded-lg bg-white/90 text-red-700 hover:bg-red-50"
                    onClick={(event: MouseEvent<HTMLButtonElement>) => {
                      event.preventDefault();
                      event.stopPropagation();
                      archiveAd(ad.id);
                    }}
                    type="button"
                  >
                    <ArchiveIcon
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={1.6}
                    />
                  </button>
                </span>
                <span
                  className={cn(
                    compact ? "min-w-0 py-1" : "block px-2 pt-3 pb-2",
                  )}
                >
                  <b
                    className={cn(
                      "block font-semibold tracking-tight",
                      compact ? "text-[13px]" : "text-[15px]",
                    )}
                  >
                    {ad.title}
                  </b>
                  <span className="mt-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        ad.ready
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-zinc-100 text-muted-foreground",
                      )}
                    >
                      {ad.status}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {ad.meta}
                    </span>
                  </span>
                  {compact ? null : (
                    <span className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground grayscale">
                      <span>
                        Impressions{" "}
                        <b className="font-semibold text-foreground">—</b>
                      </span>
                      <span>
                        Clicks{" "}
                        <b className="font-semibold text-foreground">—</b>
                      </span>
                      <span>
                        Spend <b className="font-semibold text-foreground">—</b>
                      </span>
                      <span className="w-full text-[11px] text-zinc-400">
                        Performance appears once ad posting is connected
                      </span>
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
          {toast ? (
            <div className="mt-3 rounded-lg border border-border bg-zinc-50 px-3 py-2 text-sm">
              Archived an ad.{" "}
              <button
                className="underline"
                onClick={() => {
                  setHiddenId(null);
                  setToast(false);
                }}
                type="button"
              >
                Undo
              </button>
            </div>
          ) : null}
          <div className="mt-7">
            <button
              aria-controls="archiveList"
              aria-expanded={archiveOpen}
              className="flex w-full items-center justify-between rounded-lg py-1 text-left text-sm font-medium"
              onClick={() => setArchiveOpen((value) => !value)}
              type="button"
            >
              Archive
              <span className="text-muted-foreground">
                {archiveOpen ? "▴" : "▾"}
              </span>
            </button>
            {archiveOpen ? (
              <div
                className="mt-2.5 grid grid-cols-1 gap-5 sm:grid-cols-2"
                id="archiveList"
              >
                {archived.map((ad) => (
                  <div
                    className={card(
                      "rounded-prompt border-hairline p-2.5 shadow-prompt",
                    )}
                    key={ad.id}
                  >
                    <img
                      alt=""
                      className="h-44 w-full rounded-[18px] object-cover object-[50%_32%]"
                      src={ad.image}
                    />
                    <div className="px-2 pt-3 pb-2">
                      <b className="block text-[15px] font-semibold tracking-tight">
                        {ad.title}
                      </b>
                      <span className="mt-2 block truncate text-xs text-muted-foreground">
                        {ad.meta}
                      </span>
                      <Button
                        className="mt-3"
                        onClick={() => {
                          setReleasedIds((ids) => [...ids, ad.id]);
                          setHiddenId((id) => (id === ad.id ? null : id));
                          setToast(false);
                        }}
                        variant="outline"
                      >
                        Unarchive
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaMark(): ReactNode {
  return (
    <svg aria-hidden="true" className="size-[18px]" viewBox="0 0 24 24">
      <path
        d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
        className="fill-brand-facebook"
      />
    </svg>
  );
}
