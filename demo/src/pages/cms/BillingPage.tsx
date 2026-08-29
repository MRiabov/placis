import { Check } from "lucide-react";
import { type ReactNode, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { cn } from "@/lib/cn";
import { useCmsLayout } from "@/shell/CmsShell";
import { Button } from "@/ui/Button";
import { Notice } from "@/ui/Notice";
import { PageHeading } from "@/ui/PageHeading";

type BillingKind = "ok" | "warn" | "empty" | "ending" | "canceled";
type SelfServePlan = "pro" | "pro-plus" | "pro-max";
type BillingInterval = "month" | "year";

const kinds: BillingKind[] = ["ok", "warn", "empty", "ending", "canceled"];

const kindLabels: Record<BillingKind, string> = {
  canceled: "Subscription not active",
  empty: "Out of usage credit",
  ending: "Cancels at period end",
  ok: "Pool remaining",
  warn: "20% left",
};

const pools: Record<
  BillingKind,
  { remaining: string; voice: string; image: string; text: string }
> = {
  canceled: { image: "16%", remaining: "$80", text: "11%", voice: "18%" },
  empty: { image: "35%", remaining: "$0", text: "25%", voice: "40%" },
  ending: { image: "16%", remaining: "$80", text: "11%", voice: "18%" },
  ok: { image: "16%", remaining: "$80", text: "11%", voice: "18%" },
  warn: { image: "28%", remaining: "$20", text: "20%", voice: "32%" },
};

const sharedPlanFeatures = [
  "Website from a template, then edit",
  "Ads ready to post (Google and Meta)",
  "Voice",
  "Publish on your domain",
];

const selfServePlans: {
  id: SelfServePlan;
  name: string;
  monthly: number;
  yearlyPerMonth: number;
  includedUsageCredit: number;
  blurb: string;
  features: string[];
}[] = [
  {
    blurb: "Website, ads, and Voice.",
    features: sharedPlanFeatures,
    id: "pro",
    includedUsageCredit: 100,
    monthly: 599,
    name: "Placis Pro plan",
    yearlyPerMonth: 479,
  },
  {
    blurb: "More usage credit for website, ads, and Voice.",
    features: sharedPlanFeatures,
    id: "pro-plus",
    includedUsageCredit: 400,
    monthly: 799,
    name: "Placis Pro Plus plan",
    yearlyPerMonth: 639,
  },
  {
    blurb: "The most included usage credit for website, ads, and Voice.",
    features: sharedPlanFeatures,
    id: "pro-max",
    includedUsageCredit: 1500,
    monthly: 1099,
    name: "Placis Pro Max plan",
    yearlyPerMonth: 879,
  },
];

const raisedCardClass =
  "rounded-2xl border border-stone-200 bg-white shadow-md sm:rounded-[28px]";

function intervalPillClass(active: boolean): string {
  return cn(
    "inline-flex h-8 items-center rounded-full px-4 text-[13px] font-medium transition",
    active
      ? "bg-primary text-primary-foreground"
      : "text-zinc-500 hover:text-foreground",
  );
}

function usd(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

function usageCreditFeature(amount: number): string {
  return `${usd(amount)} usage credit a month`;
}

function isBillingKind(value: string | null): value is BillingKind {
  return value !== null && (kinds as readonly string[]).includes(value);
}

function initialKind(): BillingKind {
  const value = new URLSearchParams(window.location.search).get("billing");
  return isBillingKind(value) ? value : "ok";
}

export function BillingPage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const [kind, setKind] = useState<BillingKind>(initialKind);
  const [selectedPlan, setSelectedPlan] = useState<SelfServePlan>("pro");
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [noticeOpen, setNoticeOpen] = useState(
    () => kind === "warn" || kind === "empty",
  );
  const pool = pools[kind];
  const yearly = interval === "year";
  const current = selfServePlans.find((plan) => plan.id === selectedPlan);
  const showCurrent = kind !== "canceled";
  const payAgain = kind === "canceled";
  const currentPrice = current
    ? yearly
      ? current.yearlyPerMonth
      : current.monthly
    : 599;
  const currentPriceLabel = yearly
    ? `${usd(currentPrice)} / mo, billed yearly`
    : `${usd(currentPrice)} / mo`;

  function applyKind(next: BillingKind): void {
    setKind(next);
    setNoticeOpen(next === "warn" || next === "empty");
  }

  function choosePlan(id: SelfServePlan): void {
    if (kind === "canceled" || kind === "ending") {
      applyKind("ok");
    }
    setSelectedPlan(id);
  }

  return (
    <>
      <DevStrip
        groups={[
          {
            title: "Usage & billing",
            tabs: kinds.map((id) => ({
              id,
              label: kindLabels[id],
              on: kind === id,
              onSelect: () => applyKind(id),
            })),
          },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <PageHeading
          onOpenDestinations={openDestinations}
          title="Usage & billing"
        />
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Unused usage credit carries over.
        </p>
        <div className="mt-6 max-w-3xl">
          <section className={cn("max-w-xl p-5 sm:p-6", raisedCardClass)}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {kind === "canceled"
                  ? (current?.name ?? "Placis Pro plan")
                  : `${current?.name ?? "Placis Pro plan"} · ${currentPriceLabel}`}
              </p>
              {kind === "canceled" ? (
                <StatusPill>Subscription is not active</StatusPill>
              ) : null}
              {kind === "ending" ? (
                <StatusPill>Cancels on 29 Sep</StatusPill>
              ) : null}
            </div>
            <p className="mt-4 text-[40px] leading-none font-semibold tracking-tight">
              {pool.remaining}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">remaining</p>
            <div
              aria-label="Usage credit this period"
              className="mt-5 h-3.5 overflow-hidden rounded-full bg-zinc-100"
              role="img"
            >
              <div className="flex h-full">
                <span
                  className="block h-full bg-[#1d4ed8]"
                  style={{ width: pool.voice }}
                />
                <span
                  className="block h-full bg-[#a16207]"
                  style={{ width: pool.image }}
                />
                <span
                  className="block h-full bg-[#166534]"
                  style={{ width: pool.text }}
                />
              </div>
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
              <Legend color="bg-[#1d4ed8]" label="Voice" />
              <Legend color="bg-[#a16207]" label="Image" />
              <Legend color="bg-[#166534]" label="Text edits" />
              <Legend bordered color="bg-zinc-100" label="Remaining" />
            </ul>
            {kind === "canceled" ? (
              <p className="mt-5 text-sm">
                Pay the subscription price to Publish.
              </p>
            ) : null}
            <Button className="mt-5" variant={payAgain ? "outline" : "ink"}>
              Buy extra usage credit
            </Button>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold tracking-tight">
                Change plan
              </h2>
              <div className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1">
                <button
                  className={intervalPillClass(!yearly)}
                  onClick={() => setInterval("month")}
                  type="button"
                >
                  Monthly
                </button>
                <button
                  className={intervalPillClass(yearly)}
                  onClick={() => setInterval("year")}
                  type="button"
                >
                  Yearly
                  <span className="ml-1.5 text-[11px] opacity-70">−20%</span>
                </button>
              </div>
            </div>
            <div className="mt-4 grid w-full items-stretch gap-3 sm:grid-cols-3 sm:gap-4">
              {selfServePlans.map((plan) => {
                const currentRow = showCurrent && plan.id === selectedPlan;
                const amount = yearly ? plan.yearlyPerMonth : plan.monthly;
                return (
                  <article
                    aria-current={currentRow ? "true" : undefined}
                    className={cn(
                      "flex h-full flex-col p-4 sm:p-5",
                      raisedCardClass,
                      currentRow && "border-stone-300 bg-zinc-50/80",
                    )}
                    key={plan.id}
                  >
                    <p className="text-[15px] leading-snug font-semibold sm:text-lg">
                      {plan.name}
                    </p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-[26px] font-semibold tracking-tight sm:text-[28px]">
                        {usd(amount)}
                      </span>
                      <span className="text-[12px] text-zinc-500 sm:text-[13px]">
                        / mo{yearly ? ", billed yearly" : ""}
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] leading-[1.45] text-zinc-500 sm:text-[13px]">
                      {plan.blurb}
                    </p>
                    <ul className="mt-3 flex-1 space-y-1.5 sm:mt-4">
                      {[
                        usageCreditFeature(plan.includedUsageCredit),
                        ...plan.features,
                      ].map((feature) => (
                        <li className="flex items-start gap-2" key={feature}>
                          <Check
                            className="mt-0.5 size-3 shrink-0 text-zinc-400"
                            strokeWidth={2.5}
                          />
                          <span className="text-[12px] leading-[1.45] text-zinc-600">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <button
                      aria-label={
                        currentRow
                          ? `Current · ${plan.name}`
                          : `Choose ${plan.name}`
                      }
                      className={cn(
                        "mt-auto inline-flex h-9 w-full items-center justify-center rounded-full px-4 text-[13px] font-medium sm:mt-5 sm:h-10",
                        currentRow
                          ? "cursor-default border border-stone-200 bg-white text-muted-foreground"
                          : payAgain
                            ? "border-black/10 bg-primary text-primary-foreground hover:bg-zinc-800"
                            : "border border-stone-200 bg-white hover:bg-zinc-50",
                      )}
                      disabled={currentRow}
                      onClick={() => choosePlan(plan.id)}
                      type="button"
                    >
                      {currentRow ? "Current" : "Choose"}
                    </button>
                  </article>
                );
              })}
            </div>
            <div
              className={cn(
                "mt-3 flex w-full flex-col items-start gap-3 px-4 py-4 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5",
                raisedCardClass,
              )}
            >
              <div>
                <p className="text-[15px] font-semibold sm:text-lg">
                  Enterprise plan
                </p>
                <p className="mt-1 max-w-[52ch] text-[12px] leading-[1.45] text-zinc-500 sm:text-[13px]">
                  For teams: custom usage credit and dedicated support.
                </p>
              </div>
              <button
                className="inline-flex h-9 w-full shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white px-4 text-[13px] font-medium hover:bg-zinc-50 sm:h-10 sm:w-auto sm:px-5"
                type="button"
              >
                Contact sales
              </button>
            </div>
          </section>

          {kind === "canceled" ? null : (
            <div className="mt-10 max-w-xl border-t border-border pt-5">
              {kind === "ending" ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Cancels on 29 Sep. You can still Publish until then.
                  </p>
                  <Button className="mt-3" onClick={() => applyKind("ok")}>
                    Keep subscription
                  </Button>
                </>
              ) : (
                <button
                  className="text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() => applyKind("ending")}
                  type="button"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {noticeOpen && (kind === "warn" || kind === "empty") ? (
        <Notice
          message={
            kind === "empty"
              ? "You are out of usage credit."
              : "You're running out of usage credit."
          }
          onPrimary={() => setNoticeOpen(false)}
          onSecondary={() => setNoticeOpen(false)}
          primary="Usage & billing"
          secondary="Dismiss"
        />
      ) : null}
    </>
  );
}

function StatusPill({ children }: { children: ReactNode }): ReactNode {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}

function Legend({
  bordered,
  color,
  label,
}: {
  bordered?: boolean;
  color: string;
  label: string;
}): ReactNode {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5">
      <i
        className={cn(
          "size-2 rounded-full",
          color,
          bordered && "ring-1 ring-stone-300 ring-inset",
        )}
      />
      {label}
    </li>
  );
}
