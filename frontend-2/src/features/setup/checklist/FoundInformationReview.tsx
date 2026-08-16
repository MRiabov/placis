import { ArrowRight, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import type { CompanyRegistryCandidate } from "../api/setup";
import type { SetupChecklistRow } from "../api/setup";
import { cn } from "@/shared/lib/cn";
import { CompanySummary, FactTile } from "./checklistValues";

type FoundInformationReviewProps = {
  busy: boolean;
  company: CompanyRegistryCandidate | null;
  completeness: number;
  foundRows: SetupChecklistRow[];
  missingRows: SetupChecklistRow[];
  onContinue: () => void;
};

export function FoundInformationReview({
  busy,
  company,
  completeness,
  foundRows,
  missingRows,
  onContinue,
}: FoundInformationReviewProps): ReactNode {
  const missingCount = missingRows.length;
  const foundCount = foundRows.length;

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
      <div className="min-w-0">
        <div className="flex items-start gap-3 sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-2xl text-foreground">
              Review what we found
            </p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground leading-6">
              Confirm the source-backed details before the short interview.
            </p>
          </div>
        </div>

        {company ? <CompanySummary company={company} /> : null}

        <div className="mt-4 rounded-md border border-border bg-card px-3 py-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-foreground">
              {foundCount
                ? `${foundCount} details found`
                : "Waiting for confirmed details"}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {Math.round(completeness)}%
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-zinc-200">
            <div
              className="h-2 rounded-full bg-emerald-500"
              style={{ width: `${Math.max(0, Math.min(completeness, 100))}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {foundRows.length ? (
            foundRows
              .slice(0, 8)
              .map((row) => <FactTile key={row.id} row={row} />)
          ) : (
            <div className="rounded-md border border-border bg-muted px-3 py-3 text-sm text-muted-foreground">
              The selected source has not filled the checklist yet.
            </div>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24">
        <p className="font-semibold text-muted-foreground text-sm">Next</p>
        <h2 className="mt-1 font-semibold text-2xl text-foreground">
          Short interview
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-6">
          {missingCount
            ? `${missingCount} topic${missingCount === 1 ? "" : "s"} left before the website draft can be trusted.`
            : "We have enough to start preparing the first website draft."}
        </p>
        <SetupQueueList rows={missingRows} />
        <div>
          {!missingRows.length ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900 text-sm">
              Ready for the website draft.
            </div>
          ) : null}
        </div>
        <button
          className={cn(
            "mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md px-4 font-semibold text-sm transition",
            busy
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-foreground text-background hover:opacity-90",
          )}
          disabled={busy}
          onClick={onContinue}
          type="button"
        >
          Continue to interview
          <ArrowRight className="size-4" />
        </button>
      </aside>
    </section>
  );
}

type SetupQueueListProps = {
  limit?: number;
  rows: SetupChecklistRow[];
};

function SetupQueueList({
  limit = 5,
  rows,
}: SetupQueueListProps): ReactNode {
  return (
    <div className="mt-4 grid gap-2">
      {rows.slice(0, limit).map((row, index) => (
        <div
          className="flex items-center gap-2 border-b border-border pb-2 text-sm"
          key={row.id}
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-[11px] text-muted-foreground">
            {index + 1}
          </span>
          <span className="text-muted-foreground">{row.label}</span>
        </div>
      ))}
    </div>
  );
}
