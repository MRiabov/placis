import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { useOnboardingDev } from "@/pages/onboarding/onboarding-dev";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";

type ReviewState = "found" | "filling" | "wait" | "conflict" | "ready";

const facts = [
  {
    id: "legal",
    label: "Legal name",
    value: "BELLFIELD ROOFING LIMITED",
    chip: "Company registry",
  },
  {
    id: "number",
    label: "Company number",
    value: "623184",
    chip: "Company registry",
  },
  {
    id: "office",
    label: "Registered office",
    value: "14 Bellfield Park, Dublin 12",
    chip: "Company registry",
  },
  {
    id: "display",
    label: "Display name",
    value: "Bellfield Roofing",
    chip: "Google Maps listing",
  },
  {
    id: "marketing-phone",
    label: "Marketing phone",
    value: "01 555 0199",
    chip: "Google Maps listing",
  },
  {
    id: "trade",
    label: "Trade",
    value: "Roofing contractor",
    chip: "Google Maps listing",
  },
  {
    id: "hours",
    label: "Opening hours",
    value: "Mon–Fri 07:00–18:00",
    chip: "Google Maps listing",
  },
  {
    id: "reviews",
    label: "Reviews",
    value: "86 Google reviews, 4.9",
    chip: "Google Maps listing",
  },
] as const;

export function ReviewPage(): ReactNode {
  const navigate = useNavigate();
  const { setExtraGroups } = useOnboardingDev();
  const [scene, setScene] = useState<ReviewState>("found");

  useEffect(() => {
    setExtraGroups([
      {
        title: "Review",
        tabs: [
          {
            id: "filling",
            label: "Still filling",
            on: scene === "filling",
            onSelect: () => setScene("filling"),
          },
          {
            id: "found",
            label: "Found vs missing",
            on: scene === "found",
            onSelect: () => setScene("found"),
          },
          {
            id: "wait",
            label: "Research wait",
            on: scene === "wait",
            onSelect: () => setScene("wait"),
          },
          {
            id: "conflict",
            label: "Research conflict",
            on: scene === "conflict",
            onSelect: () => setScene("conflict"),
          },
          {
            id: "ready",
            label: "Ready",
            on: scene === "ready",
            onSelect: () => setScene("ready"),
          },
        ],
      },
    ]);
    return () => setExtraGroups([]);
  }, [setExtraGroups, scene]);

  const found = scene === "ready" ? 12 : 8;
  const percent = scene === "ready" ? 100 : 62;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Review what we found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Check these details. You can continue even if some are still missing.
      </p>
      {scene === "wait" ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          We’ll look the business up again in a few minutes.
        </p>
      ) : null}
      <div className={card("mt-6 grid gap-4 p-5")}>
        <div>
          <p className="text-xs text-muted-foreground">
            Company registry record
          </p>
          <b>BELLFIELD ROOFING LIMITED</b>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["623184", "Normal", "Ireland"].map((badge) => (
              <span
                className="rounded-full border border-border px-2 py-0.5 text-xs"
                key={badge}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm">
            <b>{found} details found</b>
            <span>{percent}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full bg-primary"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        {scene === "ready" ? (
          <p className="text-sm text-muted-foreground">
            We have enough to start the website after a few questions.
          </p>
        ) : null}
        <div className="grid gap-3">
          {facts.map((fact) => (
            <Fact
              chip={fact.chip}
              hidden={scene === "conflict" && fact.id === "display"}
              key={fact.id}
              label={fact.label}
              value={fact.value}
            />
          ))}
          {scene === "filling" ? (
            <Fact
              chip="In progress"
              label="Marketing email"
              pending
              value="Looking this up from the current website…"
            />
          ) : null}
          {scene === "conflict" ? (
            <div
              className={card(
                "grid gap-2 border-amber-200 bg-amber-50 p-3 text-sm",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <b>Display name</b>
                  <p className="mt-1">
                    Two sources disagree. Pick one when we ask you questions.
                  </p>
                  <p className="mt-2 font-medium">These two don’t match</p>
                  <p>Google Maps listing: Bellfield Roofing</p>
                  <p>Current website: Bellfield Roof Repairs</p>
                </div>
                <span className="shrink-0 rounded-full border border-amber-300 px-2 py-0.5 text-xs">
                  Conflict
                </span>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={() => {
              void navigate({ to: "/onboarding/find" });
            }}
            variant="outline"
          >
            Back
          </Button>
          <Button
            onClick={() => {
              void navigate({ to: "/onboarding/interview" });
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  chip,
  pending,
  hidden,
}: {
  label: string;
  value: string;
  chip: string;
  pending?: boolean;
  hidden?: boolean;
}): ReactNode {
  if (hidden) {
    return null;
  }
  return (
    <div className={card("flex items-start justify-between gap-3 p-3 text-sm")}>
      <div>
        <b className="block text-[13px] font-normal tracking-tight text-zinc-600">
          {label}
        </b>
        <p
          className={cn(
            "mt-1 text-[15px] font-medium",
            pending ? "text-muted-foreground" : "",
          )}
        >
          {value}
        </p>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium",
          pending ? "bg-sky-50 text-sky-800" : "bg-emerald-50 text-emerald-800",
        )}
      >
        {pending ? null : (
          <svg
            aria-hidden="true"
            className="size-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            viewBox="0 0 24 24"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
        {chip}
      </span>
    </div>
  );
}
