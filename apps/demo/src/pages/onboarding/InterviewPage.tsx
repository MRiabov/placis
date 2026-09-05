import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { photo } from "@/lib/fixtures";
import type { MediaLibraryItem } from "@/lib/media-library";
import { siteReviews } from "@/lib/site-copy";
import { interviewProjectRows } from "@/pages/cms/project-rows";
import { useOnboardingDev } from "@/pages/onboarding/onboarding-dev";
import { Button } from "@/ui/Button";
import { CompleteWarning } from "@/ui/CompleteWarning";
import { card } from "@/ui/card";
import { FeaturedServices } from "@/ui/FeaturedServices";
import { Field, OnbPanel, TextArea, TextInput } from "@/ui/Field";
import { HoursPicker } from "@/ui/HoursPicker";
import { MediaThumbs } from "@/ui/MediaThumbs";
import { ProjectCard } from "@/ui/ProjectCard";
import { ServiceAreas } from "@/ui/ServiceAreas";
import { VoiceInterviewOverlay } from "@/ui/VoiceInterviewOverlay";

type InterviewState =
  | "text"
  | "filled"
  | "nophotos"
  | "manyphotos"
  | "noreviews"
  | "noprojects";
type Channel = "text" | "voice";

const fewWorkPhotos: MediaLibraryItem[] = [0, 1, 2].map((index) => ({
  by: "research",
  id: `interview-photo-${index}`,
  ratio: "landscape",
  src: photo(index),
  status: "approved",
}));

const workPhotoRatios: MediaLibraryItem["ratio"][] = [
  "landscape",
  "portrait",
  "landscape",
  "square",
];

const manyWorkPhotos: MediaLibraryItem[] = Array.from(
  { length: 30 },
  (_, index) => ({
    by: "research",
    id: `maps-photo-${index}`,
    ratio: workPhotoRatios[index % workPhotoRatios.length] ?? "landscape",
    src: `${photo(index % 4)}?maps=${index}`,
    status: "approved",
  }),
);

export function InterviewPage(): ReactNode {
  const navigate = useNavigate();
  const { setExtraGroups } = useOnboardingDev();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scene, setScene] = useState<InterviewState>("text");
  const [channel, setChannel] = useState<Channel>("text");
  const [ciri, setCiri] = useState(false);
  const [seai, setSeai] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [attachedPreviews, setAttachedPreviews] = useState<string[]>([]);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const filled = scene === "filled";
  const noPhotos = scene === "nophotos";
  const manyPhotos = scene === "manyphotos";
  const noReviews = scene === "noreviews";
  const noProjects = scene === "noprojects";
  const attachedItems: MediaLibraryItem[] = attachedPreviews.map((src) => ({
    by: "owner",
    id: src,
    ratio: "square",
    src,
    status: "approved",
  }));
  const workPhotos = [
    ...(noPhotos ? [] : manyPhotos ? manyWorkPhotos : fewWorkPhotos),
    ...attachedItems,
  ];
  const hasWorkPhotos = workPhotos.length > 0;
  const rankedProjects = interviewProjectRows
    .filter((row) => !archivedIds.includes(row.id))
    .slice(0, 4);

  useEffect(() => {
    function selectScene(next: InterviewState): void {
      setScene(next);
      setWarningOpen(false);
      setArchivedIds([]);
      setAttachedPreviews((current) => {
        for (const url of current) {
          URL.revokeObjectURL(url);
        }
        return [];
      });
    }

    setExtraGroups([
      {
        title: "Questions",
        tabs: [
          {
            id: "text",
            label: "Text",
            on: scene === "text",
            onSelect: () => selectScene("text"),
          },
          {
            id: "filled",
            label: "Filled",
            on: filled,
            onSelect: () => selectScene("filled"),
          },
          {
            id: "nophotos",
            label: "No photos",
            on: noPhotos,
            onSelect: () => selectScene("nophotos"),
          },
          {
            id: "manyphotos",
            label: "Many photos",
            on: manyPhotos,
            onSelect: () => selectScene("manyphotos"),
          },
          {
            id: "noreviews",
            label: "No reviews",
            on: noReviews,
            onSelect: () => selectScene("noreviews"),
          },
          {
            id: "noprojects",
            label: "No projects",
            on: noProjects,
            onSelect: () => selectScene("noprojects"),
          },
        ],
      },
    ]);
    return () => setExtraGroups([]);
  }, [
    setExtraGroups,
    scene,
    filled,
    noPhotos,
    manyPhotos,
    noReviews,
    noProjects,
  ]);

  useEffect(() => {
    return () => {
      for (const url of attachedPreviews) {
        URL.revokeObjectURL(url);
      }
    };
  }, [attachedPreviews]);

  function pickPhotos(): void {
    fileInputRef.current?.click();
  }

  function goPreview(): void {
    void navigate({ to: "/onboarding/preview" });
  }

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
          <OnbPanel hint="Logo plus photos of the work." title="Photos">
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
            <MediaThumbs
              className="max-h-80 overflow-y-auto"
              columns={4}
              items={workPhotos}
              onPick={() => undefined}
              onUpload={(file) => {
                setAttachedPreviews((current) => [
                  ...current,
                  URL.createObjectURL(file),
                ]);
              }}
              uploadRef={fileInputRef}
            />
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
          {noProjects ? null : (
            <OnbPanel hint="Past jobs we found online." title="Projects">
              <div className="grid grid-cols-2 gap-5">
                {rankedProjects.map((project) => (
                  <ProjectCard
                    description={project.description}
                    image={project.image}
                    key={project.id}
                    onArchive={() => {
                      setArchivedIds((ids) => [...ids, project.id]);
                    }}
                    title={project.title}
                  />
                ))}
              </div>
            </OnbPanel>
          )}
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
                  if (!hasWorkPhotos) {
                    setWarningOpen(true);
                    return;
                  }
                  goPreview();
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </form>
      )}
      {warningOpen ? (
        <CompleteWarning
          onDismiss={() => setWarningOpen(false)}
          onPrimary={() => {
            pickPhotos();
            setWarningOpen(false);
          }}
          onSecondary={() => {
            setWarningOpen(false);
            goPreview();
          }}
          primary="Add photos"
          secondary="Skip"
          title="Create a website without photos?"
        >
          <p>
            The results will be much better if you attach photos. You may attach
            real photos later; we will use AI-generated images.
          </p>
        </CompleteWarning>
      ) : null}
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
