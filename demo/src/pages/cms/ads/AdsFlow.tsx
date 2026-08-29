import { type ReactNode, useState } from "react";

import { cn } from "@/lib/cn";
import { AdsReview } from "@/pages/cms/ads/AdsReview";
import { Button } from "@/ui/Button";
import { Combo } from "@/ui/Combo";
import { Field } from "@/ui/Field";

const serviceOptions = [
  {
    id: "roofing-replacement",
    title: "Roofing replacement",
    hint: "roofing • Kildare",
  },
  { id: "roof-repair", title: "Roof repair", hint: "roofing • Kildare" },
  {
    id: "gutter-cleaning",
    title: "Gutter cleaning",
    hint: "guttering • Kildare",
  },
];

const profileOptions = [
  { id: "married", title: "Married couples, 30–40", hint: "most contractors" },
  {
    id: "homeowners",
    title: "Homeowners, 40–55",
    hint: "repairs and upgrades",
  },
  { id: "newlyweds", title: "Newlyweds, 25–35", hint: "first home" },
];

const areaOptions = [
  { id: "kildare", title: "Kildare area", hint: "your service area" },
  { id: "west-dublin", title: "West Dublin", hint: "nearby" },
  { id: "newbridge", title: "Newbridge & Naas", hint: "nearby" },
];

const formats = [
  ["feed_square", "Square feed"],
  ["feed_portrait", "Portrait feed"],
  ["carousel", "Carousel"],
  ["story", "Story"],
] as const;

type AdsFlowProps = {
  confirmed: boolean;
  generating: boolean;
  reviewOpen: boolean;
  reviewUnlocked: boolean;
  format: string;
  service: string;
  shot: boolean;
  onService: (value: string) => void;
  onFormat: (value: string) => void;
  onGenerate: () => void;
  onRevise: () => void;
  onToggleReview: () => void;
  onApprove: () => void;
  approved: boolean;
  generatedOnce: boolean;
};

export function AdsFlow({
  confirmed,
  generating,
  reviewOpen,
  reviewUnlocked,
  format,
  service,
  shot,
  onService,
  onFormat,
  onGenerate,
  onRevise,
  onToggleReview,
  onApprove,
  approved,
  generatedOnce,
}: AdsFlowProps): ReactNode {
  const [profile, setProfile] = useState("Married couples, 30–40");
  const [area, setArea] = useState("Kildare area");
  const [svcErr, setSvcErr] = useState(false);
  const [fmtErr, setFmtErr] = useState(false);

  function generate(): void {
    if (!service.trim()) {
      setSvcErr(true);
      return;
    }
    setSvcErr(false);
    if (!format) {
      setFmtErr(true);
      return;
    }
    setFmtErr(false);
    onGenerate();
  }

  return (
    <div className="relative mx-auto mt-6 max-w-[960px] overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
      <section className="border-b border-stone-200">
        <div className="flex items-center justify-between bg-zinc-50 px-4 py-3">
          <span className="font-medium">About the ad</span>
          <span className="text-sm text-muted-foreground">
            {confirmed ? "Confirmed" : "Open"}
          </span>
        </div>
        <div className="grid gap-4 p-4">
          <Field label="What are you promoting?">
            <Combo
              ariaLabel="Service"
              createKind="service"
              groupLabel="Your services"
              onChange={(value) => {
                onService(value);
                setSvcErr(false);
              }}
              options={[...serviceOptions]}
              placeholder="Select or type to create a new service…"
              value={service}
            />
            {svcErr ? (
              <p className="text-xs text-red-700">
                Choose the service you&apos;re promoting
              </p>
            ) : null}
          </Field>
          <p className="text-[13px] text-zinc-600">Who it&apos;s for</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Ideal customer profile">
              <Combo
                createKind="profile"
                groupLabel="Common profiles"
                onChange={setProfile}
                options={[...profileOptions]}
                placeholder="Select or type to create a new profile…"
                value={profile}
              />
            </Field>
            <Field label="Where they are">
              <Combo
                createKind="area"
                groupLabel="Your service area"
                onChange={setArea}
                options={[...areaOptions]}
                placeholder="Select or type to create a new area…"
                value={area}
              />
            </Field>
          </div>
          <div>
            <p className="mb-2 text-[13px] text-zinc-600">
              How people get in touch
            </p>
            <p className="mb-2 text-[13px] text-zinc-600">Questions</p>
            <div className="grid gap-1">
              {["Phone", "Full name", "Postcode", "Email"].map(
                (item, index) => (
                  <label className="flex items-center gap-2 text-sm" key={item}>
                    <input defaultChecked={index < 3} type="checkbox" />
                    {item}
                  </label>
                ),
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              People answer right in Facebook — no website page needed.
            </p>
          </div>
          <div>
            <p className="mb-2 text-[13px] text-zinc-600">Ad format</p>
            <div className="flex flex-wrap gap-2">
              {formats.map(([id, label]) => (
                <button
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    format === id
                      ? "border-primary bg-zinc-50"
                      : "border-stone-200",
                    confirmed && "opacity-60",
                  )}
                  disabled={confirmed}
                  key={id}
                  onClick={() => {
                    onFormat(id);
                    setFmtErr(false);
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            {fmtErr ? (
              <p className="mt-1 text-xs text-red-700">Pick a format</p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            {generatedOnce ? (
              <Button onClick={onRevise} variant="outline">
                Revise
              </Button>
            ) : null}
            <Button onClick={generate}>
              {generatedOnce ? "Generate again" : "Create ad and generate"}
            </Button>
          </div>
        </div>
      </section>
      <section>
        <button
          className="flex w-full items-center justify-between px-4 py-3 text-left disabled:opacity-50"
          disabled={!reviewUnlocked}
          onClick={onToggleReview}
          type="button"
        >
          <span className="font-medium">Review</span>
          <span className="text-sm text-muted-foreground">
            {reviewUnlocked
              ? reviewOpen
                ? "Open"
                : "Closed"
              : "Complete step 1 to unlock"}
          </span>
        </button>
        {reviewUnlocked && reviewOpen ? (
          <AdsReview format={format} shot={shot} />
        ) : null}
      </section>
      <div className="border-t border-stone-200 p-5">
        <b className="text-sm">Ready?</b>
        <p className="mt-1 mb-3 text-xs text-muted-foreground">
          Fix the errors shown inside the forms above, then approve.
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <span title="Publish is not available yet — ad posting to Meta is coming">
            <Button disabled variant="outline">
              Publish
            </Button>
          </span>
          <span
            title={
              approved
                ? "Download the ad set (temporary, until ad posting ships)"
                : "Approve the ad first"
            }
          >
            <Button disabled={!approved} variant="outline">
              Download
            </Button>
          </span>
          <Button disabled={!reviewUnlocked || approved} onClick={onApprove}>
            {approved ? "Approved" : "Approve"}
          </Button>
        </div>
      </div>
      {generating ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-white/85 p-6 text-center text-sm">
          <p>
            Drafting your ad… AI is picking photos and writing your text. This
            takes a moment — you can leave and come back.
          </p>
        </div>
      ) : null}
    </div>
  );
}
