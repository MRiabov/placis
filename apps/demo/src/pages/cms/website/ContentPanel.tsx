import { type ReactNode, useState } from "react";

import { cn } from "@/lib/cn";
import { type MediaLibraryItem, mediaLibraryItems } from "@/lib/media-library";
import type { SiteSection } from "@/pages/cms/website/FakeSite";
import { Combo } from "@/ui/Combo";
import { panel } from "@/ui/card";
import { Field, Select, TextArea, TextInput } from "@/ui/Field";
import { MediaThumbs } from "@/ui/MediaThumbs";

type ContentPanelProps = {
  section: SiteSection;
  hidden: boolean;
  onToggleHidden: () => void;
};

const labels: Record<SiteSection, string> = {
  "top-menu": "Top menu",
  hero: "Hero",
  services: "Services",
  reviews: "Reviews",
  form: "Website form",
  footer: "Footer",
};

const navPages = [
  { id: "home", title: "Home" },
  { id: "services", title: "Roof repairs" },
  { id: "contact", title: "Contact" },
  { id: "privacy", title: "Privacy" },
  { id: "terms", title: "Terms" },
];

const menuUrls = [
  {
    id: "https://bellfield.ie/emergency",
    title: "Emergency",
    hint: "https://bellfield.ie/emergency",
  },
  {
    id: "https://www.facebook.com/bellfieldroofing",
    title: "Facebook",
    hint: "https://www.facebook.com/bellfieldroofing",
  },
];

const reviews = [
  {
    name: "Aoife K.",
    cite: "On the roof the next morning after the storm. Clean site, fair price.",
  },
  {
    name: "Mark D.",
    cite: "Replaced the back slope and left the garden better than they found it.",
  },
];

const iconButtonClass =
  "grid size-[34px] place-items-center rounded-lg border border-zinc-300 bg-white text-foreground hover:bg-zinc-50";

