import { useNavigate, useSearch } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { useCmsLayout } from "@/layout/CmsLayout";
import { cn } from "@/lib/cn";
import {
  demoWebsite,
  type LeadRow,
  type LeadState,
  leadRows,
} from "@/pages/cms/leads/rows";
import { leadsSearch } from "@/pages/cms/leads/search";
import { Field, Select } from "@/ui/Field";
import { PageHeading } from "@/ui/PageHeading";

const websiteValue = `website:${demoWebsite.prefix}`;

function sourceValue(search: {
  source?: string | undefined;
  website_prefix?: string | undefined;
}): string {
  if (search.source === "ad") {
    return "ad";
  }
  if (search.source === "website") {
    return `website:${search.website_prefix ?? demoWebsite.prefix}`;
  }
  return "all";
}

function emptyCopy(source: string, adId: string | undefined): string {
  if (source === "ad" && adId) {
    return "No ad leads from this ad yet.";
  }
  if (source === "ad") {
    return "No ad leads yet.";
  }
  if (source.startsWith("website:")) {
    return `No website leads on ${demoWebsite.title} yet.`;
  }
  return "No website leads or ad leads yet.";
}

function sourceLabel(row: LeadRow): string {
  if (row.origin === "ad") {
    return row.adTitle ?? "Ads";
  }
  return row.websiteTitle ?? demoWebsite.title;
}

function matchesSource(
  row: LeadRow,
  source: string,
  adId: string | undefined,
): boolean {
  if (source === "all") {
    return true;
  }
  if (source === "ad") {
    if (row.origin !== "ad") {
      return false;
    }
    return adId === undefined || row.adId === adId;
  }
  if (source === websiteValue) {
    return row.origin === "website" && row.websitePrefix === demoWebsite.prefix;
  }
  return true;
}

