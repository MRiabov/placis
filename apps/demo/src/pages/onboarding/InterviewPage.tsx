import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { photo } from "@/lib/fixtures";
import { siteReviews } from "@/lib/site-copy";
import { useOnboardingDev } from "@/pages/onboarding/onboarding-dev";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";
import { FeaturedServices } from "@/ui/FeaturedServices";
import { Field, OnbPanel, TextArea, TextInput } from "@/ui/Field";
import { HoursPicker } from "@/ui/HoursPicker";
import { ServiceAreas } from "@/ui/ServiceAreas";
import { VoiceInterviewOverlay } from "@/ui/VoiceInterviewOverlay";

type InterviewState = "text" | "filled" | "few" | "noreviews";
type Channel = "text" | "voice";

export function InterviewPage(): ReactNode {
  const navigate = useNavigate();
  const { setExtraGroups } = useOnboardingDev();
  const [scene, setScene] = useState<InterviewState>("text");
  const [channel, setChannel] = useState<Channel>("text");
  const [ciri, setCiri] = useState(false);
  const [seai, setSeai] = useState(false);
  const filled = scene === "filled";
  const fewPhotos = scene === "few";
  const noReviews = scene === "noreviews";

  useEffect(() => {
    setExtraGroups([
      {
        title: "Questions",
        tabs: [
          {
            id: "text",
            label: "Text",
            on: scene === "text",
            onSelect: () => setScene("text"),
          },
          {
            id: "filled",
            label: "Filled",
            on: filled,
            onSelect: () => setScene("filled"),
          },
          {
            id: "few",
            label: "Few photos",
            on: fewPhotos,
            onSelect: () => setScene("few"),
          },
          {
            id: "noreviews",
            label: "No reviews",
            on: noReviews,
            onSelect: () => setScene("noreviews"),
          },
        ],
      },
    ]);
    return () => setExtraGroups([]);
  }, [setExtraGroups, scene, filled, fewPhotos, noReviews]);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        A few more details
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Fill in anything we could not find. You can skip a field and come back
        later.
      </p>
      <div
        aria-label="How to answer"
        className="mt-6 flex w-fit gap-1 rounded-full border border-border bg-zinc-50 p-[3px]"
        role="tablist"
      >
        {(
          [
            ["text", "Write"],
            ["voice", "Voice"],
          ] as const
        ).map(([id, label]) => (
          <button
            aria-selected={channel === id}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px] font-medium",
              channel === id
                ? "bg-muted font-semibold text-foreground"
                : "text-muted-foreground",
            )}
            key={id}
            onClick={() => setChannel(id)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      {channel === "voice" ? (
        <VoiceInterviewOverlay onBack={() => setChannel("text")} />
      ) : (
        <form className="mt-6 grid gap-5">
          <OnbPanel
            hint="How the name and trade appear on the website."
            title="Your business"
          >
            <Field label="Display name">
              <TextInput defaultValue="Bellfield Roofing" />
            </Field>
            <Field label="Trade">
              <TextInput defaultValue="Roofer" />
            </Field>
          </OnbPanel>
          <OnbPanel hint="How people reach you." title="Contact">
            <Field label="Contact name">
              <TextInput
                defaultValue={filled ? "Aoife Bell" : ""}
                placeholder="Who should we ask for"
              />
            </Field>
            <Field label="Marketing phone">
              <TextInput defaultValue="01 555 0199" />
            </Field>
            <Field label="Marketing email">
              <TextInput
                defaultValue={filled ? "hello@bellfield.ie" : ""}
                placeholder="hello@bellfield.ie"
                type="email"
              />
            </Field>
            <Field label="Existing site URL">
              <TextInput
                defaultValue={filled ? "https://bellfield.ie" : ""}
                placeholder="https://"
                type="url"
              />
            </Field>
            <Field
              label="Emergency marketing phone"
              note="We’ll use this to reach you. It will not appear on the website."
            >
              <TextInput
                defaultValue={filled ? "087 555 0199" : ""}
                placeholder="How we reach you"
              />
            </Field>
          </OnbPanel>
          <OnbPanel
            hint="What you do and where you work."
            title="Services and service area"
          >
            <FeaturedServices />
            <ServiceAreas />
          </OnbPanel>
          <OnbPanel hint="When you take calls and jobs." title="Opening hours">
            <HoursPicker />
          </OnbPanel>
          <OnbPanel hint="Logo plus a few photos of the work." title="Photos">
            <div className="flex flex-wrap gap-2">
              <figure className="grid size-20 place-items-center overflow-hidden rounded-lg border border-border bg-white">
                <img
                  alt="Bellfield logo"
                  className="max-h-12 max-w-14 object-contain"
                  src="/fixtures/bellfield/logo.svg"
                />
                <figcaption className="text-[11px] text-muted-foreground">
                  Logo
                </figcaption>
              </figure>
              {(fewPhotos ? [0] : [0, 1, 2]).map((index) => (
                <img
                  alt=""
                  className="size-20 rounded-lg object-cover"
                  key={index}
                  src={photo(index)}
                />
              ))}
              <label className="grid size-20 cursor-pointer place-items-center rounded-lg border border-dashed border-stone-300 text-center text-[11px] text-muted-foreground">
                <input className="hidden" multiple type="file" />
                <b className="text-xs text-foreground">Upload photos</b>
                <span>Add more from this device</span>
              </label>
            </div>
            {fewPhotos ? (
              <div className="grid gap-2">
                <p className="text-[13px] text-muted-foreground">
                  Not enough photos yet. Pick one, or keep uploading.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button className={card("p-3 text-left")} type="button">
                    <b className="block text-sm">Find more online</b>
                    <span className="text-xs text-muted-foreground">
                      Pull more listing photos into the media library.
                    </span>
                  </button>
                  <button className={card("p-3 text-left")} type="button">
                    <b className="block text-sm">Create a stand-in</b>
                    <span className="text-xs text-muted-foreground">
                      Draft a photo until you upload approved ones.
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </OnbPanel>
          <OnbPanel
            hint="Trade listings and badges for the website."
            title="Certifications"
          >
            <button
              aria-disabled="true"
              className={card(
                "flex items-start gap-3 bg-zinc-50 p-3 text-left",
              )}
              disabled
              type="button"
            >
              <img
                alt=""
                className="h-10 w-16 object-contain"
                src="/certification-logos/ie-cro.svg"
              />
              <span>
                <b className="block text-sm">CRO registered</b>
                <span className="block text-xs text-muted-foreground">
                  Registered Irish company or business name record.
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  From the company registry record
                </span>
              </span>
            </button>
            <CertChoice
              blurb="Construction Industry Register Ireland listing."
              logo="/certification-logos/ie-ciri.svg"
              on={ciri}
              onToggle={() => setCiri((value) => !value)}
              title="CIRI"
            />
            <CertChoice
              blurb="SEAI contractor registration for energy grants."
              logo="/certification-logos/ie-seai.svg"
              on={seai}
              onToggle={() => setSeai((value) => !value)}
              title="SEAI"
            />
            <Field label="Other certifications">
              <TextArea placeholder="Insurance, awards, guarantees, manufacturer certifications…" />
            </Field>
          </OnbPanel>
          <OnbPanel
            {...(noReviews ? {} : { hint: "Found on Google and Facebook." })}
            title="Reviews"
          >
            {noReviews ? (
              <label className="flex items-center gap-2 text-sm">
                <input defaultChecked type="checkbox" /> We do not have online
                reviews yet
              </label>
            ) : (
              <div className="grid gap-3">
                {siteReviews.map((review) => (
                  <article className={card("p-3")} key={review.name}>
                    <div className="flex items-center gap-2">
                      <img
                        alt=""
                        className="size-10 rounded-full object-cover"
                        src={photo(review.photo)}
                      />
                      <div className="min-w-0 flex-1">
                        <b className="block text-sm">{review.name}</b>
                        <span className="text-xs text-muted-foreground">
                          {review.meta}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-amber-700">
                      {review.stars} {review.when}
                    </p>
                    <p className="mt-1 text-sm">{review.quote}</p>
                  </article>
                ))}
              </div>
            )}
          </OnbPanel>
          <OnbPanel
            hint="Optional. What would help us generate you a better website or run your ads."
            title="Anything else we should know?"
          >
            <TextArea placeholder="Add a note" />
          </OnbPanel>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Saved automatically as you type.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  void navigate({ to: "/onboarding/review" });
                }}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  void navigate({ to: "/onboarding/preview" });
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function CertChoice({
  title,
  blurb,
  logo,
  on,
  onToggle,
}: {
  title: string;
  blurb: string;
  logo: string;
  on: boolean;
  onToggle: () => void;
}): ReactNode {
  return (
    <button
      className={cn(
        card("flex items-start gap-3 p-3 text-left"),
        on ? "border-primary bg-zinc-50" : "border-border",
      )}
      onClick={onToggle}
      type="button"
    >
      <img alt="" className="h-10 w-16 object-contain" src={logo} />
      <span>
        <b className="block text-sm">{title}</b>
        <span className="block text-xs text-muted-foreground">{blurb}</span>
      </span>
    </button>
  );
}