export function ContentPanel({
  section,
  hidden,
  onToggleHidden,
}: ContentPanelProps): ReactNode {
  const [library, setLibrary] = useState(mediaLibraryItems);
  const [image, setImage] = useState(() => {
    const item = mediaLibraryItems[0];
    if (!item) {
      throw new Error("media library is empty");
    }
    return item;
  });

  return (
    <div className="grid">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px]">{labels[section]}</p>
        <div className="flex items-center gap-1.5">
          <button
            aria-checked={!hidden}
            aria-label={
              hidden ? "Show website section" : "Hide website section"
            }
            className={cn(
              iconButtonClass,
              hidden ? "text-muted-foreground" : "",
            )}
            onClick={onToggleHidden}
            role="switch"
            title={hidden ? "Show website section" : "Hide website section"}
            type="button"
          >
            {hidden ? (
              <svg
                aria-hidden="true"
                className="size-4 fill-none stroke-current stroke-[1.6]"
                viewBox="0 0 24 24"
              >
                <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                <path d="m2 2 20 20" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="size-4 fill-none stroke-current stroke-[1.6]"
                viewBox="0 0 24 24"
              >
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
          <button
            aria-label="Move website section up"
            className={iconButtonClass}
            title="Move website section up"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-4 fill-none stroke-current stroke-[1.6]"
              viewBox="0 0 24 24"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
          <button
            aria-label="Move website section down"
            className={iconButtonClass}
            title="Move website section down"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-4 fill-none stroke-current stroke-[1.6]"
              viewBox="0 0 24 24"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
      {section === "hero" || section === "services" ? (
        <>
          <Field className="mb-3.5" label="Headline">
            <TextInput defaultValue="Roofs that keep Irish weather out." />
          </Field>
          <Field className="mb-3.5" label="Body">
            <TextArea defaultValue="Repairs, re-roofs, and emergency call-outs across Dublin and North County. {{marketing_phone}}" />
          </Field>
          <Field className="mb-3.5" label="Image">
            <div
              className="min-h-[88px] rounded-[10px] bg-placeholder bg-cover bg-center"
              style={{ backgroundImage: `url(${image.src})` }}
            />
            <div className="mt-2">
              <MediaThumbs
                items={library}
                onPick={setImage}
                onUpload={(file) => {
                  const src = URL.createObjectURL(file);
                  const item: MediaLibraryItem = {
                    by: "owner",
                    caption: "",
                    id: src,
                    ratio: "landscape",
                    src,
                    status: "approved",
                  };
                  setLibrary((current) => [item, ...current]);
                  setImage(item);
                }}
                selectedId={image.id}
              />
            </div>
            <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
              Pending-review AI image — publishing still needs approved media.
            </p>
          </Field>
        </>
      ) : null}
      {section === "reviews" ? (
        <div className="grid gap-2">
          {reviews.map((review) => (
            <article
              className={panel(
                "relative grid gap-1.5 p-3 shadow-[inset_0_0_0_1px_var(--color-primary)]",
              )}
              key={review.name}
            >
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 grid grid-cols-2 grid-rows-3 gap-0.5 opacity-45"
              >
                <i className="size-[3px] rounded-full bg-muted-foreground" />
                <i className="size-[3px] rounded-full bg-muted-foreground" />
                <i className="size-[3px] rounded-full bg-muted-foreground" />
                <i className="size-[3px] rounded-full bg-muted-foreground" />
                <i className="size-[3px] rounded-full bg-muted-foreground" />
                <i className="size-[3px] rounded-full bg-muted-foreground" />
              </span>
              <div className="text-[13px] tracking-wide text-yellow-500">
                ★★★★★
              </div>
              <b className="text-[13px] font-semibold">{review.name}</b>
              <p className="text-xs leading-snug">{review.cite}</p>
              <p className="text-[11px] text-muted-foreground">
                Google Maps listing
              </p>
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <input defaultChecked type="checkbox" /> On this website section
              </label>
            </article>
          ))}
        </div>
      ) : null}
      {section === "top-menu" ? (
        <>
          <div className="mb-4 grid gap-2">
            <NavRow kind="page" page="home" />
            <NavRow kind="text" text="Services" />
            <div className="ml-3.5 grid gap-2 border-l border-border pl-2.5">
              <NavRow kind="page" page="services" />
              <NavRow
                href="https://bellfield.ie/emergency"
                kind="url"
                label="Emergency"
              />
            </div>
            <NavRow kind="page" page="contact" />
          </div>
          <VisibilityRow checked label="Show marketing phone" />
          <VisibilityRow label="Show marketing email" />
          <VisibilityRow checked label="Show contact" />
        </>
      ) : null}
      {section === "footer" ? (
        <>
          <div className="mb-4 grid gap-2">
            <NavRow kind="page" page="privacy" />
            <NavRow kind="page" page="terms" />
          </div>
          <VisibilityRow checked label="Show marketing phone" />
          <VisibilityRow checked label="Show marketing email" />
          <VisibilityRow checked label="Show contact" />
        </>
      ) : null}
      {section === "form" ? (
        <>
          <Field className="mb-3.5" label="Website form title">
            <TextInput defaultValue="Request a call back" />
          </Field>
          <Field className="mb-3.5" label="Typed fields">
            <TextInput defaultValue="Name" />
            <TextInput className="mt-2" defaultValue="Marketing phone" />
          </Field>
          <Field className="mb-3.5" label="Privacy notice">
            <TextArea defaultValue="We use this to call you back about the job." />
          </Field>
          <Field className="mb-3.5" label="submit_action">
            <TextInput defaultValue="create_website_lead" />
          </Field>
        </>
      ) : null}
    </div>
  );
}

function NavRow({
  kind: initialKind,
  page = "home",
  text = "",
  href = "https://bellfield.ie/emergency",
  label = "Emergency",
}: {
  kind: "page" | "text" | "url";
  page?: string;
  text?: string;
  href?: string;
  label?: string;
}): ReactNode {
  const [kind, setKind] = useState(initialKind);
  const [url, setUrl] = useState(href);

  return (
    <div className="grid gap-1.5">
      <Select
        aria-label="Kind"
        onChange={(event) =>
          setKind(event.target.value as "page" | "text" | "url")
        }
        value={kind}
      >
        <option value="page">Website page</option>
        <option value="text">Text</option>
        <option value="url">URL</option>
      </Select>
      {kind === "page" ? (
        <Select aria-label="Website page" defaultValue={page}>
          {navPages.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </Select>
      ) : null}
      {kind === "text" ? (
        <TextInput aria-label="Text" defaultValue={text} />
      ) : null}
      {kind === "url" ? (
        <Combo
          createKind="URL"
          groupLabel="Existing URLs"
          onChange={(value, option) => setUrl(option?.id ?? value)}
          options={menuUrls}
          placeholder="Select or type to create a new URL…"
          value={url || label}
        />
      ) : null}
    </div>
  );
}

function VisibilityRow({
  label,
  checked: initial = false,
}: {
  label: string;
  checked?: boolean;
}): ReactNode {
  const [on, setOn] = useState(initial);
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <span className="text-[13px] tracking-tight text-zinc-600">{label}</span>
      <button
        aria-checked={on}
        aria-label={label}
        className={cn(
          "relative h-6 w-10 min-w-10 overflow-hidden rounded-full border border-zinc-300 max-[1100px]:min-w-11",
          on ? "bg-usage-text" : "bg-zinc-300",
        )}
        onClick={() => setOn((value) => !value)}
        role="switch"
        type="button"
      >
        <span
          className={cn(
            "absolute top-[3px] block size-4 rounded-full bg-white shadow-[0_0_0_1px_rgb(0_0_0_/_10%),0_1px_2px_rgb(0_0_0_/_16%)]",
            on ? "left-[19px]" : "left-[3px]",
          )}
        />
      </button>
    </div>
  );
}