export function LeadsPage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const empty = search.empty === "1";
  const source = sourceValue(search);
  const statusFilter =
    search.status === "new" ||
    search.status === "contacted" ||
    search.status === "closed"
      ? search.status
      : "all";
  const adId = typeof search.ad_id === "string" ? search.ad_id : undefined;
  const [statuses, setStatuses] = useState<Record<string, LeadState>>({});

  const rows = useMemo(() => {
    if (empty) {
      return [];
    }
    return leadRows.filter((row) => {
      const status = statuses[row.id] ?? row.status;
      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }
      return matchesSource(row, source, adId);
    });
  }, [adId, empty, source, statusFilter, statuses]);

  function setSource(next: string): void {
    if (next === "all") {
      void navigate({
        search: leadsSearch({
          ad_id: undefined,
          empty: undefined,
          source: undefined,
          website_prefix: undefined,
        }),
        to: "/cms/leads",
      });
      return;
    }
    if (next === "ad") {
      void navigate({
        search: leadsSearch({
          ad_id: undefined,
          empty: undefined,
          source: "ad",
          website_prefix: undefined,
        }),
        to: "/cms/leads",
      });
      return;
    }
    void navigate({
      search: leadsSearch({
        ad_id: undefined,
        empty: undefined,
        source: "website",
        website_prefix: demoWebsite.prefix,
      }),
      to: "/cms/leads",
    });
  }

  function setStatusFilter(next: string): void {
    void navigate({
      search: leadsSearch({
        empty: undefined,
        status: next === "all" ? undefined : next,
      }),
      to: "/cms/leads",
    });
  }

  return (
    <>
      <DevStrip
        groups={[
          {
            title: "Leads",
            tabs: [
              {
                id: "all",
                label: "All",
                on: source === "all" && !empty,
                onSelect: () => {
                  setSource("all");
                },
              },
              {
                id: "website",
                label: demoWebsite.title,
                on: source === websiteValue && !empty,
                onSelect: () => {
                  setSource(websiteValue);
                },
              },
              {
                id: "ads",
                label: "Ads",
                on: source === "ad" && !empty && adId === undefined,
                onSelect: () => {
                  setSource("ad");
                },
              },
              {
                id: "empty",
                label: "Empty",
                on: empty,
                onSelect: () => {
                  void navigate({
                    search: leadsSearch({ empty: "1" }),
                    to: "/cms/leads",
                  });
                },
              },
            ],
          },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-[960px] px-7 pt-8 pb-14 max-[1023px]:px-4 max-[1023px]:pt-6 max-[1023px]:pb-12">
          <PageHeading onOpenDestinations={openDestinations} title="Leads" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Source">
              <Select
                aria-label="Source"
                onChange={(event) => {
                  setSource(event.target.value);
                }}
                value={source}
              >
                <option value="all">All</option>
                <option value={websiteValue}>{demoWebsite.title}</option>
                <option value="ad">Ads</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                aria-label="Status"
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                }}
                value={statusFilter}
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </Select>
            </Field>
          </div>
          {rows.length === 0 ? (
            <EmptyPanel copy={emptyCopy(source, adId)} />
          ) : (
            <>
              <table className="mt-6 hidden w-full min-[1101px]:table">
                <thead>
                  <tr className="border-b border-hairline text-left text-[13px] text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Contact</th>
                    <th className="py-2 pr-3 font-medium">Source</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <LeadTableRow
                      key={row.id}
                      onStatus={(status) => {
                        setStatuses((current) => ({
                          ...current,
                          [row.id]: status,
                        }));
                      }}
                      row={row}
                      status={statuses[row.id] ?? row.status}
                    />
                  ))}
                </tbody>
              </table>
              <div className="mt-6 grid gap-3 min-[1101px]:hidden">
                {rows.map((row) => (
                  <LeadStackedRow
                    key={row.id}
                    onStatus={(status) => {
                      setStatuses((current) => ({
                        ...current,
                        [row.id]: status,
                      }));
                    }}
                    row={row}
                    status={statuses[row.id] ?? row.status}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function LeadTableRow({
  onStatus,
  row,
  status,
}: {
  onStatus: (status: LeadState) => void;
  row: LeadRow;
  status: LeadState;
}): ReactNode {
  return (
    <tr className="border-b border-hairline last:border-b-0">
      <td className="py-3 pr-3 align-top">
        <b className="block text-sm font-semibold tracking-tight">
          {row.contactName}
        </b>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {row.message}
        </span>
      </td>
      <td className="py-3 pr-3 align-top text-sm">
        <span className="block">{row.marketingPhone}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {row.marketingEmail}
        </span>
      </td>
      <td className="py-3 pr-3 align-top text-sm">{sourceLabel(row)}</td>
      <td className="py-3 pr-3 align-top">
        <StatusSelect onStatus={onStatus} status={status} />
      </td>
      <td className="py-3 align-top text-sm text-muted-foreground">
        {row.createdLabel}
      </td>
    </tr>
  );
}

function LeadStackedRow({
  onStatus,
  row,
  status,
}: {
  onStatus: (status: LeadState) => void;
  row: LeadRow;
  status: LeadState;
}): ReactNode {
  return (
    <div className="border-b border-hairline py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <b className="block text-sm font-semibold tracking-tight">
            {row.contactName}
          </b>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {row.message}
          </span>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {row.createdLabel}
        </span>
      </div>
      <p className="mt-2 text-sm">
        {row.marketingPhone}
        <span className="text-muted-foreground"> · {row.marketingEmail}</span>
      </p>
      <p className="mt-1 text-sm">{sourceLabel(row)}</p>
      <div className="mt-2 max-w-[12rem]">
        <StatusSelect onStatus={onStatus} status={status} />
      </div>
    </div>
  );
}

function EmptyPanel({ copy }: { copy: string }): ReactNode {
  return (
    <div
      className="mt-8 grid place-items-center rounded-[18px] border border-dashed border-stone-300 px-6 py-16 text-center"
      role="status"
    >
      <span className="grid size-12 place-items-center rounded-full bg-zinc-100 text-zinc-500">
        <Inbox aria-hidden="true" className="size-5" strokeWidth={1.6} />
      </span>
      <p className="mt-4 text-sm font-semibold tracking-tight">
        Nothing here yet
      </p>
      <p className="mt-1 max-w-sm text-sm leading-snug text-muted-foreground">
        {copy}
      </p>
    </div>
  );
}

function StatusSelect({
  onStatus,
  status,
}: {
  onStatus: (status: LeadState) => void;
  status: LeadState;
}): ReactNode {
  return (
    <select
      aria-label="Status"
      className={cn(
        "w-full min-w-0 min-h-9 rounded-lg border px-3 py-1.5 text-xs leading-[1.4] outline-none focus:ring-2 focus:ring-primary/20",
        status === "new"
          ? "border-amber-300 bg-amber-50 font-medium text-amber-800 focus:border-amber-400"
          : "border-border bg-zinc-50 text-foreground focus:border-primary",
      )}
      onChange={(event) => {
        onStatus(event.target.value as LeadState);
      }}
      value={status}
    >
      <option value="new">New</option>
      <option value="contacted">Contacted</option>
      <option value="closed">Closed</option>
    </select>
  );
}
