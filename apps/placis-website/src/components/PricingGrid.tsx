import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";

import { onboardingHref } from "../lib/appOrigin";
import {
  PROMPT_BOX_COMPACT_BORDER_CLASS,
  RAISED_OUTLINE_CLASS,
} from "../lib/marketingSite";

type BillingInterval = "month" | "year";

type SelfServePlan = {
  id: "pro" | "pro-plus" | "pro-max";
  name: string;
  monthly: number;
  yearlyPerMonth: number;
  includedUsageCredit: number;
  blurb: string;
  features: string[];
};

const PLAN_CARD_CLASS = `rounded-2xl sm:rounded-[28px] bg-card ${PROMPT_BOX_COMPACT_BORDER_CLASS}`;

const sharedPlanFeatures = [
  "Website from a template, then edit",
  "Ads ready to post (Google and Meta)",
  "Voice",
  "Publish on your domain",
];

const plans: SelfServePlan[] = [
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

const intervalPillClass = (active: boolean) =>
  `inline-flex h-8 items-center rounded-full px-4 font-medium text-[13px] transition ${
    active
      ? "bg-primary text-primary-foreground"
      : "text-zinc-500 hover:text-foreground dark:text-zinc-400"
  }`;

function usd(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

function usageCreditFeature(amount: number): string {
  return `${usd(amount)} usage credit a month`;
}

export function PricingGrid() {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const yearly = interval === "year";
  const chooseHref = onboardingHref();

  return (
    <>
      <div
        className={`mt-5 inline-flex items-center gap-1 rounded-full p-1 sm:mt-8 ${PROMPT_BOX_COMPACT_BORDER_CLASS} bg-card`}
      >
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

      <div className="mx-auto mt-4 grid w-full max-w-[18rem] items-stretch gap-3 text-left sm:mt-6 sm:max-w-3xl sm:grid-cols-3 sm:gap-4">
        {plans.map((plan) => (
          <div className={`flex h-full flex-col p-4 sm:p-5 ${PLAN_CARD_CLASS}`} key={plan.id}>
            <p className="font-semibold text-[15px] text-foreground leading-snug sm:text-lg">{plan.name}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-semibold text-[26px] text-foreground tracking-tight sm:text-[28px]">
                {usd(yearly ? plan.yearlyPerMonth : plan.monthly)}
              </span>
              <span className="text-[12px] text-zinc-500 sm:text-[13px] dark:text-zinc-400">
                / mo{yearly ? ", billed yearly" : ""}
              </span>
            </div>
            <p className="mt-2 text-[12px] text-zinc-500 leading-[1.45] sm:text-[13px] dark:text-zinc-400">
              {plan.blurb}
            </p>
            <ul className="mt-3 flex-1 space-y-1.5 sm:mt-4">
              {[usageCreditFeature(plan.includedUsageCredit), ...plan.features].map((feature) => (
                <li className="flex items-start gap-2" key={feature}>
                  <Check
                    className="mt-0.5 size-3 shrink-0 text-zinc-400 dark:text-zinc-500"
                    strokeWidth={2.5}
                  />
                  <span className="text-[12px] text-zinc-600 leading-[1.45] dark:text-zinc-400">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <a
              className="mt-auto inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-card px-4 font-medium text-[13px] text-foreground transition hover:bg-zinc-50 sm:mt-5 sm:h-10 dark:border-white/20 dark:hover:bg-zinc-900"
              href={chooseHref}
            >
              Choose {plan.name}
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        ))}
      </div>

      <div
        className={`mt-3 flex w-full max-w-[18rem] flex-col items-start gap-3 px-3 py-3 text-left sm:mt-4 sm:max-w-3xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:py-4 ${PLAN_CARD_CLASS}`}
      >
        <div>
          <p className="font-semibold text-[15px] text-foreground sm:text-lg">Enterprise plan</p>
          <p className="mt-1 max-w-[52ch] text-[12px] text-zinc-500 leading-[1.4] sm:mt-1.5 sm:text-[13px] sm:leading-[1.45] dark:text-zinc-400">
            For teams: custom usage credit and dedicated support.
          </p>
        </div>
        <a
          className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full px-4 font-medium text-[13px] sm:h-10 sm:w-auto sm:px-5 ${RAISED_OUTLINE_CLASS}`}
          href="/support/"
        >
          Contact sales
          <ArrowRight className="size-3.5" />
        </a>
      </div>
    </>
  );
}
